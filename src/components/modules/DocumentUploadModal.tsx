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

const DOCUMENT_CATEGORIES: {
  type: SupportingDocumentType;
  label: string;
  labelUr: string;
  icon: string;
  description: string;
  descriptionUr: string;
}[] = [
  { 
    type: 'IDENTIFICATION_CNIC', 
    label: 'National Identity (CNIC)', 
    labelUr: 'قومی شناختی کارڈ (CNIC)',
    icon: '🪪', 
    description: 'NADRA Smart Card or CNIC Front & Back',
    descriptionUr: 'نادرا سمارٹ کارڈ یا شناختی کارڈ اگلا اور پچھلا رخ'
  },
  { 
    type: 'EXPENSE_RECEIPT', 
    label: 'Expense / Payment Receipt', 
    labelUr: 'ادائیگی / خرچ کی رسید',
    icon: '🧾', 
    description: 'Membership fee or regional expense receipt',
    descriptionUr: 'ممبرشپ فیس یا علاقائی اخراجات کی رسید'
  },
  { 
    type: 'DEPOSIT_SLIP', 
    label: 'Bank Deposit Slip', 
    labelUr: 'بینک ڈپازٹ سلپ',
    icon: '🏦', 
    description: 'Bank counter deposit or Raast/1Link transfer slip',
    descriptionUr: 'بینک کاؤنٹر ڈپازٹ یا راست / ون لنک ٹرانسفر سلپ'
  },
  { 
    type: 'UTILITY_BILL', 
    label: 'Residential Utility Bill', 
    labelUr: 'رہائشی یوٹیلیٹی بل',
    icon: '💡', 
    description: 'Electricity, Gas, or Water bill for address verification',
    descriptionUr: 'پتے کی تصدیق کے لیے بجلی، گیس یا پانی کا بل'
  },
  { 
    type: 'INCOME_PROOF', 
    label: 'Income Proof / Affidavit', 
    labelUr: 'آمدن کا ثبوت / حلف نامہ',
    icon: '📄', 
    description: 'Salary slip, income affidavit, or pension letter',
    descriptionUr: 'تنخواہ کی سلپ، حلف نامہ یا پنشن لیٹر'
  },
  { 
    type: 'OTHER', 
    label: 'Other Supporting Record', 
    labelUr: 'دیگر معاون ریکارڈ',
    icon: '📁', 
    description: 'Legacy card, recommendation letter, or certificate',
    descriptionUr: 'پرانا کارڈ، سفارشی خط یا سرٹیفکیٹ'
  }
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ application, onClose }) => {
  const { 
    currentUser, 
    attachDocumentToApplication, 
    removeDocumentFromApplication, 
    verifyApplicationDocument,
    language 
  } = useApp();
  const isUr = language === 'ur';

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
      setUploadError(
        isUr
          ? `فائل بہت بڑی ہے (${formatFileSize(file.size)})۔ زیادہ سے زیادہ اجازت 5MB ہے۔`
          : `File is too large (${formatFileSize(file.size)}). Maximum permitted size is 5MB.`
      );
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setUploadError(
        isUr
          ? 'غلط فارمیٹ۔ براہ کرم JPG، PNG، WEBP تصاویر یا PDF دستاویزات اپلوڈ کریں۔'
          : 'Invalid format. Please upload JPG, PNG, WEBP images, or PDF documents.'
      );
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
      setUploadError(isUr ? 'منتخب کردہ فائل پڑھنے میں ناکامی۔ دوبارہ کوشش کریں۔' : 'Failed to read the selected file. Please try again.');
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
      setUploadError(isUr ? 'براہ کرم اپلوڈ کرنے کے لیے کوئی دستاویز منتخب کریں۔' : 'Please select or drop a document to upload.');
      return;
    }
    if (!docName.trim()) {
      setUploadError(isUr ? 'براہ کرم دستاویز کا واضح عنوان درج کریں۔' : 'Please enter a descriptive document title.');
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
        setUploadSuccess(
          isUr
            ? 'معاون دستاویز کامیابی سے درخواست ڈوزیئر کے ساتھ منسلک ہو گئی۔'
            : 'Supporting document attached successfully to application dossier.'
        );
        // Reset form
        setFileDataUrl(null);
        setFileName('');
        setFileSize(0);
        setFileMime('');
        setDocName('');
        setNotes('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadError(result.error || (isUr ? 'دستاویز منسلک کرنے میں ناکامی۔' : 'Failed to attach document.'));
      }
    } catch {
      setUploadError(isUr ? 'اپلوڈ کے دوران غیر متوقع خرابی۔ براہ کرم فائل چیک کریں۔' : 'Unexpected error during upload. Please verify file integrity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFlag = (docId: string) => {
    if (!flagReason.trim()) {
      setFlagError(
        isUr
          ? 'براہ کرم واضح کریں کہ اس دستاویز پر اعتراض کیوں لگایا جا رہا ہے (مثلاً دھندلا اسکین، نام میں فرق)۔'
          : 'Please specify why this document is being flagged (e.g. unreadable scan, name mismatch).'
      );
      return;
    }
    setFlagError(null);
    verifyApplicationDocument(application.id, docId, 'FLAGGED', flagReason.trim());
    setFlaggingDocId(null);
    setFlagReason('');
  };

  const localizeDocStatus = (s?: string) => {
    if (!isUr) return s || 'PENDING';
    if (s === 'VERIFIED') return 'تصدیق شدہ';
    if (s === 'FLAGGED') return 'اعتراض / توجہ طلب';
    return 'زیرِ جائزہ';
  };

  const localizeDocType = (type: string) => {
    const found = DOCUMENT_CATEGORIES.find(c => c.type === type);
    if (found) return isUr ? found.labelUr : found.label;
    return type.replace(/_/g, ' ');
  };

  const docs = application.supportingDocuments || [];
  const verifiedCount = docs.filter(d => d.verificationStatus === 'VERIFIED').length;
  const flaggedCount = docs.filter(d => d.verificationStatus === 'FLAGGED').length;
  const pendingCount = docs.filter(d => !d.verificationStatus || d.verificationStatus === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#090D16]/90 p-3 sm:p-5 overflow-y-auto">
      <div
        className="kc-luxury-modal rounded-2xl w-full max-w-4xl flex flex-col max-h-[92dvh] my-auto overflow-hidden text-slate-100"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-400/20 bg-gradient-to-r from-[#090D16] via-[#131C31] to-[#090D16] text-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#131C31] border border-[#38BDF8]/45 flex items-center justify-center text-[#38BDF8] shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isUr ? 'ڈوزیئر اور معاون دستاویزات' : 'Dossier & Supporting Documents'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#090D16] text-[#F5D061] border border-[#D4AF37]/40">
                  {isUr ? 'محفوظ اسٹوریج' : 'Secure Storage'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isUr ? 'درخواست گزار:' : 'Applicant:'} <strong className="text-[#F5D061] font-semibold">{application.applicantName}</strong> · {isUr ? 'شناختی کارڈ:' : 'CNIC:'} <span className="font-mono text-slate-200 tabular-nums">{application.cnic}</span> · {application.district}, {application.stateProvince}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isUr ? 'بند کریں' : 'Close modal'}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-[#111726] hover:bg-[#161F33] border border-[#D4AF37]/30 transition-colors cursor-pointer kc-pressable"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column Layout on Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl kc-obsidian-card">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{isUr ? 'کل منسلک' : 'Total Attached'}</span>
              <span className="text-xl font-bold text-white mt-0.5 block tabular-nums">{docs.length}</span>
            </div>
            <div className="p-3.5 rounded-xl kc-emerald-panel">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">{isUr ? 'تصدیق شدہ' : 'Verified'}</span>
              <span className="text-xl font-bold text-white mt-0.5 block tabular-nums">{verifiedCount}</span>
            </div>
            <div className="p-3.5 rounded-xl kc-obsidian-card">
              <span className="text-[10px] uppercase font-bold text-[#F5D061] block">{isUr ? 'زیرِ جائزہ' : 'Pending Review'}</span>
              <span className="text-xl font-bold text-[#F5D061] mt-0.5 block tabular-nums">{pendingCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">{isUr ? 'اعتراض / توجہ طلب' : 'Flagged / Action Req.'}</span>
              <span className="text-xl font-bold text-rose-200 mt-0.5 block tabular-nums">{flaggedCount}</span>
            </div>
          </div>

          {/* Section 1: Upload New Supporting Document */}
          <div className="p-5 rounded-2xl kc-obsidian-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#F5D061]" />
                <h3 className="text-sm font-bold text-white">
                  {isUr ? 'نئی معاون دستاویز منسلک کریں' : 'Attach New Supporting Document'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {isUr ? 'زیادہ سے زیادہ 5MB · JPG, PNG, WEBP, PDF' : 'Max 5MB · Allowed: JPG, PNG, WEBP, PDF'}
              </span>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-[#131C31] border border-[#38BDF8]/45 flex items-center gap-2 text-xs text-[#38BDF8]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#38BDF8]" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Category Selector Grid */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  {isUr ? 'دستاویز کی قسم:' : 'Document Classification:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setSelectedType(cat.type)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer kc-pressable ${
                        selectedType === cat.type
                          ? 'bg-[#131C31] border-[#38BDF8] text-[#F8FAFC] shadow-[0_4px_14px_rgba(56,189,248,0.18)]'
                          : 'bg-[#090D16] border-slate-400/20 text-slate-300 hover:border-[#38BDF8]/50 hover:text-white'
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5">{cat.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{isUr ? cat.labelUr : cat.label}</span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {isUr ? cat.descriptionUr : cat.description}
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
                    ? 'border-[#38BDF8]/60 bg-[#131C31]/70'
                    : 'border-slate-400/25 hover:border-[#38BDF8] bg-[#090D16]'
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
                          className="h-28 max-w-full rounded-lg object-contain shadow-xs border border-[#D4AF37]/35" 
                        />
                        <span className="absolute bottom-1 right-1 bg-[#090D16]/85 text-[#F5D061] text-[9px] px-1.5 py-0.5 rounded border border-[#D4AF37]/30">
                          {isUr ? 'پیش نظارہ' : 'Preview'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-rose-950/70 border border-rose-500/40 flex flex-col items-center justify-center text-rose-300">
                        <FileText className="w-8 h-8" />
                        <span className="text-[10px] font-bold uppercase mt-0.5">PDF</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs font-bold text-white truncate max-w-sm">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        {formatFileSize(fileSize)} · {isUr ? 'فائل تبدیل کرنے کے لیے کلک کریں' : 'Click to change file'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-2">
                    <div className="w-10 h-10 rounded-full bg-[#131C31] border border-[#38BDF8]/40 text-[#38BDF8] mx-auto flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      {isUr
                        ? <>دستاویز یہاں کھینچ کر لائیں یا <span className="text-[#F5D061] underline font-bold">منتخب کریں</span></>
                        : <>Drag & drop document here, or <span className="text-[#F5D061] underline font-bold">browse</span></>}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isUr
                        ? 'اعلیٰ معیار کے اسکین، رسیدوں کی تصاویر یا نادرا شناختی کارڈ کی حمایت کرتا ہے'
                        : 'Supports high-resolution scans, photos of receipts or NADRA CNIC cards'}
                    </p>
                  </div>
                )}
              </div>

              {/* Title & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'دستاویز کا عنوان *' : 'Document Title *'}
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder={isUr ? 'مثلاً شناختی کارڈ کا سامنے والا اسکین' : 'e.g., CNIC Smart Card Front Scan'}
                    className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    {isUr ? 'اندرونی تصدیقی ریمارکس (اختیاری)' : 'Internal Verification Remarks (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isUr ? 'مثلاً ضلعی ایڈمن کی جانب سے جسمانی تصدیق شدہ' : 'e.g., Verified by District Admin physically'}
                    className="w-full text-xs px-3 py-2 rounded-xl kc-luxury-input"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!fileDataUrl || isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl kc-gold-button font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (isUr ? 'دستاویز منسلک ہو رہی ہے...' : 'Attaching Document...')
                      : (isUr ? 'ڈوزیئر میں دستاویز منسلک کریں' : 'Attach Document to Dossier')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Attached Documents Gallery & Audit Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="tabular-nums">
                  {isUr ? `موجودہ ڈوزیئر ریکارڈز (${docs.length})` : `Existing Dossier Records (${docs.length})`}
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                {isUr ? 'مجاز افسران معاون فائلوں کی تصدیق یا نشان دہی کر سکتے ہیں' : 'Authorized officers may verify or flag supporting files'}
              </span>
            </div>

            {docs.length === 0 ? (
              <div className="p-8 text-center bg-[#090D16] rounded-xl border border-dashed border-[#D4AF37]/30 text-xs text-slate-400">
                {isUr
                  ? 'ابھی تک کوئی معاون دستاویز منسلک نہیں۔ اوپر سے رسیدیں یا شناختی اسکین اپلوڈ کریں۔'
                  : 'No supporting documents attached yet. Upload receipts or identification scans above.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {docs.map(doc => {
                  const isImage = doc.fileMime.startsWith('image/') || doc.fileUrl.startsWith('data:image/');

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl kc-obsidian-card flex flex-col justify-between space-y-3 hover:border-[#F5D061]/60 transition-all"
                    >
                      <div className="space-y-2">
                        {/* Top row: Type badge & Verification Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#090D16] border border-[#D4AF37]/25 text-slate-300 uppercase tracking-wider">
                            {localizeDocType(doc.type)}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-[#131C31] text-[#38BDF8] border border-[#38BDF8]/45'
                              : doc.verificationStatus === 'FLAGGED'
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-500/45'
                              : 'bg-[#090D16] text-[#F5D061] border border-[#D4AF37]/40'
                          }`}>
                            {doc.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : doc.verificationStatus === 'FLAGGED' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{localizeDocStatus(doc.verificationStatus)}</span>
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
                            className="w-14 h-14 rounded-lg border border-[#D4AF37]/30 overflow-hidden bg-[#090D16] shrink-0 cursor-pointer group relative flex items-center justify-center hover:opacity-90"
                          >
                            {isImage ? (
                              <img src={doc.fileUrl} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-7 h-7 text-rose-400" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate" title={doc.name}>
                              {doc.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                              {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isUr ? 'اپلوڈ از:' : 'Uploaded by:'} <span className="font-semibold text-slate-200">{doc.uploadedByName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Notes or Verification Remarks */}
                        {doc.notes && (
                          <p className="text-[11px] text-slate-300 bg-[#090D16] p-2.5 rounded-lg border border-[#D4AF37]/20 italic">
                            "{doc.notes}"
                          </p>
                        )}

                        {doc.verificationNotes && (
                          <div className="text-[10px] p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200">
                            <strong>{isUr ? `جائزہ کار کا نوٹ (${doc.verifiedBy}):` : `Reviewer Note (${doc.verifiedBy}):`}</strong> {doc.verificationNotes}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                        {/* Preview and Download */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingDoc(doc);
                              setZoomLevel(1);
                              setRotation(0);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-200 bg-[#090D16] hover:bg-[#161F33] border border-[#D4AF37]/25 rounded-lg transition-colors cursor-pointer kc-pressable"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#F5D061]" />
                            <span>{isUr ? 'معائنہ' : 'Inspect'}</span>
                          </button>

                          <a
                            href={doc.fileUrl}
                            download={doc.name || 'kifayat-connect-doc'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-300 hover:text-[#F5D061] rounded-lg hover:bg-[#161F33] transition-colors"
                            title={isUr ? 'دستاویز ڈاؤن لوڈ کریں' : 'Download document'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {(isSuperAdmin || doc.uploadedBy === currentUser.id) && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDoc(doc)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title={isUr ? 'فائل حذف کریں' : 'Delete file'}
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
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#38BDF8] bg-[#131C31] hover:bg-[#1E293B] border border-[#38BDF8]/45 rounded-lg transition-colors cursor-pointer kc-pressable"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isUr ? 'تصدیق کریں' : 'Verify'}</span>
                              </button>
                            )}

                            {doc.verificationStatus !== 'FLAGGED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingDocId(doc.id);
                                  setFlagReason('');
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 rounded-lg border border-rose-500/40 transition-colors cursor-pointer kc-pressable"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isUr ? 'اعتراض' : 'Flag'}</span>
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
        <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#090D16] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {isUr ? 'تمام اپلوڈ کردہ ریکارڈز وقت اور صارف آئی ڈی کے ساتھ آڈٹ کیے جاتے ہیں۔' : 'All uploaded records are audited with timestamp and user ID.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 font-semibold text-slate-200 bg-[#111726] hover:bg-[#161F33] border border-[#D4AF37]/30 rounded-xl transition-colors cursor-pointer kc-pressable"
          >
            {isUr ? 'ڈوزیئر بند کریں' : 'Close Dossier'}
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: FLAGGING PROMPT */}
      {flaggingDocId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#090D16]/85 p-4">
          <div className="kc-luxury-modal rounded-2xl max-w-sm w-full p-5 space-y-3 text-slate-100">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{isUr ? 'معاون دستاویز پر اعتراض لگائیں' : 'Flag Supporting Document'}</span>
            </h4>
            <p className="text-xs text-slate-300">
              {isUr
                ? 'درخواست گزار یا جائزہ کمیٹی کے لیے واضح وجہ بیان کریں (مثلاً دھندلی تصویر، زائد المیعاد شناختی کارڈ)۔'
                : 'Provide a clear reason for the applicant or review committee (e.g., blurry image, expired CNIC, incorrect receipt amount).'}
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => {
                setFlagReason(e.target.value);
                if (flagError) setFlagError(null);
              }}
              placeholder={isUr ? 'اعتراض کی وجہ درج کریں...' : 'Enter reason for flagging...'}
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl kc-luxury-input"
            />
            {flagError && (
              <p className="text-[11px] text-rose-300 font-medium">{flagError}</p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFlaggingDocId(null);
                  setFlagError(null);
                }}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/25 rounded-lg cursor-pointer kc-pressable"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmFlag(flaggingDocId)}
                className="px-4 py-1.5 text-xs font-bold text-rose-100 bg-rose-700 hover:bg-rose-600 border border-rose-500/50 rounded-lg cursor-pointer kc-pressable"
              >
                {isUr ? 'اعتراض کی تصدیق کریں' : 'Confirm Flag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 1B: DELETE CONFIRMATION (Replaces window.confirm) */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#090D16]/85 p-4">
          <div className="kc-luxury-modal rounded-2xl max-w-sm w-full p-5 space-y-3 text-slate-100">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>{isUr ? 'معاون فائل ہٹائیں؟' : 'Remove Supporting File?'}</span>
            </h4>
            <p className="text-xs text-slate-300">
              {isUr
                ? <>اس درخواست کے ڈوزیئر سے <strong className="text-white">"{confirmDeleteDoc.name}"</strong> کو ہٹائیں؟ یہ عمل آڈٹ لاگ میں ریکارڈ کیا جائے گا۔</>
                : <>Remove <strong className="text-white">"{confirmDeleteDoc.name}"</strong> from this application dossier? This action is recorded in the audit log.</>}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#090D16] border border-[#D4AF37]/25 rounded-lg cursor-pointer kc-pressable"
              >
                {isUr ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeDocumentFromApplication(application.id, confirmDeleteDoc.id);
                  setConfirmDeleteDoc(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-rose-100 bg-rose-700 hover:bg-rose-600 border border-rose-500/50 rounded-lg cursor-pointer kc-pressable"
              >
                {isUr ? 'فائل ہٹائیں' : 'Remove File'}
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
                {localizeDocType(viewingDoc.type)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                aria-label={isUr ? 'بڑا کریں' : 'Zoom in'}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title={isUr ? 'بڑا کریں' : 'Zoom in'}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                aria-label={isUr ? 'چھوٹا کریں' : 'Zoom out'}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title={isUr ? 'چھوٹا کریں' : 'Zoom out'}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                aria-label={isUr ? 'گھمائیں' : 'Rotate'}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title={isUr ? '90 ڈگری گھمائیں' : 'Rotate 90 degrees'}
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <a
                href={viewingDoc.fileUrl}
                download={viewingDoc.name}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white ml-2"
                title={isUr ? 'فائل ڈاؤن لوڈ کریں' : 'Download file'}
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                aria-label={isUr ? 'ناظر بند کریں' : 'Close viewer'}
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
