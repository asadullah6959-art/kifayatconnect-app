import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Download, 
  ShieldCheck, 
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MembershipApplication, SupportingDocument, SupportingDocumentType } from '../../types';
import { compressImageFile } from '../../utils/imageCompression';

interface DocumentUploadModalProps {
  application: MembershipApplication;
  onClose: () => void;
}

const DOCUMENT_CATEGORIES: { type: SupportingDocumentType; label: string; icon: string; description: string }[] = [
  { 
    type: 'IDENTIFICATION_CNIC', 
    label: 'National Identity (CNIC)', 
    icon: '🪪', 
    description: 'NADRA Smart Card or CNIC Front & Back' 
  },
  { 
    type: 'EXPENSE_RECEIPT', 
    label: 'Expense / Payment Receipt', 
    icon: '🧾', 
    description: 'Membership fee or regional expense receipt' 
  },
  { 
    type: 'DEPOSIT_SLIP', 
    label: 'Bank Deposit Slip', 
    icon: '🏦', 
    description: 'Bank counter deposit or Raast/1Link transfer slip' 
  },
  { 
    type: 'UTILITY_BILL', 
    label: 'Residential Utility Bill', 
    icon: '💡', 
    description: 'Electricity, Gas, or Water bill for address verification' 
  },
  { 
    type: 'INCOME_PROOF', 
    label: 'Income Proof / Affidavit', 
    icon: '📄', 
    description: 'Salary slip, income affidavit, or pension letter' 
  },
  { 
    type: 'OTHER', 
    label: 'Other Supporting Record', 
    icon: '📁', 
    description: 'Legacy card, recommendation letter, or certificate' 
  }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ application, onClose }) => {
  const { 
    currentUser, 
    attachDocumentToApplication, 
    removeDocumentFromApplication, 
    verifyApplicationDocument 
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isDistrictAdmin = currentUser?.role === 'ADMIN';
  const canVerify = isSuperAdmin || isDistrictAdmin;

  // Form states
  const [selectedType, setSelectedType] = useState<SupportingDocumentType>('IDENTIFICATION_CNIC');
  const [docName, setDocName] = useState('');
  const [notes, setNotes] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileMime, setFileMime] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox / Fullscreen viewer state
  const [viewingDoc, setViewingDoc] = useState<SupportingDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Flag & delete inline confirmation state (no window.alert/window.confirm)
  const [flaggingDocId, setFlaggingDocId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagError, setFlagError] = useState<string | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<SupportingDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processSelectedFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum permitted size is 5MB.`);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setUploadError('Invalid format. Please upload JPG, PNG, WEBP images, or PDF documents.');
      return;
    }

    setFileName(file.name);
    if (!docName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setDocName(cleanName);
    }

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, 1080, 0.78);
        setFileDataUrl(compressed.dataUrl);
        setFileSize(compressed.sizeBytes);
        setFileMime('image/jpeg');
        return;
      } catch {
        // fallback to FileReader if canvas fails
      }
    }

    setFileSize(file.size);
    setFileMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileDataUrl(event.target?.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileDataUrl) {
      setUploadError('Please select or drop a document to upload.');
      return;
    }
    if (!docName.trim()) {
      setUploadError('Please enter a descriptive document title.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const result = attachDocumentToApplication(application.id, {
        name: docName.trim(),
        type: selectedType,
        fileUrl: fileDataUrl,
        fileSize,
        fileMime,
        notes: notes.trim() || undefined
      });

      if (result.success) {
        setUploadSuccess('Supporting document attached successfully to application dossier.');
        // Reset form
        setFileDataUrl(null);
        setFileName('');
        setFileSize(0);
        setFileMime('');
        setDocName('');
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadError(result.error || 'Failed to attach document.');
      }
    } catch {
      setUploadError('Unexpected error during upload. Please verify file integrity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFlag = (docId: string) => {
    if (!flagReason.trim()) {
      setFlagError('Please specify why this document is being flagged (e.g. unreadable scan, name mismatch).');
      return;
    }
    setFlagError(null);
    verifyApplicationDocument(application.id, docId, 'FLAGGED', flagReason.trim());
    setFlaggingDocId(null);
    setFlagReason('');
  };

  const docs = application.supportingDocuments || [];
  const verifiedCount = docs.filter(d => d.verificationStatus === 'VERIFIED').length;
  const flaggedCount = docs.filter(d => d.verificationStatus === 'FLAGGED').length;
  const pendingCount = docs.filter(d => !d.verificationStatus || d.verificationStatus === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/90 p-3 sm:p-5 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92dvh] my-auto overflow-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#0a192f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Dossier & Supporting Documents
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Secure Storage
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Applicant: <strong className="text-amber-300 font-semibold">{application.applicantName}</strong> · CNIC: <span className="font-mono text-slate-200">{application.cnic}</span> · {application.district}, {application.stateProvince}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column Layout on Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Attached</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">{docs.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Verified</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">{verifiedCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Pending Review</span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">{pendingCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Flagged / Action Req.</span>
              <span className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">{flaggedCount}</span>
            </div>
          </div>

          {/* Section 1: Upload New Supporting Document */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Attach New Supporting Document
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Max 5MB · Allowed: JPG, PNG, WEBP, PDF
              </span>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category Selector Grid */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Document Classification:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setSelectedType(cat.type)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                        selectedType === cat.type
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 text-slate-900 dark:text-white ring-1 ring-amber-400'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5">{cat.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{cat.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                          {cat.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  fileDataUrl
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelection}
                  className="hidden"
                />

                {fileDataUrl ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    {fileMime.startsWith('image/') ? (
                      <div className="relative group">
                        <img 
                          src={fileDataUrl} 
                          alt="Upload preview" 
                          className="h-28 max-w-full rounded-lg object-contain shadow-xs border border-slate-200 dark:border-slate-700" 
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                          Preview
                        </span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex flex-col items-center justify-center text-rose-600 dark:text-rose-400">
                        <FileText className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase mt-0.5">PDF</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-sm">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatFileSize(fileSize)} · Click to change file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drag & drop document here, or <span className="text-amber-600 underline font-bold">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Supports high-resolution scans, photos of receipts or NADRA CNIC cards
                    </p>
                  </div>
                )}
              </div>

              {/* Title & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g., CNIC Smart Card Front Scan"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Internal Verification Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Verified by District Admin physically"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!fileDataUrl || isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0a192f] hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-400/40 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSubmitting ? 'Attaching Document...' : 'Attach Document to Dossier'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Attached Documents Gallery & Audit Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Existing Dossier Records ({docs.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Authorized officers may verify or flag supporting files
              </span>
            </div>

            {docs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                No supporting documents attached yet. Upload receipts or identification scans above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {docs.map(doc => {
                  const isPdf = doc.fileMime === 'application/pdf' || doc.fileUrl.startsWith('data:application/pdf');
                  const isImage = doc.fileMime.startsWith('image/') || doc.fileUrl.startsWith('data:image/');

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-400/50 transition-all"
                    >
                      <div className="space-y-2">
                        {/* Top row: Type badge & Verification Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            {doc.type.replace(/_/g, ' ')}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : doc.verificationStatus === 'FLAGGED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}>
                            {doc.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : doc.verificationStatus === 'FLAGGED' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{doc.verificationStatus || 'PENDING'}</span>
                          </span>
                        </div>

                        {/* Title and Media Preview Snippet */}
                        <div className="flex items-start gap-3">
                          <div 
                            onClick={() => {
                              setViewingDoc(doc);
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer group relative flex items-center justify-center hover:opacity-90"
                          >
                            {isImage ? (
                              <img src={doc.fileUrl} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-7 h-7 text-rose-500" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.name}>
                              {doc.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Uploaded by: <span className="font-semibold text-slate-600 dark:text-slate-300">{doc.uploadedByName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Notes or Verification Remarks */}
                        {doc.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800/60 italic">
                            "{doc.notes}"
                          </p>
                        )}

                        {doc.verificationNotes && (
                          <div className="text-[10px] p-2 rounded bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                            <strong>Reviewer Note ({doc.verifiedBy}):</strong> {doc.verificationNotes}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {/* Preview and Download */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingDoc(doc);
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <a
                            href={doc.fileUrl}
                            download={doc.name || 'kifayat-connect-doc'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {(isSuperAdmin || doc.uploadedBy === currentUser.id) && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDoc(doc)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Admin Verification Controls */}
                        {canVerify && (
                          <div className="flex items-center gap-1.5">
                            {doc.verificationStatus !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => verifyApplicationDocument(application.id, doc.id, 'VERIFIED')}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {doc.verificationStatus !== 'FLAGGED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingDocId(doc.id);
                                  setFlagReason('');
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Flag</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            All uploaded records are audited with timestamp and user ID.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: FLAGGING PROMPT */}
      {flaggingDocId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Flag Supporting Document</span>
            </h4>
            <p className="text-xs text-slate-500">
              Provide a clear reason for the applicant or review committee (e.g., blurry image, expired CNIC, incorrect receipt amount).
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => {
                setFlagReason(e.target.value);
                if (flagError) setFlagError(null);
              }}
              placeholder="Enter reason for flagging..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-rose-500"
            />
            {flagError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{flagError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFlaggingDocId(null);
                  setFlagError(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmFlag(flaggingDocId)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 1B: DELETE CONFIRMATION (Replaces window.confirm) */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Remove Supporting File?</span>
            </h4>
            <p className="text-xs text-slate-500">
              Remove <strong>"{confirmDeleteDoc.name}"</strong> from this application dossier? This action is recorded in the audit log.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeDocumentFromApplication(application.id, confirmDeleteDoc.id);
                  setConfirmDeleteDoc(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Remove File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: HIGH-RESOLUTION LIGHTBOX VIEWER */}
      {viewingDoc && (
        <div className="fixed inset-0 z-70 flex flex-col bg-slate-950/95">
          {/* Lightbox Toolbar */}
          <div className="px-6 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-sm text-amber-300 truncate max-w-md">
                {viewingDoc.name}
              </h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                {viewingDoc.type}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                aria-label="Zoom in"
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                aria-label="Zoom out"
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                aria-label="Rotate"
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <a
                href={viewingDoc.fileUrl}
                download={viewingDoc.name}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white ml-2"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                aria-label="Close viewer"
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Content Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {viewingDoc.fileMime === 'application/pdf' || viewingDoc.fileUrl.startsWith('data:application/pdf') ? (
              <div className="w-full h-full max-w-4xl bg-slate-900 rounded-xl overflow-hidden flex flex-col">
                <iframe
                  src={viewingDoc.fileUrl}
                  title={viewingDoc.name}
                  className="w-full flex-1 border-0"
                />
              </div>
            ) : (
              <div 
                className="transition-transform duration-150 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={viewingDoc.fileUrl}
                  alt={viewingDoc.name}
                  className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
