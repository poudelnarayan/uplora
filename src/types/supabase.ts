export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerkId: string
          email: string
          name: string | null
          image: string | null
          personalTeamId: string | null
          createdAt: string
          updatedAt: string
          youtubeAccessToken: string | null
          youtubeRefreshToken: string | null
          youtubeExpiresAt: string | null
          youtubeChannelId: string | null
          youtubeChannelTitle: string | null
        }
        Insert: {
          id?: string
          clerkId: string
          email: string
          name?: string | null
          image?: string | null
          personalTeamId?: string | null
          createdAt?: string
          updatedAt?: string
          youtubeAccessToken?: string | null
          youtubeRefreshToken?: string | null
          youtubeExpiresAt?: string | null
          youtubeChannelId?: string | null
          youtubeChannelTitle?: string | null
        }
        Update: {
          id?: string
          clerkId?: string
          email?: string
          name?: string | null
          image?: string | null
          personalTeamId?: string | null
          createdAt?: string
          updatedAt?: string
          youtubeAccessToken?: string | null
          youtubeRefreshToken?: string | null
          youtubeExpiresAt?: string | null
          youtubeChannelId?: string | null
          youtubeChannelTitle?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          isPersonal: boolean
          ownerId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          isPersonal?: boolean
          ownerId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          isPersonal?: boolean
          ownerId?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      team_members: {
        Row: {
          id: string
          role: 'ADMIN' | 'MANAGER' | 'EDITOR'
          joinedAt: string
          updatedAt: string
          status: 'ACTIVE' | 'PAUSED'
          userId: string
          teamId: string
        }
        Insert: {
          id?: string
          role?: 'ADMIN' | 'MANAGER' | 'EDITOR'
          joinedAt?: string
          updatedAt?: string
          status?: 'ACTIVE' | 'PAUSED'
          userId: string
          teamId: string
        }
        Update: {
          id?: string
          role?: 'ADMIN' | 'MANAGER' | 'EDITOR'
          joinedAt?: string
          updatedAt?: string
          status?: 'ACTIVE' | 'PAUSED'
          userId?: string
          teamId?: string
        }
      }
      team_invites: {
        Row: {
          id: string
          email: string
          role: 'ADMIN' | 'MANAGER' | 'EDITOR'
          status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
          token: string
          expiresAt: string
          createdAt: string
          updatedAt: string
          teamId: string
          inviterId: string
          inviteeId: string | null
        }
        Insert: {
          id?: string
          email: string
          role?: 'ADMIN' | 'MANAGER' | 'EDITOR'
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
          token: string
          expiresAt: string
          createdAt?: string
          updatedAt?: string
          teamId: string
          inviterId: string
          inviteeId?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'ADMIN' | 'MANAGER' | 'EDITOR'
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
          token?: string
          expiresAt?: string
          createdAt?: string
          updatedAt?: string
          teamId?: string
          inviterId?: string
          inviteeId?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          key: string
          filename: string
          contentType: string
          sizeBytes: number
          uploadedAt: string
          updatedAt: string
          status: 'PROCESSING' | 'PENDING' | 'PUBLISHED'
          requestedByUserId: string | null
          approvedByUserId: string | null
          userId: string
          teamId: string | null
          description: string | null
          visibility: string | null
          madeForKids: boolean
          thumbnailKey: string | null
        }
        Insert: {
          id?: string
          key: string
          filename: string
          contentType: string
          sizeBytes: number
          uploadedAt?: string
          updatedAt?: string
          status?: 'PROCESSING' | 'PENDING' | 'PUBLISHED'
          requestedByUserId?: string | null
          approvedByUserId?: string | null
          userId: string
          teamId?: string | null
          description?: string | null
          visibility?: string | null
          madeForKids?: boolean
          thumbnailKey?: string | null
        }
        Update: {
          id?: string
          key?: string
          filename?: string
          contentType?: string
          sizeBytes?: number
          uploadedAt?: string
          updatedAt?: string
          status?: 'PROCESSING' | 'PENDING' | 'PUBLISHED'
          requestedByUserId?: string | null
          approvedByUserId?: string | null
          userId?: string
          teamId?: string | null
          description?: string | null
          visibility?: string | null
          madeForKids?: boolean
          thumbnailKey?: string | null
        }
      }
      upload_locks: {
        Row: {
          id: string
          key: string
          metadata: string | null
          createdAt: string
          updatedAt: string
          userId: string
        }
        Insert: {
          id?: string
          key: string
          metadata?: string | null
          createdAt?: string
          updatedAt?: string
          userId: string
        }
        Update: {
          id?: string
          key?: string
          metadata?: string | null
          createdAt?: string
          updatedAt?: string
          userId?: string
        }
      }
      feedback_submissions: {
        Row: {
          id: string
          userId: string
          type: string
          category: string
          title: string | null
          message: string
          teamId: string | null
          teamName: string | null
          path: string | null
          priority: string | null
          includeEmail: boolean
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          type: string
          category: string
          title?: string | null
          message: string
          teamId?: string | null
          teamName?: string | null
          path?: string | null
          priority?: string | null
          includeEmail: boolean
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          type?: string
          category?: string
          title?: string | null
          message?: string
          teamId?: string | null
          teamName?: string | null
          path?: string | null
          priority?: string | null
          includeEmail?: boolean
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
