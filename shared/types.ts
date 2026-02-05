export type Gender = "male" | "female" | "other";

export interface User {
  id?: number;
  name: string;
  email?: string;
  role?: string;
}

export interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: number;
  appointmentId: string;
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reason?: string;
}

export interface Document {
  id: number;
  documentId: string;
  patientId: number;
  documentType: string;
  documentName: string;
  description?: string;
  fileUrl: string;
  fileKey: string;
  mimeType?: string;
  fileSize?: number;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export * from "./_core/errors";
