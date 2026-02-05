import axios from "axios";
import { AXIOS_TIMEOUT_MS } from "@shared/const";
import { format } from "date-fns";
import type { Patient, Appointment, Document } from "@shared/types";

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL || "/api";
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: AXIOS_TIMEOUT_MS,
});

export const PatientsAPI = {
  list: async (): Promise<Patient[]> => {
    const r = await api.get("/patients");
    return r.data as Patient[];
  },
  search: async (query: string): Promise<Patient[]> => {
    const r = await api.get("/patients/search", { params: { query } });
    return r.data as Patient[];
  },
  create: async (input: any): Promise<Patient> => {
    const payload = { ...input, patientId: input.patientId ?? `PT-${Date.now()}` };
    if (payload.dateOfBirth) {
      payload.dateOfBirth = format(new Date(payload.dateOfBirth), "yyyy-MM-dd");
    }
    const r = await api.post("/patients", payload);
    return r.data as Patient;
  },
  update: async (input: any): Promise<Patient> => {
    const payload = { ...input };
    if (payload.dateOfBirth) {
      payload.dateOfBirth = format(new Date(payload.dateOfBirth), "yyyy-MM-dd");
    }
    const r = await api.put(`/patients/${input.id}`, payload);
    return r.data as Patient;
  },
  remove: async (id: number): Promise<void> => {
    const r = await api.delete(`/patients/${id}`);
    return r.data as void;
  },
};

export const AppointmentsAPI = {
  list: async (): Promise<Appointment[]> => {
    const r = await api.get("/appointments");
    return r.data as Appointment[];
  },
  getByDate: async (date: string): Promise<Appointment[]> => {
    const r = await api.get("/appointments/date", { params: { date } });
    return r.data as Appointment[];
  },
  today: async (): Promise<Appointment[]> => {
    const r = await api.get("/appointments/today");
    return r.data as Appointment[];
  },
  create: async (input: any): Promise<Appointment> => {
    const time =
      String(input.appointmentTime).split(":").length === 2
        ? `${input.appointmentTime}:00`
        : input.appointmentTime;
    const payload = {
      appointmentId: "APT-" + Date.now(),
      patientId: input.patientId,
      appointmentDate: input.appointmentDate,
      appointmentTime: time,
      status: "scheduled",
      reason: input.reason ?? "",
    };
    const r = await api.post("/appointments", payload);
    return r.data as Appointment;
  },
  updateStatus: async (
    id: number,
    status: "scheduled" | "completed" | "cancelled"
  ): Promise<Appointment> => {
    const r = await api.put(`/appointments/${id}/status`, { status });
    return r.data as Appointment;
  },
};

export const PrescriptionsAPI = {
  listByPatient: async (patientId: number) => {
    const r = await api.get(`/prescriptions/patient/${patientId}`);
    return r.data;
  },
  create: async (input: any) => {
    const payload = {
      prescriptionId: "PR-" + Date.now(),
      visitId: input.visitId ?? 0,
      patientId: input.patientId,
      medicationName: input.medicationName,
      dosage: input.dosage,
      frequency: input.frequency,
      duration: input.duration ?? "",
      route: input.route ?? "oral",
      quantity: input.quantity ?? null,
      instructions: input.instructions ?? "",
      startDate: format(new Date(input.startDate), "yyyy-MM-dd"),
      status: "active",
    };
    const r = await api.post("/prescriptions", payload);
    return r.data;
  },
  update: async (id: number, input: any) => {
    const payload = { ...input };
    if (payload.startDate) {
      payload.startDate = format(new Date(payload.startDate), "yyyy-MM-dd");
    }
    const r = await api.put(`/prescriptions/${id}`, payload);
    return r.data;
  },
};

export const DocumentsAPI = {
  listByPatient: async (patientId: number): Promise<Document[]> => {
    const r = await api.get(`/documents/patient/${patientId}`);
    return r.data as Document[];
  },
  create: async (input: any): Promise<Document> => {
    const r = await api.post("/documents", input);
    return r.data as Document;
  },
  remove: async (id: number): Promise<void> => {
    const r = await api.delete(`/documents/${id}`);
    return r.data as void;
  },
};
