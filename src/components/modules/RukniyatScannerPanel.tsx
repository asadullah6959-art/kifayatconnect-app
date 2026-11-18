import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2, CheckCircle2, Info, Sparkles, ShieldCheck } from 'lucide-react';
import {
  MAX_UPLOAD_BYTES,
  ScannerConfigError,
  scanFormPhoto,
  type ScanDetected,
} from '../../utils/aiFormScanner';
import type { RukniyatFormValues } from '../documents/RukniyatFormDocument';

/**
 * AI Camera & Photo Form Scanner panel for the رکنیت فارم screen.
 *
 * Every photo — a dim phone snap or a 4K 50 MB gallery export — is downscaled and
 * brightened on a canvas before it is read, and the recognised values are written
 * straight into the form below. Fields stay fully editable afterwards.
 */

interface PhotoItem {
  id: string;
  url: string;
  name: string;
}

interface Props {
  isUr: boolean;
  disabled?: boolean;
  onApply: (patch: Partial<RukniyatFormValues>, detected: ScanDetected) => void;
  totalAmount?: number;
}

const makeId = () => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const RukniyatScannerPanel: React.FC<Props> = ({ isUr, disabled, onApply, totalAmount }) => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'enhance' | 'read' | 'retry' | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detected, setDetected] = useState<ScanDetected | null>(null);

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBanner(null);
    setNotice(null);
    setBusy(true);

    let filledTotal = 0;
    let lastDetected: ScanDetected | null = null;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setNotice(isUr ? 'براہِ کرم تصویر منتخب کریں۔' : 'Please choose an image file.');
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setNotice(
          isUr
            ? 'یہ تصویر 50 MB سے بڑی ہے — اسے گیلری میں چھوٹا کر کے دوبارہ منتخب کریں۔'
            : 'That photo is larger than 50 MB — pick a smaller copy and it will scan normally.'
        );
        continue;
      }

      const id = makeId();
      try {
        const result = await scanFormPhoto(file, {
          onEnhanced: url => setPhotos(prev => [...prev, { id, url, name: file.name }]),
          onStage: value => setStage(value),
        });

        setPhotos(prev => prev.map(photo => (photo.id === id ? { ...photo, url: result.enhanced.dataUrl } : photo)));

        if (result.filledCount > 0) {
          onApply(result.patch, result.detected);
          filledTotal += result.filledCount;
          lastDetected = result.detected;
        } else {
          setNotice(
            isUr
              ? 'تصویر بہتر کر دی گئی ہے مگر اس میں لکھائی واضح نہیں تھی — آپ نیچے خود بھر سکتے ہیں یا دوبارہ تصویر لیں۔'
              : 'Photo enhanced and kept, but the writing on it could not be read — fill the fields below or take another shot.'
          );
        }
      } catch (error) {
        const message = (error as Error)?.message;
        if (error instanceof ScannerConfigError) {
          setNotice(
            isUr
              ? 'اے آئی اسکینر کے لیے Gemini کلید درکار ہے — Settings → Environment variables میں GEMINI_API_KEY شامل کریں۔'
              : 'The AI scanner needs its Gemini key — add GEMINI_API_KEY in Settings → Environment variables.'
          );
        } else if (message === 'TOO_LARGE') {
          setNotice(
            isUr
              ? 'یہ تصویر 50 MB سے بڑی ہے — اسے چھوٹا کر کے دوبارہ منتخب کریں۔'
              : 'That photo is larger than 50 MB — pick a smaller copy and it will scan normally.'
          );
        } else {
          setNotice(
            isUr
              ? 'اسکینر ابھی جواب نہیں دے سکا۔ تصویر محفوظ ہے — دوبارہ کوشش کریں۔'
              : 'The scanner did not answer just now. Your photo is kept — please try again.'
          );
        }
      }
    }

    setBusy(false);
    setStage(null);
    if (filledTotal > 0) {
      setDetected(lastDetected);
      setBanner(
        isUr
          ? `✅ Gemini 3.8 وژن نے تصویر اسکین کی اور تمام فیلڈز خودکار بھر دیں! (${filledTotal} فیلڈز)`
          : '✅ Scanned with Gemini 3.8 Vision & auto-filled all fields!'
      );
    }
  };

  const amountMismatch =
    detected?.amount && totalAmount && Number(detected.amount) > 0 && Number(detected.amount) !== totalAmount
      ? detected.amount
      : null;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1220]/80 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#F5D061] uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" />
        {isUr ? 'اے آئی کیمرہ و تصویری اسکینر' : 'AI Camera & Photo Scanner'}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {isUr
          ? 'کاغذی رکنیت فارم کی تصویر لیں یا گیلری سے منتخب کریں — تصویر خودکار بہتر ہو کر نیچے فارم میں بھر دی جائے گی۔ ہر فیلڈ ترمیم کے قابل رہے گی۔'
          : 'Photograph the paper Rukniyat form or pick it from the gallery — the photo is enhanced automatically and the fields below are filled in. Everything stays editable.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => cameraRef.current?.click()}
          className="kc-pressable flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/60 text-[#F5D061] text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>📷 {isUr ? 'تصویر لیں' : 'Take Photo'}</span>
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => galleryRef.current?.click()}
          className="kc-pressable flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141B2D] border border-[#D4AF37]/40 text-slate-200 text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>🖼️ {isUr ? 'گیلری سے منتخب کریں' : 'Choose from Gallery'}</span>
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={event => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={event => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {busy ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#141B2D] px-3 py-2 text-[11px] text-slate-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F5D061]" />
          <span>
            {stage === 'enhance'
              ? isUr
                ? 'تصویر بہتر کی جا رہی ہے…'
                : 'Enhancing the photo…'
              : stage === 'retry'
              ? isUr
                ? 'دوبارہ کوشش — زیادہ وضاحت کے ساتھ…'
                : 'Trying again with stronger enhancement…'
              : isUr
              ? 'فیلڈز پڑھے جا رہے ہیں…'
              : 'Reading the fields…'}
          </span>
        </div>
      ) : null}

      {banner ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{banner}</span>
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-[#141B2D]">
              <img src={photo.url} alt={photo.name} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label={isUr ? 'تصویر ہٹائیں' : 'Remove photo'}
                title={isUr ? 'تصویر ہٹائیں' : 'Remove photo'}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold leading-none cursor-pointer shadow-lg"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {detected && (detected.serialNo || detected.amount || detected.clanMatched || detected.districtMatched) ? (
        <div className="space-y-1.5 rounded-xl border border-[#D4AF37]/25 bg-[#0B1220]/70 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#F5D061]">
            {isUr ? 'تصویر سے پڑھا گیا' : 'Read from the photo'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detected.serialNo ? (
              <span className="px-2 py-0.5 rounded-lg bg-[#141B2D] border border-[#D4AF37]/30 text-[10px] text-slate-200">
                {isUr ? 'رکنیت / رسید نمبر' : 'Membership / Receipt No.'}: <span className="font-mono">{detected.serialNo}</span>
              </span>
            ) : null}
            {detected.amount ? (
              <span className="px-2 py-0.5 rounded-lg bg-[#141B2D] border border-[#D4AF37]/30 text-[10px] text-slate-200">
                {isUr ? 'مبلغ' : 'Amount'}: <span className="font-mono">PKR {detected.amount}</span>
              </span>
            ) : null}
            {detected.clanMatched ? (
              <span className="px-2 py-0.5 rounded-lg bg-[#141B2D] border border-[#D4AF37]/30 text-[10px] text-slate-200">
                {isUr ? 'خاندان' : 'Clan'}: {detected.clanMatched}
              </span>
            ) : null}
            {detected.districtMatched ? (
              <span className="px-2 py-0.5 rounded-lg bg-[#141B2D] border border-[#D4AF37]/30 text-[10px] text-slate-200">
                {isUr ? 'یونٹ / ضلع' : 'Unit / District'}: {detected.districtMatched}
              </span>
            ) : null}
          </div>
          <p className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-relaxed">
            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-[#D4AF37]" />
            {isUr
              ? 'کاغذ پر لکھا نمبر صرف حوالے کے لیے ہے — سرکاری رکنیت نمبر نظام جمع کرانے پر خود جاری کرتا ہے، اور رقم فارم میں منتخب فنڈ سے شمار ہوتی ہے۔'
              : 'The number printed on the paper is for reference only — the official membership number is issued by the system on submission, and the payable amount comes from the selected fund.'}
          </p>
          {amountMismatch ? (
            <p className="text-[10px] text-amber-300 leading-relaxed">
              {isUr
                ? `تصویر پر مبلغ PKR ${amountMismatch} لکھا ہے جبکہ منتخب فنڈ PKR ${totalAmount} ہے — براہِ کرم تصدیق کر لیں۔`
                : `The photo shows PKR ${amountMismatch} while the selected fund totals PKR ${totalAmount} — please confirm.`}
            </p>
          ) : null}
        </div>
      ) : null}

      {photos.length > 0 && !busy ? (
        <button
          type="button"
          onClick={() => {
            setPhotos([]);
            setBanner(null);
            setNotice(null);
            setDetected(null);
          }}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <X className="w-3 h-3" />
          {isUr ? 'تمام تصاویر ہٹائیں' : 'Remove all photos'}
        </button>
      ) : null}
    </div>
  );
};

export default RukniyatScannerPanel;
