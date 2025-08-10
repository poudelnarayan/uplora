"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { redirect } from "next/navigation";
import { Users, Upload, Youtube } from "lucide-react";

import SignInForm from "@/components/auth/SignInForm";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Marketing */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-3 mb-8"
            >
              <div className="w-16 h-16 rounded-full glass glow flex items-center justify-center">
                <Youtube className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-4xl font-bold text-white">YTUploader</h1>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Team YouTube
              <span className="text-gradient block">Management</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-white/80 mb-8 leading-relaxed"
            >
              Collaborate seamlessly with your team. Upload, manage, and publish YouTube videos with role-based permissions and real-time collaboration.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 gap-6 mb-8"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full glass glow-green mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Team Roles</h3>
                <p className="text-white/60 text-sm">Admin, Manager, Editor</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full glass glow-red mx-auto mb-3 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Easy Upload</h3>
                <p className="text-white/60 text-sm">Drag & drop videos</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Sign In */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="floating"
          >
            <SignInForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}