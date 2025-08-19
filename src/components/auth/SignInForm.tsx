"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User2, CheckCircle, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/fetcher";
import { loginSchema, registerSchema, handleZodError } from "@/lib/validation";

export default function SignInForm() {
  const notifications = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    name: "" 
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Handle authentication errors from URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === "CredentialsSignin" || error === "Invalid email or password") {
        setAuthError("Invalid email or password");
      } else if (error === "Missing email or password") {
        setAuthError("Please enter both email and password");
      } else {
        setAuthError("Authentication failed. Please try again.");
      }
      // Clear the error from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    try {
      if (isSignUp) {
        const validationResult = registerSchema.safeParse(formData);
        if (!validationResult.success) {
          validationResult.error.errors.forEach((err) => {
            const field = err.path[0] as string;
            newErrors[field] = err.message;
          });
        }
        
        // Additional validation for confirm password
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      } else {
        const validationResult = loginSchema.safeParse(formData);
        if (!validationResult.success) {
          validationResult.error.errors.forEach((err) => {
            const field = err.path[0] as string;
            newErrors[field] = err.message;
          });
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
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
    setAuthError(null);

    try {
      if (isSignUp) {
        const result = await api.post("/api/auth/register", {
          email: formData.email,
          password: formData.password,
          name: formData.name
        });

        if (result.ok) {
          console.log("Registration result:", result.data);
          
          notifications.addNotification({
            type: "success",
            title: "Account Created!",
            message: "Please check your email for verification link."
          });
          
          if (result.data.redirectUrl) {
            // Small delay to show the notification
            setTimeout(() => {
              router.push(result.data.redirectUrl);
            }, 1000);
          } else {
            setInfo("Account created successfully! Please check your email to verify your account.");
            setIsSignUp(false);
            setFormData({ email: formData.email, password: "", confirmPassword: "", name: "" });
          }
        } else {
          console.error("Registration error:", result);
          
          // Handle field-specific errors
          if (result.fieldErrors) {
            setErrors(result.fieldErrors);
          }
          
          notifications.addNotification({ 
            type: "error", 
            title: "Registration failed", 
            message: result.message || "Please try again" 
          });
        }
      } else {
        try {
          // Use redirect: false to prevent page reload and handle errors inline
          const res = await signIn("credentials", { 
            email: formData.email, 
            password: formData.password, 
            redirect: false,
            callbackUrl: "/dashboard"
          });

          if (res?.error) {
            // Single compact error indicator; no per-field red
            setAuthError("Invalid email or password");
            return;
          }

          // Success: navigate without page reload
          const targetUrl = res?.url || "/dashboard";
          router.push(targetUrl);
          router.refresh();
        } catch (error) {
          console.error("SignIn error:", error);
          setAuthError("Authentication failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear field error and global auth error when user starts typing
    if (errors[field] || authError) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
      setAuthError(null);
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

        {/* Single compact error message */}
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-md border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">{authError}</div>
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
              setAuthError(null);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {isSignUp 
              ? "Already have an account? Sign in" 
              : "Need an account? Create one"
            }
          </button>
          {!isSignUp && (
            <div className="mt-3">
              <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>
          )}
        </div>


      </motion.div>
    </div>
  );
}
