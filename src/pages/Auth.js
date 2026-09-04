import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../utils/supabase';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/ui/PasswordInput';
export default function AuthPage() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { setUser, loading } = useAuthStore();
    const [step, setStep] = useState('choice');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setSubmitting(false);
            return;
        }
        try {
            const { error: authError } = await signUpWithEmail(formData.email, formData.password, formData.firstName, formData.lastName);
            if (authError)
                throw authError;
            setUser({
                id: '',
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                createdAt: new Date().toISOString(),
                subscription: 'free',
                balance: 0,
            });
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message || 'Sign up failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { error: authError } = await signInWithEmail(formData.email, formData.password);
            if (authError)
                throw authError;
            setUser({
                id: '',
                email: formData.email,
                firstName: '',
                lastName: '',
                createdAt: new Date().toISOString(),
                subscription: 'free',
                balance: 0,
            });
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message || 'Sign in failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const { error: authError } = await signInWithGoogle();
            if (authError)
                throw authError;
        }
        catch (err) {
            setError(err.message || 'Google sign in failed');
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center p-4 transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("button", { onClick: toggleTheme, className: "absolute top-6 right-6 btn-icon", "aria-label": "Toggle theme", children: theme === 'light' ? _jsx(Moon, { size: 20 }) : _jsx(Sun, { size: 20 }) }), _jsxs("div", { className: "w-full max-w-md animate-in", "data-aos": "zoom-in", children: [_jsxs("div", { className: "text-center mb-8 flex flex-col items-center gap-3", children: [_jsx("img", { src: "/giglify.svg", alt: "Giglify", className: "h-16 w-16 rounded-xl" }), _jsx("p", { className: "text-sm font-body", style: { color: 'var(--text-muted)' }, children: "Microtasking, Done Right." })] }), step === 'choice' && (_jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => setStep('signup'), className: "w-full btn-primary py-3 rounded-lg font-semibold transition-all hover:shadow-lg", children: "Create Account" }), _jsx("button", { onClick: () => setStep('signin'), className: "w-full btn-secondary py-3 rounded-lg font-semibold transition-all hover:shadow-lg", children: "Sign In" })] })), step === 'signup' && (_jsxs("form", { onSubmit: handleSignUp, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("input", { type: "text", placeholder: "First Name", className: "input-field", value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), required: true }), _jsx("input", { type: "text", placeholder: "Last Name", className: "input-field", value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), required: true })] }), _jsx("input", { type: "email", placeholder: "Email", className: "input-field", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Confirm Password", value: formData.confirmPassword, onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }), required: true }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50", children: submitting ? 'Creating...' : 'Create Account' }), _jsx("button", { type: "button", onClick: () => setStep('choice'), className: "w-full text-sm hover:opacity-80", children: "Back" })] })), step === 'signin' && (_jsxs("form", { onSubmit: handleSignIn, className: "space-y-4", children: [_jsx("input", { type: "email", placeholder: "Email", className: "input-field", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), required: true }), _jsx(PasswordInput, { placeholder: "Password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), required: true }), error && _jsx("div", { className: "alert alert-error text-sm", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50", children: submitting ? 'Signing in...' : 'Sign In' }), _jsx("button", { type: "button", onClick: handleGoogleSignIn, className: "w-full btn-secondary py-3 rounded-lg font-semibold hover:shadow-lg", children: "Sign in with Google" }), _jsx("button", { type: "button", onClick: () => setStep('choice'), className: "w-full text-sm hover:opacity-80", children: "Back" })] }))] })] }));
}
//# sourceMappingURL=Auth.js.map