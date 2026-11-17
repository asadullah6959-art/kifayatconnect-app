import React from 'react';
import './documents.css';
import { SqiEmblem } from './SqiEmblem';
import type { DocLanguage } from './RukniyatFormDocument';
import { rupeesInWordsEn, rupeesInWordsUr } from '../../utils/amountWords';

/**
 * Raseed Wasooli (رسید وصولی) — official payment receipt of Sui Khel Qaumi Ittehad.
 *
 * The receipt carries the SAME serial number as the approved Rukniyat Form
 * (رسید نمبر = رکنیت نمبر). The received amount is a separate field and is never
 * derived from the serial: 4200/4201 are identifiers, not currency.
 *
 * Receipts are permanent. Only the Founder / Super Admin may void one, and a
 * voided receipt is shown struck through with a VOID mark — never deleted.
 */

export interface RaseedWasooliData {
  serialNumber: string;
  date: string;
  unit: string;
  memberName: string;
  fatherName?: string;
  cnic?: string;
  /** Amount actually received, in PKR. Always separate from the serial. */
  amount: number;
  purposeEn: string;
  purposeUr: string;
  periodLabelEn?: string;
  periodLabelUr?: string;
  fundAmount?: number;
  printingFee?: number;
  memberType?: 'NEW' | 'OLD_BY_HAND';
  paymentMethod?: string;
  referenceNumber?: string;
  issuedBy?: string;
  collectorName?: string;
  financeSecretaryName?: string;
  isVoid?: boolean;
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
}

const LABELS = {
  ur: {
    title: 'رسید وصولی',
    titleEn: 'OFFICIAL PAYMENT RECEIPT',
    serial: 'رسید نمبر',
    date: 'تاریخ',
    unit: 'یونٹ',
    name: 'نام رکن',
    father: 'ولد',
    cnic: 'شناختی کارڈ نمبر',
    purpose: 'تفصیل',
    amount: 'رقم',
    amountWords: 'رقم بالفاظ',
    fund: 'فنڈ',
    fee: 'فارم پرنٹنگ فیس',
    method: 'ادائیگی کا طریقہ',
    reference: 'حوالہ نمبر',
    body: 'مذکورہ رقم سوئی خیل قومی اتحاد کے رکنیت فنڈ میں بطور وصول موصول ہوئی۔ یہ رسید بطور ثبوت محفوظ رکھی جائے۔',
    finance: 'ناظم مالیات',
    financeEn: 'Finance Secretary',
    collector: 'وصولی کنندہ',
    collectorEn: 'Received By',
    stamp: 'مہر سوئی خیل قومی اتحاد',
    verified: 'تصدیق شدہ',
    newMember: 'نیا رکن',
    oldMember: 'پرانہ رکن (فارم بذریعہ ہاتھ جمع)',
    void: 'منسوخ',
  },
  en: {
    title: 'Payment Receipt',
    titleEn: 'RASEED WASOOLI',
    serial: 'Receipt No.',
    date: 'Date',
    unit: 'Unit',
    name: 'Member Name',
    father: "Father's Name",
    cnic: 'CNIC No.',
    purpose: 'Purpose / Details',
    amount: 'Amount',
    amountWords: 'Amount in Words',
    fund: 'Fund',
    fee: 'Form printing fee',
    method: 'Payment Method',
    reference: 'Reference No.',
    body: 'The above amount has been received in the membership fund of Sui Khel Qaumi Ittehad. Please keep this receipt as proof of payment.',
    finance: 'ناظم مالیات',
    financeEn: 'Finance Secretary',
    collector: 'وصولی کنندہ',
    collectorEn: 'Received By',
    stamp: 'SQI Official Seal',
    verified: 'VERIFIED',
    newMember: 'New Member',
    oldMember: 'Old Member (form submitted by hand)',
    void: 'VOID',
  },
} as const;

const Row: React.FC<{ label: string; labelEn?: string; value?: string; voided?: boolean }> = ({
  label,
  labelEn,
  value,
  voided,
}) => (
  <div className={`sqi-row${voided ? ' sqi-receipt-row--voided' : ''}`}>
    <div className="sqi-row__label">
      <span>{label}</span>
      {labelEn ? <span className="sqi-row__en">{labelEn}</span> : null}
    </div>
    <div className="sqi-row__value">{value || '\u00A0'}</div>
  </div>
);

export interface RaseedWasooliDocumentProps {
  data: RaseedWasooliData;
  language?: DocLanguage;
  className?: string;
}

export const RaseedWasooliDocument: React.FC<RaseedWasooliDocumentProps> = ({
  data,
  language = 'ur',
  className = '',
}) => {
  const L = LABELS[language];
  const dir = language === 'ur' ? 'rtl' : 'ltr';
  const amount = Number.isFinite(data.amount) ? Math.round(data.amount) : 0;
  const voided = Boolean(data.isVoid);

  return (
    <div
      className={`sqi-doc sqi-doc--receipt ${className}`}
      dir={dir}
      data-document="raseed-wasooli"
    >
      <div className="sqi-doc__frame">
        {voided ? <div className="sqi-void">{L.void}</div> : null}

        <header className="sqi-head" style={{ gridTemplateColumns: '26mm 1fr 30mm' }}>
          <SqiEmblem />
          <div className="sqi-head__org">
            <div className="sqi-head__org-ur" dir="rtl">
              سوئی خیل قومی اتحاد
            </div>
            <div className="sqi-head__org-en">SUI KHEL QAUMI ITTEHAD</div>
            <div className="sqi-head__motto" dir="rtl">
              وحدت | خدمت | معاونت | مصالحت
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="sqi-serial-badge">{data.serialNumber}</div>
            <div className="sqi-row__en" style={{ marginTop: '1mm' }}>
              {L.serial}
            </div>
          </div>
        </header>

        <div className="sqi-title">
          <div className="sqi-title__ur" dir="rtl">
            {L.title}
          </div>
          <div className="sqi-title__en">{L.titleEn}</div>
        </div>

        <div className="sqi-meta">
          <Row label={L.date} labelEn="Date" value={data.date} voided={voided} />
          <Row label={L.unit} labelEn="Unit" value={data.unit} voided={voided} />
          <Row
            label={L.serial}
            labelEn="Receipt No."
            value={data.serialNumber}
            voided={voided}
          />
        </div>

        <div className="sqi-grid">
          <Row label={L.name} labelEn="Member Name" value={data.memberName} voided={voided} />
          <Row label={L.father} labelEn="Father's Name" value={data.fatherName} voided={voided} />
          <Row label={L.cnic} labelEn="CNIC No." value={data.cnic} voided={voided} />
          <Row
            label={L.method}
            labelEn="Payment Method"
            value={data.paymentMethod}
            voided={voided}
          />
          <Row
            label={L.purpose}
            labelEn="Purpose / Details"
            value={language === 'ur' ? data.purposeUr : data.purposeEn}
            voided={voided}
          />
          <Row
            label={L.reference}
            labelEn="Reference No."
            value={data.referenceNumber}
            voided={voided}
          />
        </div>

        <div className="sqi-receipt__amount-box">
          <div className="sqi-receipt__amount">
            <div className="sqi-receipt__amount-label">
              {L.amount} / Amount (PKR)
            </div>
            <div
              className={`sqi-receipt__amount-value${voided ? ' sqi-receipt-row--voided' : ''}`}
            >
              Rs. {amount.toLocaleString('en-US')}
            </div>
          </div>
          <div className="sqi-receipt__amount" style={{ background: 'transparent' }}>
            <div className="sqi-receipt__amount-label">
              {L.fund} / {L.fee}
            </div>
            <div className="sqi-row__value" style={{ fontSize: '9.5pt' }}>
              {typeof data.fundAmount === 'number'
                ? `Rs. ${Math.round(data.fundAmount).toLocaleString('en-US')}`
                : '—'}
              {'  +  '}
              {typeof data.printingFee === 'number'
                ? `Rs. ${Math.round(data.printingFee).toLocaleString('en-US')}`
                : '—'}
              {data.memberType ? (
                <div className="sqi-row__en">
                  {data.memberType === 'NEW' ? L.newMember : L.oldMember}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="sqi-receipt__words" dir={dir}>
          <span className="sqi-row__en">{L.amountWords}</span>
          <div>{language === 'ur' ? rupeesInWordsUr(amount) : rupeesInWordsEn(amount)}</div>
        </div>

        <p className="sqi-oath" dir={dir} style={{ marginTop: '3mm', fontSize: '10pt' }}>
          {L.body}
        </p>

        <div className="sqi-signs">
          <div className="sqi-sign">
            <div className="sqi-sign__value">{data.financeSecretaryName || '\u00A0'}</div>
            <div className="sqi-sign__line">
              {L.finance}
              <div className="sqi-sign__en">{L.financeEn}</div>
            </div>
          </div>
          <div className="sqi-sign">
            <div className="sqi-sign__value">{data.collectorName || '\u00A0'}</div>
            <div className="sqi-sign__line">
              {L.collector}
              <div className="sqi-sign__en">{L.collectorEn}</div>
            </div>
          </div>
          <div>
            <div className="sqi-stamp sqi-stamp--verified">
              <span dir="rtl">
                {L.stamp}
                <br />
                {L.verified}
              </span>
            </div>
          </div>
        </div>

        {voided ? (
          <div className="sqi-row__en" style={{ marginTop: '2mm', color: '#a4262c' }} dir={dir}>
            {L.void}
            {data.voidReason ? ` — ${data.voidReason}` : ''}
            {data.voidedBy ? ` (${data.voidedBy})` : ''}
            {data.voidedAt ? ` • ${data.voidedAt}` : ''}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RaseedWasooliDocument;
