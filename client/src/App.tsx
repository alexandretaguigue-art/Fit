// DESIGN: "Coach Nocturne" — App principale
// Dark mode premium fitness, navigation par onglets

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WorkoutPage from "./pages/WorkoutPage";
import NutritionPage from "./pages/NutritionPage";
import ProgressPage from "./pages/ProgressPage";
import TipsPage from "./pages/TipsPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import Nav from "./components/Nav";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * AuthGate — routing conditionnel :
 * 1. Non connecté → LoginPage
 * 2. Connecté + onboarding non complété → OnboardingPage
 * 3. Connecté + onboarding complété → App normale
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: onboardingStatus, isLoading: onboardingLoading } =
    trpc.onboarding.getStatus.useQuery(undefined, {
      enabled: !!user,
    });

  // Loading state
  if (userLoading || (user && onboardingLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0F0F14" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #FF3366)",
              boxShadow: "0 8px 32px rgba(255,107,53,0.4)",
            }}
          >
            <Loader2 size={24} className="text-white animate-spin" />
          </div>
          <p
            className="text-white/40 text-sm"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Chargement…
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → Login
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated but onboarding not completed → Onboarding
  if (onboardingStatus && !onboardingStatus.onboardingCompleted) {
    return <OnboardingPage />;
  }

  // Fully authenticated + onboarded → App
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/workout"} component={WorkoutPage} />
        <Route path={"/nutrition"} component={NutritionPage} />
        <Route path={"/progress"} component={ProgressPage} />
        <Route path={"/tips"} component={TipsPage} />
        <Route component={Home} />
      </Switch>
      <Nav />
    </div>
  );
}

function Router() {
  return (
    <AuthGate>
      <AppRoutes />
    </AuthGate>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
