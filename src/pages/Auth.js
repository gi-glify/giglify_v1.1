import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { signUpWithEmail, signInWithEmail, signInWithGoogle, resendSignupConfirmation, requestPasswordReset, updatePassword, } from "../utils/supabase";
import { Moon, Sun } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "../context/ThemeContext";
import PasswordInput from "../components/ui/PasswordInput";
export default function AuthPage() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser, setVerificationEmail, verificationEmail } = useAuthStore();
    const [step, setStep] = useState("choice");
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
    const handleStepChange = (newStep) => {
        setError("");
        setPasswordUpdated(false);
        setPasswordResetSent(false);
        setStep(newStep);
    };
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setSubmitting(false);
            return;
        }
        try {
            const { data, error: authError } = await signUpWithEmail(formData.email, formData.password, formData.firstName, formData.lastName);
            if (authError)
                throw authError;
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
        }
        catch (err) {
            setError(err.message || "Sign up failed");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleSignIn = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const { data, error: authError } = await signInWithEmail(formData.email, formData.password);
            if (authError)
                throw authError;
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
        }
        catch (err) {
            setError(err.message || "Sign in failed");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleGoogleSignIn = async () => {
        setError("");
        try {
            const { error: authError } = await signInWithGoogle();
            if (authError)
                throw authError;
        }
        catch (err) {
            setError(err.message || "Google sign in failed");
        }
    };
    const handleResendConfirmation = async () => {
        setError("");
        const { error: resendError } = await resendSignupConfirmation(formData.email || verificationEmail || "");
        if (resendError)
            setError(resendError.message || "Unable to resend confirmation email");
        else
            setEmailConfirmationSent(true);
    };
    const handleBackToSignIn = () => {
        setError("");
        setEmailConfirmationSent(false);
        setPasswordResetSent(false);
        setVerificationEmail(null);
        setFormData((current) => ({ ...current, password: "", confirmPassword: "" }));
        setStep("signin");
    };
    const handlePasswordResetRequest = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            const { error: resetError } = await requestPasswordReset(formData.email);
            if (resetError)
                throw resetError;
            setPasswordResetSent(true);
        }
        catch (err) {
            setError(err.message || "Unable to send password reset email");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handlePasswordUpdate = async (e) => {
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
            if (updateError)
                throw updateError;
            setPasswordUpdated(true);
            setFormData((current) => ({ ...current, password: "", confirmPassword: "" }));
        }
        catch (err) {
            setError(err.message || "Unable to update your password");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center p-4 transition-colors", style: { background: "var(--bg)", color: "var(--text)" }, children: [_jsx("button", { onClick: toggleTheme, className: "absolute top-6 right-6 btn-icon", "aria-label": "Toggle theme", children: theme === "light" ? _jsx(Moon, { size: 20 }) : _jsx(Sun, { size: 20 }) }), _jsxs("div", { className: "w-full max-w-md animate-in", "data-aos": "zoom-in", children: [_jsxs("div", { className: "text-center mb-8 flex flex-col items-center gap-3", children: [_jsx("img", { src: "/giglify.svg", alt: "Giglify", className: "h-16 w-16 rounded-xl" }), _jsx("p", { className: "text-sm font-body", style: { color: "var(--text-muted)" }, children: "Microtasking, Done Right." })] }), emailConfirmationSent && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm", role: "dialog", "aria-modal": "true", "aria-labelledby": "email-verification-title", children: _jsxs("div", { className: "card w-full max-w-md text-center shadow-2xl", children: [_jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl dark:bg-brand-900/40", children: "\u2709\uFE0F" }), _jsx("h1", { id: "email-verification-title", className: "font-display text-2xl mb-2", children: "Check your inbox" }), _jsxs("p", { className: "text-sm mb-5", style: { color: "var(--text-muted)" }, children: ["We sent a verification link to ", _jsx("strong", { children: formData.email || verificationEmail }), ". Verify your email before accessing your dashboard."] }), error && _jsx("div", { className: "alert alert-error text-sm mb-4", children: error }), _jsx("button", { type: "button", onClick: handleResendConfirmation, className: "btn-primary w-full text-sm", children: "Resend verification email" }), _jsx("button", { type: "button", onClick: handleBackToSignIn, className: "mt-4 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300", children: "Back to sign in" })] }) })), step === "choice" && (_jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => handleStepChange("signup"), className: "w-full btn-primary py-3 rounded-lg font-semibold transition-all hover:shadow-lg", children: "Create Account" }), _jsx("button", { onClick: () => handleStepChange("signin"), className: "w-full btn-secondary py-3 rounded-lg font-semibold transition-all hover:shadow-lg", children: "Sign In" })] })), step === "signup" && (_jsxs("form", { onSubmit: handleSignUp, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("input", { type: "text", placeholder: "First Name", className: "input-field", value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), required: true }), _jsx("input", { type: "text", placeholder: "Last Name", className: "input-field", value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), required: true })] }), _jsx("input", { type: "email", placeholder: "Email", className: "input-field", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Confirm Password", value: formData.confirmPassword, onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }), required: true }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50", children: submitting ? "Creating..." : "Create Account" }), _jsx("button", { type: "button", onClick: () => handleStepChange("choice"), className: "w-full text-sm hover:opacity-80", children: "Back" })] })), step === "signin" && (_jsxs("form", { onSubmit: handleSignIn, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "Email", className: "input-field", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), _jsx("button", { type: "button", onClick: () => handleStepChange("reset"), className: "text-left text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300", children: "Forgot your password?" }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50", children: submitting ? "Signing in..." : "Sign In" }), _jsxs("button", { type: "button", onClick: handleGoogleSignIn, className: "w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg flex items-center justify-center gap-3", children: [_jsx(FcGoogle, { className: "w-5 h-5 shrink-0 text-xl", style: { display: 'inline-block' } }), _jsx("span", { children: "Sign in with Google" })] }), _jsx("button", { type: "button", onClick: () => handleStepChange("choice"), className: "w-full text-sm hover:opacity-80", children: "Back" })] })), step === "reset" && (passwordUpdated ? (_jsxs("div", { className: "card text-center", children: [_jsx("div", { className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-900/30", children: "\u2713" }), _jsx("h1", { className: "font-display text-2xl mb-2", children: "Password updated" }), _jsx("p", { className: "text-sm mb-5", style: { color: "var(--text-muted)" }, children: "Your Giglify password has been changed securely." }), _jsx("button", { type: "button", onClick: () => navigate("/dashboard"), className: "btn-primary w-full", children: "Go to dashboard" })] })) : location.search.includes("reset=1") ? (_jsxs("form", { onSubmit: handlePasswordUpdate, className: "card space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-brand-700 dark:text-brand-300", children: "Account recovery" }), _jsx("h1", { className: "font-display text-2xl mt-1", children: "Choose a new password" }), _jsx("p", { className: "text-sm mt-2", style: { color: "var(--text-muted)" }, children: "Use at least 8 characters. Your new password will protect your Giglify account immediately." })] }), _jsx(PasswordInput, { placeholder: "New password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Confirm new password", value: formData.confirmPassword, onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }), required: true }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 disabled:opacity-50", children: submitting ? "Updating password..." : "Update password" }), _jsx("button", { type: "button", onClick: handleBackToSignIn, className: "w-full text-sm hover:underline", children: "Back to sign in" })] })) : (_jsxs("form", { onSubmit: handlePasswordResetRequest, className: "card space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-brand-700 dark:text-brand-300", children: "Account recovery" }), _jsx("h1", { className: "font-display text-2xl mt-1", children: "Forgot your password?" }), _jsx("p", { className: "text-sm mt-2", style: { color: "var(--text-muted)" }, children: "Enter your email and we\u2019ll send you a secure password reset link." })] }), _jsx("input", { type: "email", placeholder: "Email", className: "input-field", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true }), passwordResetSent && _jsx("div", { className: "alert alert-success text-sm", children: "If an account exists for this email, a reset link has been sent." }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 disabled:opacity-50", children: submitting ? "Sending reset link..." : "Send reset link" }), _jsx("button", { type: "button", onClick: handleBackToSignIn, className: "w-full text-sm hover:underline", children: "Back to sign in" })] })))] })] }));
}
//# sourceMappingURL=Auth.js.map