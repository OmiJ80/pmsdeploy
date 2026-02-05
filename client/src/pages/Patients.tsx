import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Users, Plus, Search, Mail, Phone, Calendar, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
}

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
  });

  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ["patients"],
    queryFn: PatientsAPI.list,
  });
  const { data: searchResults = [] } = useQuery({
    queryKey: ["patients.search", searchQuery],
    queryFn: () => PatientsAPI.search(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const createPatientMutation = useMutation({
    mutationFn: PatientsAPI.create,
    onSuccess: () => {
      toast.success("Patient registered successfully");
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to register patient");
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: PatientsAPI.update,
    onSuccess: () => {
      toast.success("Patient updated successfully");
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update patient");
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: (vars: { id: number }) => PatientsAPI.remove(vars.id),
    onSuccess: () => {
      toast.success("Patient deleted successfully");
      setShowDeleteConfirm(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete patient");
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "male",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      emergencyContact: "",
      emergencyPhone: "",
      bloodType: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (patient: any) => {
    setEditingId(patient.id);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email || "",
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "yyyy-MM-dd") : "",
      gender: patient.gender || "male",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      zipCode: patient.zipCode || "",
      emergencyContact: patient.emergencyContact || "",
      emergencyPhone: patient.emergencyPhone || "",
      bloodType: patient.bloodType || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      const payload: any = { id: editingId, ...formData };
      const dob = formData.dateOfBirth?.trim();
      if (!dob) {
        delete payload.dateOfBirth;
      } else {
        payload.dateOfBirth = format(new Date(dob), "yyyy-MM-dd");
      }
      updatePatientMutation.mutate(payload);
    } else {
      const payload: any = { ...formData };
      const dob = formData.dateOfBirth?.trim();
      if (!dob) {
        delete payload.dateOfBirth;
      } else {
        payload.dateOfBirth = format(new Date(dob), "yyyy-MM-dd");
      }
      createPatientMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    deletePatientMutation.mutate({ id });
  };

  const displayPatients = searchQuery ? searchResults : patients;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Patients</h1>
          <p className="mt-2 text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="card-elegant">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {editingId ? "Edit Patient" : "Patient Registration"}
            </h2>
            <button
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="input-elegant w-full"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Address Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address
                  </label>
                  <Input
                    type="text"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <Input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State
                  </label>
                  <Input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Zip Code
                  </label>
                  <Input
                    type="text"
                    placeholder="12345"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input-elegant"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Medical Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Blood Type
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="input-elegant w-full"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Emergency Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Emergency Contact Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Contact Name"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Emergency Contact Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="input-elegant"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 border-t border-border pt-6">
              <Button
                type="submit"
                disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
              >
                {editingId ? "Update Patient" : "Register Patient"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search patients by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-elegant pl-10"
        />
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Patient ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Age</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Blood Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  Loading patients...
                </td>
              </tr>
            ) : displayPatients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  {searchQuery ? "No patients found matching your search" : "No patients registered yet"}
                </td>
              </tr>
            ) : (
              displayPatients.map((patient: any) => {
                const age = patient.dateOfBirth
                  ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                  : "-";
                return (
                  <tr key={patient.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{patient.patientId}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {patient.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {patient.email}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{age}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{patient.bloodType || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(patient.id)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card-elegant w-full max-w-md">
            <h3 className="text-lg font-bold text-foreground">Delete Patient</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete this patient? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-4">
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deletePatientMutation.isPending}
              >
                {deletePatientMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
