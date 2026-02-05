import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClinicDashboardLayout } from "./components/ClinicDashboardLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Prescriptions from "./pages/Prescriptions";
import Reports from "./pages/Reports";
import Documents from "./pages/Documents";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={() => (
        <ClinicDashboardLayout>
          <Dashboard />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/patients"} component={() => (
        <ClinicDashboardLayout>
          <Patients />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/appointments"} component={() => (
        <ClinicDashboardLayout>
          <Appointments />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/prescriptions"} component={() => (
        <ClinicDashboardLayout>
          <Prescriptions />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/reports"} component={() => (
        <ClinicDashboardLayout>
          <Reports />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/documents"} component={() => (
        <ClinicDashboardLayout>
          <Documents />
        </ClinicDashboardLayout>
      )} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
