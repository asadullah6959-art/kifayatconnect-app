import React from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentTransaction } from '../../types';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { mapLegacyRegionToHierarchy } from '../../data/locationData';
import { BrandEmblem3D } from '../common/BrandEmblem3D';

interface DigitalReceiptModalProps {
  receipt: PaymentTransaction;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, onClose }) => {
  const { language, users } = useApp();
  const payer = users.find(u => u.id === receipt.userId);

  const handlePrint = () => {
    window.print();
  };

  // Verbal representation for common amounts
  const getAmountInWords = (amount: number) => {
    if (amount === 1500) return 'One Thousand Five Hundred Rupees Only';
    if (amount === 2500) return 'Two Thousand Five Hundred Rupees Only';
    if (amount === 3000) return 'Three Thousand Rupees Only';
    if (amount === 4000) return 'Four Thousand Rupees Only';
    if (amount === 5000) return 'Five Thousand Rupees Only';
    if (amount === 10000) return 'Ten Thousand Rupees Only';
    if (amount === 20000) return 'Twenty Thousand Rupees Only';
    if (amount === 50000) return 'Fifty Thousand Rupees Only';
    return `${amount.toLocaleString()} Pakistan Rupees Only`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 overflow-y-auto">
      <div className="kc-luxury-modal relative w-full max-w-xl rounded-2xl p-4 sm:p-8 my-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/25 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#F5D061] uppercase tracking-wider">
              Verified Financial Voucher
            </span>
            <span className="text-[#D4AF37]/50">·</span>
            <span className="text-xs font-mono text-slate-300">{receipt.receiptNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="kc-pressable kc-gold-button flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="kc-pressable p-1.5 rounded-lg text-slate-300 hover:text-[#F5D061] hover:bg-[#161F33] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div className="receipt-print-area mt-4 bg-[#090D16] print:bg-white p-5 sm:p-6 rounded-xl border border-[#D4AF37]/35 shadow-[inset_0_1px_0_rgba(252,227,138,0.08)] relative overflow-hidden">
          {/* Official Seal Watermark */}
          <div 
            className="absolute right-6 bottom-8 w-44 h-44 opacity-15 pointer-events-none rounded-full bg-cover"
            style={{ backgroundImage: `url('/src/assets/images/receipt_watermark_seal_1794225904149.jpg')` }}
          />

          {/* Top Logo and Organization Title */}
          <div className="flex items-start justify-between border-b border-[#D4AF37]/25 pb-4">
            <div className="flex items-center gap-3">
              <BrandEmblem3D size="md" className="shrink-0" />
              <div>
                <h2 className="text-base font-bold text-white print:text-slate-900 uppercase tracking-tight">
                  Kifayat Connect Welfare Organization
                </h2>
                <p className="text-xs text-slate-300 print:text-slate-600">
                  Central Treasury & Audited Welfare Accounts · Govt Registered Trust
                </p>
                <p className="text-[10px] text-slate-400">
                  National Tax Number (NTN): 8492019-3 · Sector F-7 Secretariat, Islamabad
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                Official E-Receipt
              </span>
              <span className="text-sm font-bold font-mono text-[#F5D061] print:text-emerald-700 block">
                {receipt.receiptNumber}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Date: {receipt.date}
              </span>
            </div>
          </div>

          {/* Verification Status Banner */}
          <div className="my-4 py-2.5 px-3 kc-emerald-panel rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-200 print:text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Payment Verified & Credited to Welfare Fund</span>
            </div>
            <span className="font-mono text-[11px] text-[#F5D061] print:text-emerald-700 font-bold">
              STATUS: {receipt.status}
            </span>
          </div>

          {/* Member & Payment Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs py-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                Received From (Member):
              </span>
              <p className="font-bold text-white print:text-slate-900 text-sm mt-0.5">
                {receipt.userName}
              </p>
              <p className="text-[#F5D061] print:text-slate-700 font-mono text-[11px]">
                Member ID: {receipt.userMembershipId}
              </p>
              <div className="mt-1 space-y-0.5">
                <p className="text-slate-200 print:text-slate-700 font-medium text-[11px]">
                  District: {receipt.district || payer?.district || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).district : 'Islamabad')}
                </p>
                <p className="text-slate-400 text-[10px]">
                  Province: {receipt.stateProvince || payer?.stateProvince || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).stateProvince : 'Islamabad Capital Territory')}
                </p>
                {(receipt.tehsil || payer?.tehsil || receipt.unionCouncil || payer?.unionCouncil) && (
                  <p className="text-slate-400 text-[10px]">
                    Tehsil: {receipt.tehsil || payer?.tehsil || 'General'} · UC: {receipt.unionCouncil || payer?.unionCouncil || 'UC-01'}
                  </p>
                )}
              </div>
              {payer?.cnic && (
                <p className="text-slate-400 font-mono text-[10px] mt-1">
                  CNIC: {payer.cnic}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                Transaction Details:
              </span>
              <p className="font-semibold text-white print:text-slate-900 mt-0.5">
                {receipt.paymentMethod}
              </p>
              <p className="text-slate-300 print:text-slate-600 font-mono text-[11px]">
                Ref: {receipt.referenceNumber}
              </p>
              <p className="text-slate-300 text-[11px]">
                Fund: <span className="text-emerald-400 print:text-emerald-700 font-medium">{receipt.fundCategory}</span>
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="my-4 p-4 kc-obsidian-card print:bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Total Amount Contributed
              </span>
              <p className="text-xs text-slate-200 print:text-slate-700 italic mt-0.5">
                "{getAmountInWords(receipt.amount)}"
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#F5D061] print:text-slate-900 font-mono tabular-nums">
                PKR {receipt.amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 print:text-emerald-700 block font-medium">
                0% Transaction Deduction
              </span>
            </div>
          </div>

          {receipt.proofNote && (
            <div className="text-[11px] text-slate-300 mb-4 bg-[#111726] border border-[#D4AF37]/20 p-2.5 rounded-lg">
              <span className="font-medium text-[#F5D061]">Payer Remarks:</span> {receipt.proofNote}
            </div>
          )}

          {/* Officer Verification Signatures & Stamp */}
          <div className="pt-4 border-t border-[#D4AF37]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <img 
                src="/src/assets/images/receipt_watermark_seal_1794225904149.jpg" 
                alt="Stamp" 
                className="w-14 h-14 rounded-full object-cover border border-[#D4AF37]/60 shadow-xs"
              />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Authorized Verification:
                </span>
                <p className="font-semibold text-white print:text-slate-900 text-xs">
                  {receipt.verifiedBy || 'Treasury Officer / Verified'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : 'System Logged'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[10px] text-[#F5D061] print:text-slate-600 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>E-SEAL: KC-AUTH-{receipt.id.toUpperCase()}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Computer-generated legal receipt. Does not require physical signature.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center mt-4 no-print">
          {language === 'ur' 
            ? 'یہ رسید کفایت کنیکٹ کے مرکزی فنانس لیجر میں ریکارڈ ہو چکی ہے۔'
            : 'This receipt is permanently audited in Kifayat Connect Central Financial Ledger.'}
        </p>
      </div>
    </div>
  );
};
