import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientsAPI, PrescriptionsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Pill, Plus, Printer, Trash2, X, Eye, Download, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Medicine {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: string;
  instructions: string;
}

export default function Prescriptions() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine>({
    id: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "oral",
    quantity: "",
    instructions: "",
  });

  const [prescriptionData, setPrescriptionData] = useState({
    patientId: "",
    visitId: "",
    startDate: new Date().toISOString().split('T')[0],
    generalInstructions: "",
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: PatientsAPI.list,
  });
  const { data: prescriptions = [], isLoading, refetch } = useQuery({
    queryKey: ["prescriptions.byPatient", selectedPatient],
    queryFn: () => PrescriptionsAPI.listByPatient(parseInt(selectedPatient)),
    enabled: !!selectedPatient,
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: PrescriptionsAPI.create,
    onSuccess: () => {
      toast.success("Prescription created successfully");
      setMedicines([]);
      setCurrentMedicine({
        id: "",
        medicationName: "",
        dosage: "",
        frequency: "",
        duration: "",
        route: "oral",
        quantity: "",
        instructions: "",
      });
      setPrescriptionData({
        patientId: "",
        visitId: "",
        startDate: new Date().toISOString().split('T')[0],
        generalInstructions: "",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create prescription");
    },
  });

  const handleAddMedicine = () => {
    if (!currentMedicine.medicationName || !currentMedicine.dosage || !currentMedicine.frequency) {
      toast.error("Please fill in medicine name, dosage, and frequency");
      return;
    }

    const newMedicine = {
      ...currentMedicine,
      id: `med-${Date.now()}`,
    };

    setMedicines([...medicines, newMedicine]);
    setCurrentMedicine({
      id: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "oral",
      quantity: "",
      instructions: "",
    });
    toast.success("Medicine added to prescription");
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
    toast.success("Medicine removed");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionData.patientId || medicines.length === 0) {
      toast.error("Please select a patient and add at least one medicine");
      return;
    }

    const payload = {
      patientId: parseInt(prescriptionData.patientId),
      visitId: prescriptionData.visitId ? parseInt(prescriptionData.visitId) : 0,
      medicationName: medicines.map(m => m.medicationName.trim()).join(", "),
      dosage: medicines.map(m => m.dosage.trim()).join(", "),
      frequency: medicines.map(m => m.frequency.trim()).join(", "),
      duration: medicines[0]?.duration || "",
      route: medicines[0]?.route || "oral",
      instructions: prescriptionData.generalInstructions,
      startDate: prescriptionData.startDate,
    };

    if (editingId) {
      PrescriptionsAPI.update(editingId, payload)
        .then(() => {
          toast.success("Prescription updated successfully");
          setEditingId(null);
          setMedicines([]);
          setShowForm(false);
          setPrescriptionData({
            patientId: "",
            visitId: "",
            startDate: new Date().toISOString().split('T')[0],
            generalInstructions: "",
          });
          refetch();
        })
        .catch((error: any) => {
          toast.error(error?.message || "Failed to update prescription");
        });
    } else {
      createPrescriptionMutation.mutate(payload);
    }
  };

  const buildPrescriptionHtml = (prescription: any) => {
    const patient = patients.find((p: any) => p.id === prescription.patientId);
    const medNames = (prescription.medicationName || "").split(/\s*,\s*/).filter(Boolean);
    const dosages = (prescription.dosage || "").split(/\s*,\s*/).filter(Boolean);
    const frequencies = (prescription.frequency || "").split(/\s*,\s*/).filter(Boolean);

    return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription - ${prescription.prescriptionId}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { font-family: 'Arial', sans-serif; background: white; }
              .container { width: 100%; max-width: 900px; margin: 0 auto; padding: 40px; }
              .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .clinic-name { font-size: 28px; font-weight: bold; color: #1a1a1a; margin-bottom: 5px; }
              .clinic-subtitle { font-size: 12px; color: #666; margin-bottom: 10px; }
              .clinic-info { font-size: 11px; color: #666; line-height: 1.6; }
              
              .patient-info-table { width: 100%; margin: 30px 0; border-collapse: collapse; }
              .patient-info-table td { padding: 8px 12px; border: 1px solid #ddd; font-size: 12px; }
              .patient-info-table .label { font-weight: bold; background: #f5f5f5; width: 150px; }
              .patient-info-table .value { color: #333; }
              
              .rx-section { margin: 30px 0; }
              .rx-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 8px; }
              
              .medicines-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .medicines-table thead { background: #f0f0f0; }
              .medicines-table th { 
                border: 1px solid #ddd; 
                padding: 10px; 
                text-align: left; 
                font-weight: bold; 
                font-size: 11px;
                color: #333;
              }
              .medicines-table td { 
                border: 1px solid #ddd; 
                padding: 10px; 
                font-size: 11px;
                color: #333;
              }
              .medicines-table tbody tr:nth-child(odd) { background: #fafafa; }
              .medicines-table tbody tr:hover { background: #f5f5f5; }
              
              .footer { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
              .signature-box { text-align: center; width: 30%; }
              .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 11px; }
              .footer-text { text-align: center; font-size: 10px; color: #999; margin-top: 20px; line-height: 1.6; }
              
              .instructions-section { margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #007bff; }
              .instructions-label { font-weight: bold; margin-bottom: 5px; }
              .instructions-text { font-size: 11px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <div class="clinic-name">AGASTYA CLINIC</div>
                <div class="clinic-subtitle">Medical Prescription</div>
                <div class="clinic-info">
                  <div>Address: Ch.Shivaji Nagar, yadavvadi Road, Shiroli Pulachi, Tal-Hatkanagle, Dist -kolhapur.</div>
                  <div>Phone: 9511994525  | Email: agastyahospital15@gmail.com</div>
                  <div>Reg. No: I-93581-A </div>
                </div>
              </div>

              <!-- Patient Information Table -->
              <table class="patient-info-table">
                <tr>
                  <td class="label">Patient Name</td>
                  <td class="value">${patient ? patient.firstName + " " + patient.lastName : "N/A"}</td>
                  <td class="label">Patient ID</td>
                  <td class="value">${patient?.patientId || "N/A"}</td>
                </tr>
                <tr>
                  <td class="label">Age / DOB</td>
                  <td class="value">${patient?.dateOfBirth ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) + " years" : "N/A"}</td>
                  <td class="label">Gender</td>
                  <td class="value">${patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "N/A"}</td>
                </tr>
                <tr>
                  <td class="label">Contact</td>
                  <td class="value">${patient?.phone || "N/A"}</td>
                  <td class="label">Date of Visit</td>
                  <td class="value">${format(new Date(), "dd-MMM-yyyy")}</td>
                </tr>
                <tr>
                  <td class="label">Blood Type</td>
                  <td class="value">${patient?.bloodType || "N/A"}</td>
                  <td class="label">Prescription ID</td>
                  <td class="value">${prescription.prescriptionId}</td>
                </tr>
              </table>

              <!-- Medicines Section -->
              <div class="rx-section">
                <div class="rx-title">Rx - MEDICINES</div>
                <table class="medicines-table">
                  <thead>
                    <tr>
                      <th style="width: 5%;">S.No</th>
                      <th style="width: 25%;">Medicine Name</th>
                      <th style="width: 15%;">Dosage</th>
                      <th style="width: 20%;">Frequency</th>
                      <th style="width: 15%;">Duration</th>
                      <th style="width: 20%;">Route</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${medNames.map((name: string, idx: number) => `
                      <tr>
                        <td>${idx + 1}</td>
                        <td><strong>${name}</strong></td>
                        <td>${dosages[idx] ?? ""}</td>
                        <td>${frequencies[idx] ?? ""}</td>
                        <td>${prescription.duration || "As directed"}</td>
                        <td>${prescription.route || "Oral"}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>

              <!-- Instructions -->
              ${prescription.instructions ? `
                <div class="instructions-section">
                  <div class="instructions-label">General Instructions:</div>
                  <div class="instructions-text">${prescription.instructions}</div>
                </div>
              ` : ""}

              <!-- Footer -->
              <div class="footer">
                <div class="signature-section">
                  <div class="signature-box">
                    <div class="signature-line">Doctor's Signature & Seal</div>
                  </div>
                  <div class="signature-box">
                    <div style="font-size: 10px; color: #666;">
                      Printed: ${new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
  };

  const handlePrint = (prescription: any) => {
    const html = buildPrescriptionHtml(prescription);
    const printWindow = window.open("", "", "width=900,height=1200");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleView = (prescription: any) => {
    const html = buildPrescriptionHtml(prescription);
    const viewWindow = window.open("", "", "width=900,height=1200");
    if (viewWindow) {
      viewWindow.document.write(html);
      viewWindow.document.close();
    }
  };

  const handleDownload = (prescription: any) => {
    const html = buildPrescriptionHtml(prescription);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prescription-${prescription.prescriptionId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (prescription: any) => {
    setEditingId(prescription.id);
    setShowForm(true);
    setPrescriptionData({
      patientId: String(prescription.patientId),
      visitId: String(prescription.visitId ?? ""),
      startDate: prescription.startDate ? format(new Date(prescription.startDate), "yyyy-MM-dd") : new Date().toISOString().split('T')[0],
      generalInstructions: prescription.instructions ?? "",
    });
    const medNames = (prescription.medicationName || "").split(/\s*,\s*/).map((s: string) => s.trim()).filter(Boolean);
    const dosages = (prescription.dosage || "").split(/\s*,\s*/).map((s: string) => s.trim());
    const frequencies = (prescription.frequency || "").split(/\s*,\s*/).map((s: string) => s.trim());
    const route = prescription.route || "oral";
    const duration = prescription.duration || "";
    const combined = medNames.map((name: string, idx: number) => ({
      id: `med-${Date.now()}-${idx}`,
      medicationName: name,
      dosage: dosages[idx] ?? "",
      frequency: frequencies[idx] ?? "",
      duration,
      route,
      quantity: "",
      instructions: "",
    }));
    setMedicines(combined);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Prescriptions</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage patient prescriptions
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setMedicines([]);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {/* Prescription Form */}
      {showForm && (
        <div className="card-elegant space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Create New Prescription</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setMedicines([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Patient Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Patient *
              </label>
              <select
                value={prescriptionData.patientId}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, patientId: e.target.value })}
                className="input-elegant w-full"
              >
                <option value="">Select a patient</option>
                {patients.map((patient: any) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={prescriptionData.startDate}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, startDate: e.target.value })}
                className="input-elegant"
              />
            </div>
          </div>

          {/* Add Medicine Section */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Add Medicines</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Medicine Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Aspirin, Amoxicillin"
                  value={currentMedicine.medicationName}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, medicationName: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dosage *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 500mg, 1 tablet"
                  value={currentMedicine.dosage}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, dosage: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Frequency *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 3 times daily, Once at night"
                  value={currentMedicine.frequency}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, frequency: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 3 days, 1 week"
                  value={currentMedicine.duration}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, duration: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Route
                </label>
                <select
                  value={currentMedicine.route}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, route: e.target.value })}
                  className="input-elegant w-full"
                >
                  <option value="oral">Oral</option>
                  <option value="injection">Injection</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                  <option value="rectal">Rectal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantity
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 10 tablets, 1 bottle"
                  value={currentMedicine.quantity}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, quantity: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Special Instructions
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Take with food, Avoid dairy"
                  value={currentMedicine.instructions}
                  onChange={(e) => setCurrentMedicine({ ...currentMedicine, instructions: e.target.value })}
                  className="input-elegant"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddMedicine}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Medicine
            </Button>
          </div>

          {/* Added Medicines Table */}
          {medicines.length > 0 && (
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Medicines Added ({medicines.length})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">S.No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Medicine</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Dosage</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Frequency</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Duration</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Route</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {medicines.map((medicine, index) => (
                      <tr key={medicine.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{medicine.medicationName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{medicine.dosage}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{medicine.frequency}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{medicine.duration || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{medicine.route}</td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMedicine(medicine.id)}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* General Instructions */}
          <div className="border-t border-border pt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              General Instructions
            </label>
            <textarea
              placeholder="Add any general instructions or notes for the patient..."
              value={prescriptionData.generalInstructions}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, generalInstructions: e.target.value })}
              className="input-elegant w-full resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 border-t border-border pt-6">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createPrescriptionMutation.isPending || medicines.length === 0}
            >
              {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setMedicines([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Patient Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Patient to View Prescriptions
        </label>
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="input-elegant w-full md:w-1/3"
        >
          <option value="">All Patients</option>
          {patients.map((patient: any) => (
            <option key={patient.id} value={patient.id}>
              {patient.firstName} {patient.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Prescriptions Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Prescription ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Patient</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Medicines</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Created</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Loading prescriptions...
                </td>
              </tr>
            ) : !selectedPatient ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="h-8 w-8 text-muted-foreground" />
                    <p>Select a patient to view their prescriptions</p>
                  </div>
                </td>
              </tr>
            ) : prescriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="h-8 w-8 text-muted-foreground" />
                    <p>No prescriptions for this patient</p>
                  </div>
                </td>
              </tr>
            ) : (
              prescriptions.map((prescription: any) => (
                <tr key={prescription.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {prescription.prescriptionId}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {patients.find((p: any) => p.id === prescription.patientId)?.firstName}{" "}
                    {patients.find((p: any) => p.id === prescription.patientId)?.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {prescription.medicationName}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(prescription.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(prescription)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(prescription)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(prescription)}
                        className="gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prescription)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
