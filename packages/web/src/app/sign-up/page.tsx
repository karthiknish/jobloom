"use client";

import { Suspense, useEffect, useState } from "react";
import { Skeleton, SkeletonInput, SkeletonButton } from "@/components/ui/loading-skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Chrome, User, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function SignUpInner() {
  const router = useRouter();
  const search = useSearchParams();
  const {
    signUp,
    signInWithGoogle,
    sendEmailVerification,
    loading: authLoading,
    user,
    isInitialized,
  } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const redirectUrlComplete = search.get("redirect_url") || "/welcome";

  // Validation functions
  const validateName = (name: string) => {
    if (name && name.length > 0 && name.length < 2) return "Please enter at least 2 characters for your name";
    if (name && name.length > 50) return "Please keep your name under 50 characters";
    if (name && /<script|javascript:|on\w+=/i.test(name)) {
      return "Name contains invalid characters";
    }
    return null;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Please enter your email address to continue";
    if (!emailRegex.test(email)) return "Please enter a valid email address (e.g., you@example.com)";
    if (email.length > 254) return "Email address is too long";
    // Check for suspicious email patterns
    const suspiciousPatterns = [
      /^[0-9]+@/, // Numbers-only local part
      /.*\.{2,}.*/, // Multiple consecutive dots
      /.*@.*\.{2,}$/, // Multiple dots in domain
    ];
    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return "Please create a password to secure your account";
    if (password.length < 6) return "Please use at least 6 characters for your password";
    if (password.length > 128) return "Please keep your password under 128 characters";
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
      'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      return "Please choose a stronger password";
    }
    
    // Check if password is same as email
    if (password.toLowerCase() === email.toLowerCase()) {
      return "Password cannot be the same as your email";
    }
    
    return null;
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety
    if (/[a-z]/.test(password)) strength += 1; // lowercase
    if (/[A-Z]/.test(password)) strength += 1; // uppercase
    if (/[0-9]/.test(password)) strength += 1; // numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // special characters

    return Math.min(strength, 5);
  };

  // Real-time validation
  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(validateName(value));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Auto-trigger Google sign-up if requested via query
  useEffect(() => {
    const qp = search;
    const provider = qp.get("provider");
    const googleFlag = qp.get("google");
    if (
      (provider === "google" || googleFlag === "1") &&
      typeof window !== "undefined"
    ) {
      (async () => {
        try {
          await signInWithGoogle();
          router.replace(redirectUrlComplete);
        } catch {
          // Ignore; user can use the button manually
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace(redirectUrlComplete);
    }
  }, [isInitialized, user, router, redirectUrlComplete]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="w-full max-w-md sm:max-w-lg space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 mx-auto rounded-full" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-6">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-72 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-6">
              <SkeletonInput className="h-11" />
              <SkeletonInput className="h-11" />
              <SkeletonInput className="h-11" />
              <SkeletonButton className="h-11 w-full" />
              <div className="relative my-6">
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-4 w-32 mx-auto -mt-2" />
              </div>
              <SkeletonButton className="h-11 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  async function handleStartSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (nameErr || emailErr || passwordErr) {
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name || undefined);
      // Send email verification
      try {
        await sendEmailVerification();
      } catch (verificationError) {
        console.warn('Failed to send email verification:', verificationError);
        // Don't fail the signup if verification email fails
      }
      // Redirect to email verification page instead of dashboard
      router.replace(`/verify-email?redirect_url=${encodeURIComponent('/dashboard')}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError("An account with this email already exists. Try signing in instead");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address format");
          break;
        case 'auth/operation-not-allowed':
          setError("Email/password accounts are not enabled. Please contact support");
          break;
        case 'auth/weak-password':
          setError("Password is too weak. Please choose a stronger password");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection and try again");
          break;
        case 'auth/too-many-requests':
          setError("Too many sign-up attempts. Please try again later");
          break;
        default:
          setError(error?.message || "Sign up failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Send email verification for Google accounts too
      try {
        await sendEmailVerification();
      } catch (verificationError) {
        console.warn('Failed to send email verification:', verificationError);
      }
      router.replace(`/verify-email?redirect_url=${encodeURIComponent('/dashboard')}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      
      // Handle specific Google auth errors
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError("Sign-up popup was closed before completion");
          break;
        case 'auth/popup-blocked':
          setError("Sign-up popup was blocked by your browser. Please allow popups");
          break;
        case 'auth/cancelled-popup-request':
          setError("Sign-up was cancelled");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection and try again");
          break;
        default:
          setError(error?.message || "Google sign-up failed. Please try again");
      }
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/2 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/2 rounded-full filter blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md sm:max-w-lg space-y-8 relative z-10"
      >

        <Card className="card-premium-elevated border-0 bg-surface p-8">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-bold text-gradient-premium">Create your account</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-muted-foreground text-lg">
                Join Hireall and start tracking your job applications
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-destructive/10 rounded-full flex items-center justify-center mt-0.5">
                  <X className="h-3 w-3 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Sign Up Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            <motion.form
              onSubmit={handleStartSignUp}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">Name (optional)</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`input-premium pl-12 h-12 ${nameError ? 'border-destructive focus:ring-destructive' : ''}`}
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>
                {nameError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive font-medium"
                  >
                    {nameError}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-premium" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={`input-premium pl-12 h-12 ${emailError ? 'border-destructive focus:ring-destructive' : ''}`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive font-medium"
                  >
                    {emailError}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    className={`pl-10 pr-10 h-11 bg-muted/50 border-input hover:bg-muted/50 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all duration-200 ${passwordError ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-muted-foreground active:scale-95 transition-all duration-200"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-destructive'
                                : passwordStrength <= 3
                                ? 'bg-accent'
                                : 'bg-secondary'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' : 
                        passwordStrength <= 3 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {passwordStrength === 0 && 'Very weak'}
                        {passwordStrength === 1 && 'Weak'}
                        {passwordStrength === 2 && 'Fair'}
                        {passwordStrength === 3 && 'Good'}
                        {passwordStrength === 4 && 'Strong'}
                        {passwordStrength === 5 && 'Very strong'}
                      </span>
                      <div className="flex gap-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {password.length >= 8 ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs">8+ chars</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[^A-Za-z0-9]/.test(password) ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-xs">Special</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Setting up your account...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <span>Create account</span>
                  </motion.div>
                )}
              </Button>
            </motion.form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogle}
              className="w-full h-11 bg-background border-input hover:bg-muted/50 hover:border-border/80 font-medium shadow-sm transition-all duration-200"
              disabled={loading}
              size="lg"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-sm pt-4 border-t border-input">
              <span className="text-muted-foreground">Already have an account? </span>
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrlComplete)}`}
                className="font-medium text-primary hover:underline transition-colors"
              >
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}
