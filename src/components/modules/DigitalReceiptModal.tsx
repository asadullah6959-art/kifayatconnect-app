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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 my-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Verified Financial Voucher
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-500">{receipt.receiptNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT BODY */}
        <div className="receipt-print-area mt-4 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {/* Official Seal Watermark */}
          <div 
            className="absolute right-6 bottom-8 w-44 h-44 opacity-15 pointer-events-none rounded-full bg-cover"
            style={{ backgroundImage: `url('/src/assets/images/receipt_watermark_seal_1794225904149.jpg')` }}
          />

          {/* Top Logo and Organization Title */}
          <div className="flex items-start justify-between border-b border-slate-300 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <BrandEmblem3D size="md" className="shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Kifayat Connect Welfare Organization
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Central Treasury & Audited Welfare Accounts · Govt Registered Trust
                </p>
                <p className="text-[10px] text-slate-400">
                  National Tax Number (NTN): 8492019-3 · Sector F-7 Secretariat, Islamabad
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Official E-Receipt
              </span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                {receipt.receiptNumber}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                Date: {receipt.date}
              </span>
            </div>
          </div>

          {/* Verification Status Banner */}
          <div className="my-4 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment Verified & Credited to Welfare Fund</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              STATUS: {receipt.status}
            </span>
          </div>

          {/* Member & Payment Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs py-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                Received From (Member):
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                {receipt.userName}
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                Member ID: {receipt.userMembershipId}
              </p>
              <div className="mt-1 space-y-0.5">
                <p className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                  District: {receipt.district || payer?.district || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).district : 'Islamabad')}
                </p>
                <p className="text-slate-500 text-[10px]">
                  Province: {receipt.stateProvince || payer?.stateProvince || (receipt.userRegion ? mapLegacyRegionToHierarchy(receipt.userRegion).stateProvince : 'Islamabad Capital Territory')}
                </p>
                {(receipt.tehsil || payer?.tehsil || receipt.unionCouncil || payer?.unionCouncil) && (
                  <p className="text-slate-400 text-[10px]">
                    Tehsil: {receipt.tehsil || payer?.tehsil || 'General'} · UC: {receipt.unionCouncil || payer?.unionCouncil || 'UC-01'}
                  </p>
                )}
              </div>
              {payer?.cnic && (
                <p className="text-slate-500 font-mono text-[10px] mt-1">
                  CNIC: {payer.cnic}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium block">
                Transaction Details:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {receipt.paymentMethod}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                Ref: {receipt.referenceNumber}
              </p>
              <p className="text-slate-500 text-[11px]">
                Fund: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{receipt.fundCategory}</span>
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="my-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Total Amount Contributed
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-0.5">
                "{getAmountInWords(receipt.amount)}"
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                PKR {receipt.amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                0% Transaction Deduction
              </span>
            </div>
          </div>

          {receipt.proofNote && (
            <div className="text-[11px] text-slate-500 mb-4 bg-slate-100 dark:bg-slate-900/40 p-2 rounded">
              <span className="font-medium text-slate-700 dark:text-slate-300">Payer Remarks:</span> {receipt.proofNote}
            </div>
          )}

          {/* Officer Verification Signatures & Stamp */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <img 
                src="/src/assets/images/receipt_watermark_seal_1794225904149.jpg" 
                alt="Stamp" 
                className="w-14 h-14 rounded-full object-cover border border-emerald-600 shadow-xs"
              />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Authorized Verification:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {receipt.verifiedBy || 'Treasury Officer / Verified'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : 'System Logged'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>E-SEAL: KC-AUTH-{receipt.id.toUpperCase()}</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Computer-generated legal receipt. Does not require physical signature.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-500 text-center mt-4 no-print">
          {language === 'ur' 
            ? 'یہ رسید کفایت کنیکٹ کے مرکزی فنانس لیجر میں ریکارڈ ہو چکی ہے۔'
            : 'This receipt is permanently audited in Kifayat Connect Central Financial Ledger.'}
        </p>
      </div>
    </div>
  );
};
