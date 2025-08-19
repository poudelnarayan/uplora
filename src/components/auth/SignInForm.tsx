"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User2, CheckCircle, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import { TextField } from "@/components/ui/TextField";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const notifications = useNotifications();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    name: "" 
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (isSignUp) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
      
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Registration result:", result);
          
          notifications.addNotification({
            type: "success",
            title: "Account Created!",
            message: "Please check your email for verification link."
          });
          
          if (result.redirectUrl) {
            // Small delay to show the notification
            setTimeout(() => {
              router.push(result.redirectUrl);
            }, 1000);
          } else {
            setInfo("Account created successfully! Please check your email to verify your account.");
            setIsSignUp(false);
            setFormData({ email: formData.email, password: "", confirmPassword: "", name: "" });
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
          console.error("Registration error:", errorData);
          notifications.addNotification({ 
            type: "error", 
            title: "Registration failed", 
            message: errorData.message || "Please try again" 
          });
        }
      } else {
        try {
          const result = await signIn("credentials", { 
            email: formData.email, 
            password: formData.password, 
            redirect: false
          });
          
          console.log("SignIn result:", result);
          
          if (result?.error) {
            notifications.addNotification({ 
              type: "error", 
              title: "Invalid credentials", 
              message: "Please check your email and password" 
            });
          } else if (result?.ok) {
            router.push("/dashboard");
          } else {
            // Handle unexpected response
            console.error("SignIn result:", result);
            notifications.addNotification({ 
              type: "error", 
              title: "Authentication failed", 
              message: "Please try again" 
            });
          }
        } catch (error) {
          console.error("SignIn error:", error);
          notifications.addNotification({ 
            type: "error", 
            title: "Authentication failed", 
            message: "Please try again" 
          });
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      notifications.addNotification({ 
        type: "error", 
        title: "Something went wrong", 
        message: "Please check your connection and try again" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="card max-w-md w-full mx-auto p-6 md:p-8">
      <motion.div 
        initial={{ scale: 0.98 }} 
        animate={{ scale: 1 }} 
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h3>
          <p className="text-muted-foreground">
            {isSignUp 
              ? "Join Uplora and start managing your videos" 
              : "Sign in to your Uplora account"
            }
          </p>
        </div>

        {info && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{info}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TextField
                label="Full Name"
                icon={<User2 className="w-4 h-4" />}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', (e.target as HTMLInputElement).value)}
                error={errors.name}
                required
              />
            </motion.div>
          )}

          <TextField
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', (e.target as HTMLInputElement).value)}
            error={errors.email}
            required
          />

          <TextField
            label="Password"
            icon={<Lock className="w-4 h-4" />}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleInputChange('password', (e.target as HTMLInputElement).value)}
            error={errors.password}
            rightIcon={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label="Toggle password visibility" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          {isSignUp && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TextField
                label="Confirm Password"
                icon={<Lock className="w-4 h-4" />}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', (e.target as HTMLInputElement).value)}
                error={errors.confirmPassword}
                rightIcon={
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    aria-label="Toggle confirm password visibility" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
            </motion.div>
          )}

          <motion.button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary w-full mt-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormData({ email: "", password: "", confirmPassword: "", name: "" });
              setErrors({});
              setInfo(null);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {isSignUp 
              ? "Already have an account? Sign in" 
              : "Need an account? Create one"
            }
          </button>
        </div>


      </motion.div>
    </div>
  );
}
