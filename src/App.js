import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { getCurrentUser, supabase } from "./utils/supabase";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./components/layout/AppLayout";
// Pages
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import TasksPage from "./pages/Tasks";
import TaskRunnerPage from "./pages/TaskRunner";
import VerifyPage from "./pages/Verify";
import DepositPage from "./pages/Deposit";
import FinancialsPage from "./pages/Financials";
import AdminPaymentsPage from "./pages/AdminPayments";
import ProfileCompletionPage from "./pages/ProfileCompletion";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import AboutPage from "./pages/About";
import ConsentGate from "./components/auth/ConsentGate";
import NotFoundPage from "./pages/NotFound";
import ThankYouPage from "./pages/ThankYou";
import RequesterKycPage from "./pages/RequesterKyc";
import RequesterTasksPage from "./pages/RequesterTasks";
import PageMeta from "./components/seo/PageMeta";
import CookieBanner from "./components/privacy/CookieBanner";
import { rememberRoute } from "./utils/routeMemory";
function RouteMemory({ user }) {
    const { pathname } = useLocation();
    useEffect(() => {
        if (user)
            rememberRoute(pathname);
    }, [pathname, user]);
    return null;
}
function AuthLoadingScreen() {
    return _jsx("div", { className: "min-h-screen", style: { background: "var(--bg)" } });
}
function AuthedRoutes() {
    return (_jsx(AppLayout, { children: _jsx(ConsentGate, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/tasks", element: _jsx(TasksPage, {}) }), _jsx(Route, { path: "/tasks/:taskCode", element: _jsx(TaskRunnerPage, {}) }), _jsx(Route, { path: "/verify", element: _jsx(VerifyPage, {}) }), _jsx(Route, { path: "/deposit", element: _jsx(DepositPage, {}) }), _jsx(Route, { path: "/financials", element: _jsx(FinancialsPage, {}) }), _jsx(Route, { path: "/admin/payments", element: _jsx(AdminPaymentsPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfileCompletionPage, {}) }), _jsx(Route, { path: "/notifications", element: _jsx(NotificationsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/terms", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/data-policy", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/requester/apply", element: _jsx(RequesterKycPage, {}) }), _jsx(Route, { path: "/requester/tasks", element: _jsx(RequesterTasksPage, {}) }), _jsx(Route, { path: "/thank-you", element: _jsx(ThankYouPage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }) }));
}
function App() {
    const { setUser, setLoading, user, loading, verificationEmail, setVerificationEmail } = useAuthStore();
    useEffect(() => {
        const initAuth = async () => {
            const { user } = await getCurrentUser();
            if (user && !user.email_confirmed_at && user.app_metadata?.provider === "email") {
                await supabase.auth.signOut();
                setUser(null);
                setVerificationEmail(user.email || null);
            }
            else if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle();
                setUser({
                    id: user.id,
                    email: user.email || "",
                    firstName: profile?.first_name || user.user_metadata?.first_name || "",
                    lastName: profile?.last_name || user.user_metadata?.last_name || "",
                    createdAt: user.created_at,
                    subscription: profile?.subscription || "free",
                    balance: 0,
                    phone: profile?.phone || "",
                    country: profile?.country || "",
                    bio: profile?.bio || "",
                    skills: profile?.skills || [],
                    payoutMethodAdded: profile?.payout_method_added || false,
                    profilePicture: profile?.profile_picture || "",
                    idType: profile?.id_type || "",
                    idNumber: profile?.id_number || "",
                    dateOfBirth: profile?.date_of_birth || "",
                    address: profile?.address || "",
                    fullLegalName: profile?.full_legal_name || "",
                    payoutMethod: profile?.payout_method || "",
                    payoutAccount: profile?.payout_account || "",
                    proofOfPayment: profile?.proof_of_payment || "",
                });
                setVerificationEmail(null);
            }
            setLoading(false);
        };
        initAuth();
    }, [setUser, setLoading]);
    return (_jsx(ThemeProvider, { children: _jsxs(Router, { children: [_jsx(PageMeta, {}), _jsx(RouteMemory, { user: Boolean(user) }), _jsx(CookieBanner, {}), loading ? _jsx(Routes, { children: _jsx(Route, { path: "*", element: _jsx(AuthLoadingScreen, {}) }) }) : (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/terms", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/data-policy", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/requester/apply", element: _jsx(RequesterKycPage, {}) }), _jsx(Route, { path: "/requester/tasks", element: _jsx(RequesterTasksPage, {}) }), _jsx(Route, { path: "/thank-you", element: _jsx(ThankYouPage, {}) }), !user ? (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "*", element: verificationEmail ? _jsx(Navigate, { to: "/auth?verify=1", replace: true }) : _jsx(NotFoundPage, {}) })] })) : (_jsx(Route, { path: "/*", element: _jsx(AuthedRoutes, {}) }))] }))] }) }));
}
export default App;
//# sourceMappingURL=App.js.map