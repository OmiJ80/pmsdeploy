import { useQuery, useMutation } from "@tanstack/react-query";
import { AppointmentsAPI, PatientsAPI } from "@/lib/api";
import type { Appointment, Patient } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Calendar, Plus, Clock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    patientId: "",
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: "09:00",
    reason: "",
  });

  const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: AppointmentsAPI.list,
  });
  const { data: todayAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["appointments.byDate", selectedDate],
    queryFn: () => AppointmentsAPI.getByDate(selectedDate),
  });
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: PatientsAPI.list,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: AppointmentsAPI.create,
    onSuccess: () => {
      toast.success("Appointment scheduled successfully");
      setFormData({
        patientId: "",
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: "09:00",
        reason: "",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to schedule appointment");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: number; status: "scheduled" | "completed" | "cancelled" }) =>
      AppointmentsAPI.updateStatus(vars.id, vars.status),
    onSuccess: () => {
      toast.success("Appointment status updated");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update appointment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    createAppointmentMutation.mutate({
      patientId: parseInt(formData.patientId),
      appointmentDate: formData.appointmentDate,
      appointmentTime: formData.appointmentTime,
      reason: formData.reason,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "scheduled":
        return "badge-info";
      case "cancelled":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Appointments</h1>
          <p className="mt-2 text-muted-foreground">
            Schedule and manage patient appointments
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Appointment Form */}
      {showForm && (
        <div className="card-elegant">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Schedule New Appointment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="input-elegant w-full"
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time *
                </label>
                <Input
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason
                </label>
                <Input
                  type="text"
                  placeholder="General checkup, Follow-up, etc."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input-elegant"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={createAppointmentMutation.isPending}>
                {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Date Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            Filter by Date
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-elegant"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-12 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No appointments scheduled for {format(new Date(selectedDate), "MMMM d, yyyy")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="card-elegant">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">
                        Appointment #{appointment.appointmentId}
                      </h3>
                      <span className={getStatusColor(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {appointment.appointmentTime}
                      </div>
                      {appointment.reason && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {appointment.reason}
                        </div>
                      )}
                      <div className="text-xs">
                        Patient ID: {appointment.patientId}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {appointment.status === "scheduled" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: appointment.id,
                              status: "completed",
                            })
                          }
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: appointment.id,
                              status: "cancelled",
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
