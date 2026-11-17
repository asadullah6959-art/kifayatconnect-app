import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Coins,
  Award,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MemberTutorialModal: React.FC = () => {
  const { isTutorialOpen, closeTutorial, language, openRukniyatForm, setActiveTab } = useApp();
  const [step, setStep] = useState<number>(0);

  if (!isTutorialOpen) return null;

  const isUr = language === 'ur';

  const steps = [
    {
      icon: FileCheck2,
      badgeEn: 'Step 1 of 4 · Rukniyat Form',
      badgeUr: 'مرحلہ ۱ از ۴ · رکنیت فارم',
      titleEn: 'Complete Your Official Rukniyat Form',
      titleUr: 'اپنا آفیشل رکنیت فارم مکمل کریں',
      descEn:
        'Open the bilingual "Rukniyat Form" from your dashboard or menu, enter your mandatory 13-digit CNIC, Tabbar clan, and oath signature to receive your atomic Serial Number.',
      descUr:
        'اپنے ڈیش بورڈ یا مینیو سے دو لسانی "رکنیت فارم" کھولیں، اپنا 13 ہندسوں کا شناختی کارڈ نمبر، ٹبر اور عہد نامہ پر دستخط مکمل کر کے خودکار سیریل نمبر حاصل کریں۔',
      actionLabelEn: 'Open Rukniyat Form',
      actionLabelUr: 'رکنیت فارم کھولیں',
      onAction: () => {
        closeTutorial();
        openRukniyatForm();
      }
    },
    {
      icon: Coins,
      badgeEn: 'Step 2 of 4 · 3-Tier Fund System',
      badgeUr: 'مرحلہ ۲ از ۴ · سہ رخی فنڈ سسٹم',
      titleEn: 'Choose Mahana, Salana, or Hangami Fund',
      titleUr: 'ماہانہ، سالانہ یا ہنگامی فنڈ منتخب کریں',
      descEn:
        'Select Mahana Fund (2–11 months @ Rs. 100/month), Salana Fund (yearly @ Rs. 1,200/year), or ہنگامی فنڈ / Hangami Fund (any custom emergency relief amount). 13-digit CNIC is required.',
      descUr:
        'ماہانہ فنڈ (۲ تا ۱۱ ماہ، ۱۰۰ روپے فی ماہ)، سالانہ فنڈ (۱۲۰۰ روپے فی سال)، یا ہنگامی فنڈ (مرضی کی رقم) منتخب کر کے ادائیگی کا ثبوت جمع کروائیں۔',
      actionLabelEn: 'Go to Funds & Payments',
      actionLabelUr: 'فنڈز سیکشن کھولیں',
      onAction: () => {
        closeTutorial();
        setActiveTab('funds');
      }
    },
    {
      icon: Award,
      badgeEn: 'Step 3 of 4 · Official Raseed & Mohar',
      badgeUr: 'مرحلہ ۳ از ۴ · آفیشل رسید اور مہر',
      titleEn: 'Unlock Verified Mohar Receipt, PDF & Excel',
      titleUr: 'مہر والی آفیشل رسید، PDF اور ایکسل حاصل کریں',
      descEn:
        'Once Founder or Super Admin approves your submission, you get an instant notification unlocking your Circular Gold & Emerald Mohar "رسید وصولی" with 1-click PDF, Excel, and WhatsApp share.',
      descUr:
        'بانی یا سپر ایڈمن کی منظوری ملتے ہی آپ کو فوری نوٹیفکیشن ملے گا جس کے بعد آپ مہر والی آفیشل رسید PDF، ایکسل اور واٹس ایپ پر ڈاؤن لوڈ اور شیئر کر سکیں گے۔',
      actionLabelEn: 'View My Ledger',
      actionLabelUr: 'میرا کھاتہ دیکھیں',
      onAction: () => {
        closeTutorial();
        setActiveTab('funds');
      }
    },
    {
      icon: MessageSquare,
      badgeEn: 'Step 4 of 4 · Live Community & VIP ID',
      badgeUr: 'مرحلہ ۴ از ۴ · کمیونٹی چیٹ اور وی آئی پی کارڈ',
      titleEn: 'Join Live Community Chat & Access VIP ID Card',
      titleUr: 'لائیو کمیونٹی چیٹ اور ڈیجیٹل آئی ڈی کارڈ استعمال کریں',
      descEn:
        'Connect in real time with voice notes & messages inside the Community Room, check official announcements, and inspect your VIP Digital Membership Card anytime.',
      descUr:
        'کمیونٹی چیٹ روم میں وائس نوٹ اور پیغامات کے ذریعے رابطہ رکھیں، اعلانات دیکھیں، اور کسی بھی وقت اپنا ڈیجیٹل ممبرشپ کارڈ حاصل کریں۔',
      actionLabelEn: 'Open Community Chat',
      actionLabelUr: 'کمیونٹی چیٹ کھولیں',
      onAction: () => {
        closeTutorial();
        setActiveTab('chat');
      }
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#0F1B2E] via-[#0B1220] to-[#070D14] border-2 border-[#D4AF37]/55 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
        dir={isUr ? 'rtl' : 'ltr'}
      >
        {/* Top Bar with Prominent 1-Click Skip */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0A1320] border-b border-[#D4AF37]/25">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>{isUr ? 'کفایت کنیکٹ ممبر گائیڈ' : 'Kifayat Connect Member Guide'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeTutorial}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold hover:bg-amber-500/30 transition"
            >
              {isUr ? 'چھپائیں / Skip' : 'Skip / چھپائیں'}
            </button>
            <button
              type="button"
              onClick={closeTutorial}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Close Tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-emerald-500/20 border border-[#D4AF37]/55 flex items-center justify-center shadow-lg">
            <Icon className="w-8 h-8 text-[#FDE047]" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-[11px] font-bold">
              {isUr ? current.badgeUr : current.badgeEn}
            </span>
            <h3 className="text-xl font-black text-white">
              {isUr ? current.titleUr : current.titleEn}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isUr ? current.descUr : current.descEn}
            </p>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-2" dir="ltr">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-7 bg-[#FDE047]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Quick Jump Button */}
          <div>
            <button
              type="button"
              onClick={current.onAction}
              className="px-4 py-2 rounded-xl bg-[#131C31] border border-[#D4AF37]/40 text-amber-200 text-xs font-bold hover:border-[#FDE047] transition"
            >
              {isUr ? current.actionLabelUr : current.actionLabelEn}
            </button>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#0A1320] border-t border-slate-800" dir="ltr">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-40 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            {isUr ? 'پیچھے' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeTutorial}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-200 transition"
            >
              {isUr ? 'چھپائیں' : 'Skip'}
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#070D14] text-xs font-black shadow-md"
              >
                {isUr ? 'اگلا' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={closeTutorial}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isUr ? 'شروع کریں' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
