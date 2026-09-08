import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
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
import TaskTrackingPage from "./pages/TaskTracking";
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
import { getAuthCallbackPath } from "./utils/authFlows";

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

function AuthCallbackRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const target = getAuthCallbackPath(window.location.search, window.location.hash);
    if (target) navigate(target, { replace: true });
  }, [navigate]);

  return null;
}

function AuthedRoutes() {
  return (
    <AppLayout>
      <ConsentGate>
        <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/task-tracking" element={<TaskTrackingPage />} />
        <Route path="/tasks/:taskCode" element={<TaskRunnerPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/financials" element={<FinancialsPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/profile" element={<ProfileCompletionPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<AboutPage />} />
        <Route path="/terms" element={<AboutPage />} />
        <Route path="/contact" element={<AboutPage />} />
        <Route path="/data-policy" element={<AboutPage />} />
        <Route path="/requester/apply" element={<RequesterKycPage />} />
        <Route path="/requester/tasks" element={<RequesterTasksPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ConsentGate>
    </AppLayout>
  );
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
      } else if (user) {
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

  return (
    <ThemeProvider>
      <Router>
        <AuthCallbackRedirect />
        <PageMeta />
        <RouteMemory user={Boolean(user)} />
        <CookieBanner />
        {loading ? <Routes><Route path="*" element={<AuthLoadingScreen />} /></Routes> : (
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<AboutPage />} />
            <Route path="/terms" element={<AboutPage />} />
            <Route path="/contact" element={<AboutPage />} />
            <Route path="/data-policy" element={<AboutPage />} />
            <Route path="/requester/apply" element={<RequesterKycPage />} />
            <Route path="/requester/tasks" element={<RequesterTasksPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            {!user ? (
              <>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={verificationEmail ? <Navigate to="/auth?verify=1" replace /> : <NotFoundPage />} />
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
