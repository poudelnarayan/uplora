"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const MotionDiv = MotionDiv as any;
import { useSession, signIn } from "next-auth/react";
import { Users, Crown, UserCheck, Edit3, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import { NextSeo } from "next-seo";

interface Invitation {
  id: string;
  email: string;
  role: string;
  team: {
    name: string;
    description: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.token) {
      fetchInvitation(params.token as string);
    }
  }, [params.token]);

  const fetchInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
      } else {
        const error = await response.json();
        setError(error.message || "Invitation not found or expired");
      }
    } catch (error) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !session) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${params.token}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Welcome to the team!");
        router.push("/teams");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to accept invitation");
      }
    } catch (error) {
      toast.error("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Crown className="w-6 h-6 text-yellow-400" />;
      case "MANAGER": return <UserCheck className="w-6 h-6 text-green-400" />;
      case "EDITOR": return <Edit3 className="w-6 h-6 text-blue-400" />;
      default: return <Edit3 className="w-6 h-6 text-blue-400" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN": return "Full team management and video upload permissions";
      case "MANAGER": return "Can upload videos and invite new team members";
      case "EDITOR": return "Can upload and manage videos for the team";
      default: return "Team member";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-6 rounded-lg">
          <div className="w-16 h-16 rounded-full glass glow-red mx-auto mb-6 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Invitation</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="btn btn-primary mt-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NextSeo title="Team Invitation" noindex nofollow />
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-6 rounded-lg"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full glass glow mx-auto mb-6 flex items-center justify-center">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Team Invitation</h1>
          <p className="text-white/70">You&apos;ve been invited to collaborate!</p>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">{invitation.team.name}</h2>
            <p className="text-white/70 mb-4">{invitation.team.description}</p>
            
            <div className="flex items-center gap-3 mb-4">
              {getRoleIcon(invitation.role)}
              <div>
                <p className="text-white font-semibold">{invitation.role}</p>
                <p className="text-white/60 text-sm">{getRoleDescription(invitation.role)}</p>
              </div>
            </div>

            <div className="text-sm text-white/60">
              <p>Invited by: <span className="text-white/80">{invitation.inviter.name}</span></p>
              <p>Expires: <span className="text-white/80">{new Date(invitation.expiresAt).toLocaleDateString()}</span></p>
            </div>
          </div>

          {!session ? (
            <div className="space-y-4">
              <p className="text-white/70 text-center text-sm">
                Sign in or create an account to accept this invitation
              </p>
              <button
                onClick={() => signIn("google")}
                className="btn btn-primary w-full"
              >
                Continue with Google
              </button>
              <button
                onClick={() => signIn()}
                className="btn btn-secondary w-full"
              >
                Sign In / Create Account
              </button>
            </div>
          ) : session.user?.email === invitation.email ? (
            <button
              onClick={acceptInvitation}
              disabled={accepting}
              className="btn btn-success w-full"
            >
              {accepting ? (
                <>
                  <div className="spinner" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Invitation
                </>
              )}
            </button>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-white/70 text-sm">
                This invitation is for {invitation.email}, but you&apos;re signed in as {session.user?.email}.
              </p>
              <button
                onClick={() => signIn()}
                className="btn btn-secondary w-full"
              >
                Sign In with Correct Account
              </button>
            </div>
          )}
        </div>
      </MotionDiv>
    </div>
  );
}
