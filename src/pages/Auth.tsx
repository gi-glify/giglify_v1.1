import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithSocial,
  resendSignupConfirmation,
  requestPasswordReset,
  updatePassword,
} from "../utils/supabase";
import { Moon, Sun } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF, FaXTwitter } from "react-icons/fa6";
import type { SocialProviderId } from "../utils/socialAuth";
import { useTheme } from "../context/ThemeContext";
import PasswordInput from "../components/ui/PasswordInput";

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setVerificationEmail, verificationEmail } = useAuthStore();
  const [step, setStep] = useState<"choice" | "signup" | "signin" | "reset">("choice");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(Boolean(verificationEmail));
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("reset") === "1") {
      setStep("reset");
      setEmailConfirmationSent(false);
    }
  }, [location.search]);

  const handleStepChange = (newStep: "choice" | "signup" | "signin" | "reset") => {
    setError("");
    setPasswordUpdated(false);
    setPasswordResetSent(false);
    setStep(newStep);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      const { data, error: authError } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );

      if (authError) throw authError;

      if (data?.user && data.session && data.user.email_confirmed_at) {
        setUser({
          id: data.user.id,
          email: data.user.email || formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          createdAt: data.user.created_at || new Date().toISOString(),
          subscription: "free",
          balance: 0,
        });
        setVerificationEmail(null);
        navigate("/dashboard");
        return;
      }
      setVerificationEmail(formData.email);
      setEmailConfirmationSent(true);
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data, error: authError } = await signInWithEmail(
        formData.email,
        formData.password,
      );

      if (authError) throw authError;

      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          setVerificationEmail(data.user.email || formData.email);
          setEmailConfirmationSent(true);
          return;
        }
        setUser({
          id: data.user.id,
          email: data.user.email || formData.email,
          firstName: data.user.user_metadata?.first_name || "",
          lastName: data.user.user_metadata?.last_name || "",
          createdAt: data.user.created_at || new Date().toISOString(),
          subscription: "free",
          balance: 0,
        });
      }
      setVerificationEmail(null);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: SocialProviderId, label: string) => {
    setError("");
    try {
      const { error: authError } = await signInWithSocial(provider);
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || `${label} sign in failed`);
    }
  };

  const handleResendConfirmation = async () => {
    setError("");
    const { error: resendError } = await resendSignupConfirmation(formData.email || verificationEmail || "");
    if (resendError) setError(resendError.message || "Unable to resend confirmation email");
    else setEmailConfirmationSent(true);
  };

  const handleBackToSignIn = () => {
    setError("");
    setEmailConfirmationSent(false);
    setPasswordResetSent(false);
    setVerificationEmail(null);
    setFormData((current) => ({ ...current, password: "", confirmPassword: "" }));
    setStep("signin");
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: resetError } = await requestPasswordReset(formData.email);
      if (resetError) throw resetError;
      setPasswordResetSent(true);
    } catch (err: any) {
      setError(err.message || "Unable to send password reset email");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(formData.password);
      if (updateError) throw updateError;
      setPasswordUpdated(true);
      setFormData((current) => ({ ...current, password: "", confirmPassword: "" }));
    } catch (err: any) {
      setError(err.message || "Unable to update your password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 btn-icon"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="w-full max-w-md animate-in" data-aos="zoom-in">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img
            src="/giglify.svg"
            alt="Giglify"
            className="h-16 w-16 rounded-xl"
          />
          <p
            className="text-sm font-body"
            style={{ color: "var(--text-muted)" }}
          >
            Microtasking, Done Right.
          </p>
        </div>

        {emailConfirmationSent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="email-verification-title">
            <div className="card w-full max-w-md text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl dark:bg-brand-900/40">✉️</div>
              <h1 id="email-verification-title" className="font-display text-2xl mb-2">Check your inbox</h1>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                We sent a verification link to <strong>{formData.email || verificationEmail}</strong>. Verify your email before accessing your dashboard.
              </p>
              {error && <div className="alert alert-error text-sm mb-4">{error}</div>}
              <button type="button" onClick={handleResendConfirmation} className="btn-primary w-full text-sm">Resend verification email</button>
              <button type="button" onClick={handleBackToSignIn} className="mt-4 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">Back to sign in</button>
            </div>
          </div>
        )}

        {/* Choice Screen */}
        {step === "choice" && (
          <div className="space-y-4">
            <button
              onClick={() => handleStepChange("signup")}
              className="w-full btn-primary py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
            >
              Create Account
            </button>
            <button
              onClick={() => handleStepChange("signin")}
              className="w-full btn-secondary py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Sign Up Form */}
        {step === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                className="input-field"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="input-field"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <PasswordInput
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => handleStepChange("choice")}
              className="w-full text-sm hover:opacity-80"
            >
              Back
            </button>
          </form>
        )}

        {/* Sign In Form */}
        {step === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <PasswordInput
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button type="button" onClick={() => handleStepChange("reset")} className="text-left text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Forgot your password?
            </button>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("google", "Google")}
              className="w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-3"
            >
             <FcGoogle className="w-5 h-5 shrink-0 text-xl" style={{ display: 'inline-block' }} />
              <span>Sign in with Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("facebook", "Facebook")}
              className="w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-3"
            >
              <FaFacebookF className="w-5 h-5 shrink-0 text-[#1877F2]" />
              <span>Sign in with Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("twitter", "X")}
              className="w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-3"
            >
              <FaXTwitter className="w-5 h-5 shrink-0" />
              <span>Continue with X</span>
            </button>
            <button
              type="button"
              onClick={() => handleStepChange("choice")}
              className="w-full text-sm hover:opacity-80"
            >
              Back
            </button>
          </form>
        )}

        {step === "reset" && (
          passwordUpdated ? (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-900/30">✓</div>
              <h1 className="font-display text-2xl mb-2">Password updated</h1>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Your Giglify password has been changed securely.</p>
              <button type="button" onClick={() => navigate("/dashboard")} className="btn-primary w-full">Go to dashboard</button>
            </div>
          ) : location.search.includes("reset=1") ? (
            <form onSubmit={handlePasswordUpdate} className="card space-y-4">
              <div>
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Account recovery</p>
                <h1 className="font-display text-2xl mt-1">Choose a new password</h1>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Use at least 8 characters. Your new password will protect your Giglify account immediately.</p>
              </div>
              <PasswordInput placeholder="New password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              <PasswordInput placeholder="Confirm new password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
              {error && <div className="alert alert-error text-sm">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full btn-primary py-3 disabled:opacity-50">{submitting ? "Updating password..." : "Update password"}</button>
              <button type="button" onClick={handleBackToSignIn} className="w-full text-sm hover:underline">Back to sign in</button>
            </form>
          ) : (
            <form onSubmit={handlePasswordResetRequest} className="card space-y-4">
              <div>
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Account recovery</p>
                <h1 className="font-display text-2xl mt-1">Forgot your password?</h1>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Enter your email and we’ll send you a secure password reset link.</p>
              </div>
              <input type="email" placeholder="Email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              {passwordResetSent && <div className="alert alert-success text-sm">If an account exists for this email, a reset link has been sent.</div>}
              {error && <div className="alert alert-error text-sm">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full btn-primary py-3 disabled:opacity-50">{submitting ? "Sending reset link..." : "Send reset link"}</button>
              <button type="button" onClick={handleBackToSignIn} className="w-full text-sm hover:underline">Back to sign in</button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
