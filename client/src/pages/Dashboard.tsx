import { useQuery } from "@tanstack/react-query";
import { AppointmentsAPI, PatientsAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Pill, 
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import type { Appointment, Patient } from "@shared/types";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch today's appointments
  const { data: todayAppointments = [], isLoading: appointmentsLoading } = 
    useQuery<Appointment[]>({ queryKey: ["appointments.today"], queryFn: AppointmentsAPI.today });

  // Fetch all patients count
  const { data: allPatients = [], isLoading: patientsLoading } = 
    useQuery<Patient[]>({ queryKey: ["patients"], queryFn: PatientsAPI.list });

  const stats = [
    {
      label: "Total Patients",
      value: allPatients.length,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
      action: () => setLocation("/patients"),
    },
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      icon: Calendar,
      color: "bg-green-100 text-green-700",
      action: () => setLocation("/appointments"),
    },
    {
      label: "Pending Prescriptions",
      value: "—",
      icon: Pill,
      color: "bg-purple-100 text-purple-700",
      action: () => setLocation("/prescriptions"),
    },
    {
      label: "Reports",
      value: "View",
      icon: FileText,
      color: "bg-orange-100 text-orange-700",
      action: () => setLocation("/reports"),
    },
  ];

  const completedAppointments = todayAppointments.filter(a => a.status === 'completed').length;
  const scheduledAppointments = todayAppointments.filter(a => a.status === 'scheduled').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to your clinic management system. Here's an overview of today's activities.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card-elegant cursor-pointer"
              onClick={stat.action}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Appointments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-elegant">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Today's Appointments</h2>
              <Button
                variant="outline"
                onClick={() => setLocation("/appointments")}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {appointmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="rounded-lg bg-muted p-8 text-center">
                <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Appointment #{appointment.appointmentId}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment.appointmentTime}
                        </span>
                        <span>{appointment.reason || "General Checkup"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.status === 'completed' && (
                        <span className="badge-success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </span>
                      )}
                      {appointment.status === 'scheduled' && (
                        <span className="badge-info">
                          <Clock className="mr-1 h-3 w-3" />
                          Scheduled
                        </span>
                      )}
                      {appointment.status === 'cancelled' && (
                        <span className="badge-danger">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="card-elegant">
            <h3 className="mb-4 text-lg font-bold text-foreground">Appointment Status</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Scheduled</span>
                  <span className="text-lg font-bold text-blue-600">{scheduledAppointments}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${todayAppointments.length > 0 ? (scheduledAppointments / todayAppointments.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Completed</span>
                  <span className="text-lg font-bold text-green-600">{completedAppointments}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${todayAppointments.length > 0 ? (completedAppointments / todayAppointments.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card-elegant">
            <h3 className="mb-4 text-lg font-bold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/patients")}
              >
                <Users className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/appointments")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setLocation("/prescriptions")}
              >
                <Pill className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
