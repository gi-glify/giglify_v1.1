import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from "../utils/supabase";
import { Moon, Sun } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "../context/ThemeContext";
import PasswordInput from "../components/ui/PasswordInput";

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<"choice" | "signup" | "signin">("choice");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStepChange = (newStep: "choice" | "signup" | "signin") => {
    setError("");
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

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          createdAt: data.user.created_at || new Date().toISOString(),
          subscription: "free",
          balance: 0,
        });
      }

      navigate("/dashboard");
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

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { error: authError } = await signInWithGoogle();
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
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
              onClick={handleGoogleSignIn}
              className="w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-3"
            >
             <FcGoogle className="w-5 h-5 shrink-0 text-xl" style={{ display: 'inline-block' }} />
              <span>Sign in with Google</span>
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
      </div>
    </div>
  );
}
