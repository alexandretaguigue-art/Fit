// DESIGN: "Coach Nocturne" — App principale
// Dark mode premium fitness, navigation par onglets

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WorkoutPage from "./pages/WorkoutPage";
import NutritionPage from "./pages/NutritionPage";
import ProgressPage from "./pages/ProgressPage";
import TipsPage from "./pages/TipsPage";
import Nav from "./components/Nav";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
