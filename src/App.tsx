import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
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
