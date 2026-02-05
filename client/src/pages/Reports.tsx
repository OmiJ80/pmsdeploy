import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AppointmentsAPI, PatientsAPI } from "@/lib/api";

export default function Reports() {
  const [reportType, setReportType] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<any | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const handleGenerateDaily = () => {
    setDailyLoading(true);
    Promise.all([
      AppointmentsAPI.getByDate(selectedDate),
      PatientsAPI.list(),
    ])
      .then(([appointments, patients]) => {
        const completed = appointments.filter((a: any) => a.status === "completed").length;
        const cancelled = appointments.filter((a: any) => a.status === "cancelled").length;
        const report = {
          reportId: `daily-${selectedDate}`,
          reportType: "daily",
          reportDate: selectedDate,
          totalAppointments: appointments.length,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
          totalPatients: patients.length,
          newPatients: 0,
          reportData: JSON.stringify({ appointments }),
        };
        setDailyReport(report);
        toast.success("Daily report generated successfully");
      })
      .catch((error: any) => {
        toast.error(error?.message || "Failed to generate daily report");
      })
      .finally(() => setDailyLoading(false));
  };

  const handleGenerateMonthly = () => {
    setMonthlyLoading(true);
    Promise.all([AppointmentsAPI.list(), PatientsAPI.list()])
      .then(([appointments, patients]) => {
        const [yearStr, monthStr] = selectedMonth.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const filtered = appointments.filter((a: any) => {
          const d = new Date(a.appointmentDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
        const completed = filtered.filter((a: any) => a.status === "completed").length;
        const cancelled = filtered.filter((a: any) => a.status === "cancelled").length;
        const report = {
          reportId: `monthly-${selectedMonth}`,
          reportType: "monthly",
          reportDate: `${selectedMonth}-01`,
          totalAppointments: filtered.length,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
          totalPatients: patients.length,
          newPatients: 0,
          reportData: JSON.stringify({ appointments: filtered }),
        };
        setMonthlyReport(report);
        toast.success("Monthly report generated successfully");
      })
      .catch((error: any) => {
        toast.error(error?.message || "Failed to generate monthly report");
      })
      .finally(() => setMonthlyLoading(false));
  };

  const handleDownloadReport = (report: any) => {
    const reportData = JSON.parse(report.reportData || "{}");
    const csvContent = `
Clinic Management System - ${report.reportType === "daily" ? "Daily" : "Monthly"} Report
Generated: ${new Date().toLocaleString()}
Report Date: ${format(new Date(report.reportDate), "MMMM d, yyyy")}

APPOINTMENT STATISTICS
Total Appointments: ${report.totalAppointments}
Completed: ${report.completedAppointments}
Cancelled: ${report.cancelledAppointments}
Scheduled: ${report.totalAppointments - report.completedAppointments - report.cancelledAppointments}

PATIENT STATISTICS
Total Patients: ${report.totalPatients}
New Patients: ${report.newPatients}

DETAILED BREAKDOWN
${JSON.stringify(reportData, null, 2)}
    `.trim();

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    element.setAttribute("download", `report-${report.reportId}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const currentReport = reportType === "daily" ? dailyReport : monthlyReport;
  const isLoading = reportType === "daily" ? dailyLoading : monthlyLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Generate and view clinic reports and statistics
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="card-elegant">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Generate Report</h2>
        <div className="space-y-6">
          {/* Report Type Tabs */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setReportType("daily")}
              className={`px-4 py-2 font-medium transition-all ${
                reportType === "daily"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 font-medium transition-all ${
                reportType === "monthly"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly Report
            </button>
          </div>

          {/* Daily Report Section */}
          {reportType === "daily" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Date
                </label>
                <div className="flex gap-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-elegant flex-1"
                  />
                  <Button
                    onClick={handleGenerateDaily}
                    disabled={dailyLoading}
                  >
                    {dailyLoading ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Report Section */}
          {reportType === "monthly" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Month
                </label>
                <div className="flex gap-4">
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="input-elegant flex-1"
                  />
                  <Button
                    onClick={handleGenerateMonthly}
                    disabled={monthlyLoading}
                  >
                    {monthlyLoading ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Display */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : currentReport ? (
        <div className="card-elegant">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {reportType === "daily" ? "Daily" : "Monthly"} Report - {format(new Date(currentReport.reportDate), reportType === "daily" ? "MMMM d, yyyy" : "MMMM yyyy")}
            </h2>
            <Button
              onClick={() => handleDownloadReport(currentReport)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>

          {/* Statistics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {currentReport?.totalAppointments ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {currentReport?.completedAppointments ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {currentReport?.cancelledAppointments ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {(currentReport?.totalAppointments ?? 0) - (currentReport?.completedAppointments ?? 0) - (currentReport?.cancelledAppointments ?? 0)}
              </p>
            </div>
          </div>

          {/* Patient Statistics */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {currentReport?.totalPatients ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">New Patients</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {currentReport?.newPatients ?? 0}
              </p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-muted-foreground mb-3">Appointment Completion Rate</p>
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${
                    (currentReport?.totalAppointments ?? 0) > 0
                      ? ((currentReport?.completedAppointments ?? 0) / (currentReport?.totalAppointments ?? 1)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-foreground">
              {(currentReport?.totalAppointments ?? 0) > 0
                ? Math.round(((currentReport?.completedAppointments ?? 0) / (currentReport?.totalAppointments ?? 1)) * 100)
                : 0}
              % completed
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted p-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {reportType === "daily"
              ? "Generate a daily report to view statistics"
              : "Generate a monthly report to view statistics"}
          </p>
        </div>
      )}
    </div>
  );
}
