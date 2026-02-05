import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Calendar, 
  Users, 
  FileText, 
  Pill, 
  BarChart3, 
  LogOut, 
  Menu,
  X,
  Home,
  Stethoscope
} from "lucide-react";
import { useState } from "react";

interface ClinicDashboardLayoutProps {
  children: React.ReactNode;
}

export function ClinicDashboardLayout({ children }: ClinicDashboardLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Stethoscope className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-3xl font-bold text-foreground">Clinic Management System</h1>
          <p className="mb-6 text-muted-foreground">Please log in to continue</p>
          <a href={getLoginUrl()}>
            <Button>Login</Button>
          </a>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { label: "Dashboard", icon: Home, path: "/" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Appointments", icon: Calendar, path: "/appointments" },
    { label: "Prescriptions", icon: Pill, path: "/prescriptions" },
    { label: "Documents", icon: FileText, path: "/documents" },
    { label: "Reports", icon: BarChart3, path: "/reports" },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-elegant transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex items-center justify-between border-b border-border px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">ClinicCare</h1>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setLocation(item.path);
                    setSidebarOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-border px-4 py-6">
            <div className="mb-4 rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="font-medium text-foreground">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 font-medium text-destructive-foreground transition-all hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-xl font-semibold text-foreground">Welcome back, {user?.name}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
