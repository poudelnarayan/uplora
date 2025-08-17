import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// List of admin email addresses (credentials-only)
const ADMIN_EMAILS = [
  "kan77bct049@kec.edu.np",
];

interface DeletionState {
  databaseDeleted: boolean;
  s3Deleted: boolean;
  s3KeysDeleted: string[];
  errors: string[];
  rollbackData?: any;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  const deletionState: DeletionState = {
    databaseDeleted: false,
    s3Deleted: false,
    s3KeysDeleted: [],
    errors: []
  };

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Function to delete S3 objects with retry logic
  const deleteS3Objects = async (keys: string[]): Promise<{ success: boolean; deletedKeys: string[]; errors: string[] }> => {
    if (keys.length === 0) return { success: true, deletedKeys: [], errors: [] };
    
    const deletedKeys: string[] = [];
    const errors: string[] = [];
    
    for (const key of keys) {
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
          }));
          deletedKeys.push(key);
          success = true;
          console.log(`Successfully deleted S3 object: ${key}`);
        } catch (error) {
          retries--;
          const errorMessage = `Failed to delete S3 object ${key} (attempts left: ${retries}): ${error}`;
          console.error(errorMessage);
          
          if (retries === 0) {
            errors.push(errorMessage);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    }
    
    return {
      success: errors.length === 0,
      deletedKeys,
      errors
    };
  };

  // Function to rollback database changes
  const rollbackDatabase = async (rollbackData: any) => {
    try {
      console.log("Attempting database rollback...");
      
      // Recreate user if it was deleted
      if (rollbackData.user) {
        await prisma.user.create({
          data: rollbackData.user
        });
        console.log("User recreated successfully");
      }
      
      // Recreate teams if they were deleted
      if (rollbackData.teams && rollbackData.teams.length > 0) {
        for (const team of rollbackData.teams) {
          await prisma.team.create({
            data: team
          });
        }
        console.log("Teams recreated successfully");
      }
      
      // Recreate videos if they were deleted
      if (rollbackData.videos && rollbackData.videos.length > 0) {
        for (const video of rollbackData.videos) {
          await prisma.video.create({
            data: video
          });
        }
        console.log("Videos recreated successfully");
      }
      
      console.log("Database rollback completed successfully");
      return true;
    } catch (error) {
      console.error("Database rollback failed:", error);
      return false;
    }
  };

  try {
    // Step 1: Get user info and prepare rollback data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpires: true,
        createdAt: true,
        updatedAt: true,

        ownedTeams: {
          include: {
            members: true,
            invites: true
          }
        },
        teamMembers: {
          include: {
            team: true
          }
        },
        videos: true,
        uploadLock: true,
        sentInvites: true,
        receivedInvites: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (user.email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Prepare rollback data
    const rollbackData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hashedPassword: user.hashedPassword,
        emailVerified: user.emailVerified,
        verificationToken: user.verificationToken,
        verificationTokenExpires: user.verificationTokenExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

      },
      teams: user.ownedTeams,
      videos: user.videos,
      teamMembers: user.teamMembers,
      uploadLock: user.uploadLock,
      sentInvites: user.sentInvites,
      receivedInvites: user.receivedInvites
    };

    deletionState.rollbackData = rollbackData;

    // Step 2: Collect S3 keys to delete
    const s3KeysToDelete: string[] = [];
    
    // Add video files and thumbnails
    user.videos.forEach(video => {
      if (video.key) s3KeysToDelete.push(video.key);
      if (video.thumbnailKey) s3KeysToDelete.push(video.thumbnailKey);
    });

    console.log(`Preparing to delete ${s3KeysToDelete.length} S3 objects for user ${user.email}`);

    // Step 3: Delete database records in transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all videos owned by the user
        await tx.video.deleteMany({
          where: { userId }
        });

        // Delete upload locks
        await tx.uploadLock.deleteMany({
          where: { userId }
        });

        // Delete team invites sent by the user
        await tx.teamInvite.deleteMany({
          where: { inviterId: userId }
        });

        // Delete team invites received by the user
        await tx.teamInvite.updateMany({
          where: { inviteeId: userId },
          data: { inviteeId: null }
        });

        // Remove user from all teams they're a member of
        await tx.teamMember.deleteMany({
          where: { userId }
        });

        // Delete all teams owned by the user
        await tx.team.deleteMany({
          where: { ownerId: userId }
        });

        // Finally, delete the user account
        await tx.user.delete({
          where: { id: userId }
        });
      });

      deletionState.databaseDeleted = true;
      console.log("Database deletion completed successfully");
    } catch (error) {
      deletionState.errors.push(`Database deletion failed: ${error}`);
      throw new Error(`Database deletion failed: ${error}`);
    }

    // Step 4: Delete S3 files
    if (s3KeysToDelete.length > 0) {
      try {
        const s3Result = await deleteS3Objects(s3KeysToDelete);
        deletionState.s3Deleted = s3Result.success;
        deletionState.s3KeysDeleted = s3Result.deletedKeys;
        deletionState.errors.push(...s3Result.errors);

        if (s3Result.success) {
          console.log(`Successfully deleted ${s3Result.deletedKeys.length} S3 objects`);
        } else {
          console.warn(`S3 deletion completed with errors: ${s3Result.errors.length} failures`);
        }
      } catch (error) {
        deletionState.errors.push(`S3 deletion failed: ${error}`);
        console.error("S3 deletion failed:", error);
      }
    }

    // Step 5: Handle partial failures
    if (deletionState.databaseDeleted && !deletionState.s3Deleted && s3KeysToDelete.length > 0) {
      console.warn("Database deleted but S3 deletion failed. Consider manual cleanup.");
      // Don't rollback database for S3 failures as they can be cleaned up manually
    }

    // Step 6: Log the complete operation
    console.log(`Admin ${session.user.email} deleted user ${user.email}`, {
      deletedUser: user.email,
      deletedTeams: user.ownedTeams.length,
      deletedVideos: user.videos.length,
      deletedS3Objects: deletionState.s3KeysDeleted.length,
      s3Errors: deletionState.errors.filter(e => e.includes('S3')),
      removedFromTeams: user.teamMembers.length,
      deletedBy: session.user.email,
      timestamp: new Date().toISOString(),
      success: deletionState.databaseDeleted
    });

    // Step 7: Return response
    return NextResponse.json({ 
      success: deletionState.databaseDeleted,
      message: deletionState.databaseDeleted 
        ? `User ${user.email} has been permanently deleted`
        : "User deletion failed",
      deletedData: {
        teams: user.ownedTeams.length,
        videos: user.videos.length,
        s3Objects: deletionState.s3KeysDeleted.length,
        teamMemberships: user.teamMembers.length
      },
      warnings: deletionState.errors.length > 0 ? deletionState.errors : undefined
    });

  } catch (error) {
    console.error("User deletion error:", error);
    
    // Attempt rollback if database was partially modified
    if (deletionState.databaseDeleted && deletionState.rollbackData) {
      console.log("Attempting rollback due to error...");
      const rollbackSuccess = await rollbackDatabase(deletionState.rollbackData);
      
      if (rollbackSuccess) {
        return NextResponse.json({
          error: "User deletion failed but changes were rolled back",
          rollbackSuccessful: true
        }, { status: 500 });
      } else {
        return NextResponse.json({
          error: "User deletion failed and rollback was unsuccessful. Manual intervention required.",
          rollbackSuccessful: false,
          errors: deletionState.errors
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
        errors: deletionState.errors
      },
      { status: 500 }
    );
  }
}
