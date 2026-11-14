import React from 'react';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useApp, isFounderUser } from '../../context/AppContext';
import { User } from '../../types';

export function needsProfileCompletion(user?: User | null): boolean {
  if (!user) return false;
  if (isFounderUser(user)) return false;
  return user.profileCompleted === false;
}

interface ProfileCompletionGateProps {
  compact?: boolean;
  featureName?: string;
}

export const ProfileCompletionGate: React.FC<ProfileCompletionGateProps> = ({
  compact = false,
  featureName
}) => {
  const { openCompleteProfileModal, language } = useApp();

  const title =
    language === 'ur'
      ? 'ممبر پروفائل مکمل کریں'
      : 'Complete Your Member Profile';

  const description =
    language === 'ur'
      ? 'مکمل کمیونٹی فیچرز (چیٹ، ادائیگیاں، شکایات) استعمال کرنے کے لیے پہلے اپنا ممبر پروفائل مکمل کریں۔'
      : featureName
      ? `Please complete your Member Profile first to unlock ${featureName} and full community features.`
      : 'Please complete your Member Profile first to unlock full community features.';

  const ctaLabel =
    language === 'ur'
      ? 'ابھی پروفائل مکمل کریں'
      : 'Complete Profile Now';

  if (compact) {
    return (
      <div className="p-3 sm:p-4 rounded-xl bg-[#111622] border border-[#D4AF37]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#043927] border border-[#D4AF37]/45 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-[#F5D061]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#F5D061] truncate">{title}</p>
            <p className="text-[11px] text-slate-300 leading-snug">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCompleteProfileModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl kc-gold-button text-xs font-extrabold shrink-0 cursor-pointer"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#111622] via-[#131B29] to-[#0A0D12] border border-[#D4AF37]/45 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-[#043927] border border-[#D4AF37]/50 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-[#F5D061]" />
        </div>
        <div className="min-w-0 space-y-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-[#D4AF37]/40 text-[#F5D061] text-[10px] font-extrabold uppercase tracking-wider">
            Profile Pending
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-white">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={openCompleteProfileModal}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl kc-gold-button text-xs font-extrabold shrink-0 cursor-pointer"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
