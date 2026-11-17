import React, { useRef, useState } from 'react';
import { X, Printer, Languages, ShieldCheck } from 'lucide-react';
import {
  RaseedWasooliDocument,
  type RaseedWasooliData,
} from './RaseedWasooliDocument';
import { printElement } from './printDocument';
import type { DocLanguage } from './RukniyatFormDocument';

interface Props {
  isOpen: boolean;
  data: RaseedWasooliData | null;
  onClose: () => void;
  defaultLanguage?: DocLanguage;
}

/**
 * On-screen viewer for the official Raseed Wasooli with a language toggle and a
 * high-resolution print / Save-as-PDF action. The document itself never changes
 * appearance — only the wrapper is app UI.
 */
export const RaseedWasooliModal: React.FC<Props> = ({
  isOpen,
  data,
  onClose,
  defaultLanguage = 'ur',
}) => {
  const [lang, setLang] = useState<DocLanguage>(defaultLanguage);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;
  const isUr = lang === 'ur';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto">
      <div className="kc-luxury-modal rounded-2xl max-w-3xl w-full p-3 sm:p-5 space-y-3 my-auto max-h-[94dvh] overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D4AF37]/25">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F5D061]" />
              {isUr ? 'رسید وصولی' : 'Raseed Wasooli'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isUr
                ? `رسید نمبر ${data.serialNumber} — یہی نمبر رکنیت فارم پر بھی درج ہے۔`
                : `Receipt No. ${data.serialNumber} — the same number printed on the Rukniyat Form.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-[#F5D061]" />
              <span>{isUr ? 'English' : 'اردو'}</span>
            </button>
            <button
              type="button"
              onClick={() => printElement(printRef.current)}
              className="kc-pressable flex items-center gap-1.5 px-3 py-2 bg-[#141B2D] hover:bg-[#1A233A] text-slate-200 border border-[#D4AF37]/40 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#F5D061]" />
              <span>{isUr ? 'پرنٹ / PDF' : 'Print / PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="kc-pressable p-2 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-[#D4AF37]/40 text-slate-300 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={printRef}>
          <RaseedWasooliDocument data={data} language={lang} />
        </div>
      </div>
    </div>
  );
};

export default RaseedWasooliModal;
