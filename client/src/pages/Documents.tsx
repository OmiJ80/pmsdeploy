import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientsAPI, DocumentsAPI } from "@/lib/api";
import type { Patient, Document } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";
import { FileText, Plus, Download, Trash2, Eye, Upload, Filter, File } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "lab_report", label: "Lab Report" },
  { value: "xray", label: "X-Ray" },
  { value: "scan", label: "Scan" },
  { value: "prescription", label: "Prescription" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "medical_history", label: "Medical History" },
  { value: "insurance", label: "Insurance" },
  { value: "vaccination", label: "Vaccination" },
  { value: "allergy_report", label: "Allergy Report" },
  { value: "other", label: "Other" },
];

export default function Documents() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [filterType, setFilterType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "other" as const,
    description: "",
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: PatientsAPI.list,
  });
  const { data: documents = [], isLoading, refetch } = useQuery<Document[]>({
    queryKey: ["documents.byPatient", selectedPatient],
    queryFn: () => DocumentsAPI.listByPatient(parseInt(selectedPatient)),
    enabled: !!selectedPatient,
  });

  const createDocumentMutation = useMutation({
    mutationFn: DocumentsAPI.create,
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setFormData({
        documentName: "",
        documentType: "other",
        description: "",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to upload document");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (vars: { id: number }) => DocumentsAPI.remove(vars.id),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete document");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) {
      toast.error("Please select a patient and file");
      return;
    }

    if (!formData.documentName) {
      toast.error("Please enter a document name");
      return;
    }

    // Simulate file upload to S3
    setUploadProgress(30);
    
    try {
      // In a real application, you would upload to S3 here
      // For now, we'll create a mock URL
      const fileUrl = URL.createObjectURL(file);
      const fileKey = `patients/${selectedPatient}/documents/${Date.now()}-${file.name}`;

      setUploadProgress(70);

      await new Promise(resolve => setTimeout(resolve, 500));

      createDocumentMutation.mutate({
        patientId: parseInt(selectedPatient),
        documentType: formData.documentType,
        documentName: formData.documentName,
        description: formData.description,
        fileUrl,
        fileKey,
        mimeType: file.type,
        fileSize: file.size,
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      toast.error("Failed to upload file");
      setUploadProgress(0);
    }
  };

  const handleDownload = (doc: any) => {
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocuments = filterType
    ? documents.filter((doc: any) => doc.documentType === filterType)
    : documents;

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType?.includes("pdf")) return "📄";
    if (mimeType?.includes("image")) return "🖼️";
    if (mimeType?.includes("word")) return "📝";
    if (mimeType?.includes("sheet")) return "📊";
    return "📎";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Medical Documents</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and organize patient medical records and documents
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="card-elegant">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Upload Medical Document</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient *
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
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
                  Document Type *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                  className="input-elegant w-full"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Document Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Blood Test Report - January 2024"
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Add notes or description about this document..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-elegant w-full resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Select File *
              </label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images, Word, Excel (Max 50MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.tiff"
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Uploading...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={createDocumentMutation.isPending || !selectedPatient || !formData.documentName}
              >
                {createDocumentMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Patient & Filter Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="input-elegant w-full"
          >
            <option value="">All Patients</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-elegant w-full"
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !selectedPatient ? (
          <div className="rounded-lg border border-border bg-muted p-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Select a patient to view their documents
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-12 text-center">
            <File className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {filterType ? "No documents found for this type" : "No documents uploaded yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((document: any) => (
              <div key={document.id} className="card-elegant">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDocumentIcon(document.mimeType)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {document.documentName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getDocumentTypeLabel(document.documentType)}
                        </p>
                      </div>
                    </div>
                    {document.description && (
                      <div className="mt-3 rounded-lg bg-muted p-3">
                        <p className="text-sm text-muted-foreground">{document.description}</p>
                      </div>
                    )}
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div>
                        <span className="font-medium text-foreground">ID:</span> {document.documentId}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Size:</span>{" "}
                        {document.fileSize ? (document.fileSize / 1024).toFixed(2) : "N/A"} KB
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Uploaded:</span>{" "}
                        {(document.uploadDate || document.createdAt)
                          ? format(parseISO((document.uploadDate || document.createdAt) as string), "MMM d, yyyy")
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.fileUrl, "_blank")}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocumentMutation.mutate({ id: document.id })}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
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
