import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import ProfileCompletionPage from "./pages/ProfileCompletion";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import { rememberRoute } from "./utils/routeMemory";

function RouteMemory({ user }: { user: boolean }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (user) rememberRoute(pathname);
  }, [pathname, user]);

  return null;
}

function AuthLoadingScreen() {
  return <div className="min-h-screen" style={{ background: "var(--bg)" }} />;
}

function AuthedRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:taskCode" element={<TaskRunnerPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/financials" element={<FinancialsPage />} />
        <Route path="/profile" element={<ProfileCompletionPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
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

  return (
    <ThemeProvider>
      <Router>
        <RouteMemory user={Boolean(user)} />
        {loading ? <Routes><Route path="*" element={<AuthLoadingScreen />} /></Routes> : (
          <Routes>
            <Route path="/" element={<Landing />} />
            {!user ? (
              <>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <Route path="/*" element={<AuthedRoutes />} />
            )}
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;
