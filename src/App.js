import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { getCurrentUser } from "./utils/supabase";
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
    return (_jsx(AppLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/tasks", element: _jsx(TasksPage, {}) }), _jsx(Route, { path: "/tasks/:taskCode", element: _jsx(TaskRunnerPage, {}) }), _jsx(Route, { path: "/verify", element: _jsx(VerifyPage, {}) }), _jsx(Route, { path: "/deposit", element: _jsx(DepositPage, {}) }), _jsx(Route, { path: "/financials", element: _jsx(FinancialsPage, {}) }), _jsx(Route, { path: "/admin/payments", element: _jsx(AdminPaymentsPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfileCompletionPage, {}) }), _jsx(Route, { path: "/notifications", element: _jsx(NotificationsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }) }));
}
function App() {
    const { setUser, setLoading, user, loading } = useAuthStore();
    useEffect(() => {
        const initAuth = async () => {
            const { user } = await getCurrentUser();
            if (user) {
                setUser({
                    id: user.id,
                    email: user.email || "",
                    firstName: user.user_metadata?.first_name || "",
                    lastName: user.user_metadata?.last_name || "",
                    createdAt: user.created_at,
                    subscription: "free",
                    balance: 0,
                });
            }
            setLoading(false);
        };
        initAuth();
    }, [setUser, setLoading]);
    return (_jsx(ThemeProvider, { children: _jsxs(Router, { children: [_jsx(RouteMemory, { user: Boolean(user) }), loading ? _jsx(Routes, { children: _jsx(Route, { path: "*", element: _jsx(AuthLoadingScreen, {}) }) }) : (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), !user ? (_jsxs(_Fragment, { children: [_jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })) : (_jsx(Route, { path: "/*", element: _jsx(AuthedRoutes, {}) }))] }))] }) }));
}
export default App;
//# sourceMappingURL=App.js.map