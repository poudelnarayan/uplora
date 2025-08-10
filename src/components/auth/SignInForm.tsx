"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react";
import toast from "react-hot-toast";

export default function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success("Account created! Please sign in.");
          setIsSignUp(false);
          setFormData({ email: formData.email, password: "", name: "" });
        } else {
          const error = await response.json();
          toast.error(error.message || "Registration failed");
        }
      } else {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Invalid credentials");
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google");
  };

  return (
    <div className="card max-w-md w-full mx-auto">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h3>
          <p className="text-white/60">
            {isSignUp
              ? "Join your team and start collaborating"
              : "Sign in to manage your YouTube team"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="input pl-12"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </motion.div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              placeholder="Email Address"
              className="input pl-12"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="input pl-12 pr-12"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <div className="spinner" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-white/60 bg-transparent">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="btn btn-secondary w-full"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormData({ email: "", password: "", name: "" });
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
