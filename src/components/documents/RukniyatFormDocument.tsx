import React from 'react';
import './documents.css';
import { SqiEmblem } from './SqiEmblem';
import { isValid13DigitCnic, normalizeCnicDigits } from '../../utils/cnic';

/**
 * Rukniyat Form (رکنیت فارم) — digital replica of the official
 * Sui Khel Qaumi Ittehad membership registration form.
 *
 * The organisation's own name, emblem, motto, Urdu wording, section order and
 * signature areas are reproduced. Kifayat Connect is only the application that
 * hosts this document — its branding never replaces the organisation's.
 *
 * رکنیت نمبر is NEVER typed by the applicant: the system mints it when the form is
 * submitted and prints it here, and the Raseed Wasooli reuses the same number.
 */

export type DocLanguage = 'ur' | 'en';

export interface RukniyatFormValues {
  formDate: string;
  unit: string;
  applicantName: string;
  fatherName: string;
  phone: string;
  education: string;
  experience: string;
  profession: string;
  maritalStatus: string;
  currentArea: string;
  ancestralArea: string;
  dob: string;
  age: string;
  cnic: string;
  centralClan: string;
  centralClanEn: string;
  subBranch: string;
  subBranchEn: string;
  clanRepName: string;
  permanentAddress: string;
  currentAddress: string;
  photoUrl?: string;
  applicantSignature?: string;
  clanRepSignature?: string;
  officeSecretarySignature?: string;
  presidentSignature?: string;
}

export function emptyRukniyatValues(): RukniyatFormValues {
  return {
    formDate: new Date().toISOString().slice(0, 10),
    unit: '',
    applicantName: '',
    fatherName: '',
    phone: '',
    education: '',
    experience: '',
    profession: '',
    maritalStatus: '',
    currentArea: '',
    ancestralArea: '',
    dob: '',
    age: '',
    cnic: '',
    centralClan: '',
    centralClanEn: '',
    subBranch: '',
    subBranchEn: '',
    clanRepName: '',
    permanentAddress: '',
    currentAddress: '',
  };
}

/** Build form values from an existing membership application record. */
export function rukniyatValuesFromApplication(app: Record<string, any>): RukniyatFormValues {
  return {
    formDate: (app.submittedAt || new Date().toISOString()).slice(0, 10),
    unit: app.unit || '',
    applicantName: app.applicantName || '',
    fatherName: app.fatherName || '',
    phone: app.phone || '',
    education: app.education || '',
    experience: app.experience || '',
    profession: app.profession || '',
    maritalStatus: app.maritalStatus || '',
    currentArea: app.currentArea || app.cityTown || '',
    ancestralArea: app.ancestralArea || '',
    dob: app.dob || '',
    age: app.age || '',
    cnic: normalizeCnicDigits(app.cnic || ''),
    centralClan: app.tabbarUrdu || '',
    centralClanEn: app.tabbarEnglish || '',
    subBranch: app.subBranch || '',
    subBranchEn: '',
    clanRepName: app.tabarRepName || '',
    permanentAddress: app.permanentAddress || app.address || '',
    currentAddress: app.address || '',
    photoUrl: app.applicantPhotoUrl,
    applicantSignature: app.applicantSignature,
    clanRepSignature: app.tabarRepSignature,
    officeSecretarySignature: app.officeSecretarySignature,
    presidentSignature: app.presidentSignature,
  };
}

interface Labels {
  org: string;
  orgEn: string;
  motto: string;
  title: string;
  titleEn: string;
  photo: string;
  fields: Record<keyof RukniyatFormValues | 'membershipNo', { ur: string; en: string }>;
  oathTitle: string;
  oathTitleEn: string;
  oath: string;
  verifyTitle: string;
  verifyTitleEn: string;
  verifyNote: string;
  officeTitle: string;
  officeTitleEn: string;
  officeNote: string;
  secretary: string;
  secretaryEn: string;
  president: string;
  presidentEn: string;
  stamp: string;
  serialPending: string;
  cnicError: string;
}

const LABELS: Record<DocLanguage, Labels> = {
  ur: {
    org: 'سوئی خیل قومی اتحاد',
    orgEn: 'SUI KHEL QAUMI ITTEHAD',
    motto: 'وحدت | خدمت | معاونت | مصالحت',
    title: 'رکنیت فارم',
    titleEn: 'MEMBERSHIP REGISTRATION FORM',
    photo: 'درخواست گزار کی تصویر',
    fields: {
      formDate: { ur: 'تاریخ', en: 'Date' },
      membershipNo: { ur: 'رکنیت نمبر', en: 'Membership No.' },
      unit: { ur: 'یونٹ', en: 'Unit' },
      applicantName: { ur: 'نام', en: 'Name' },
      fatherName: { ur: 'ولد', en: "Father's Name" },
      phone: { ur: 'رابطہ نمبر', en: 'Contact No.' },
      education: { ur: 'تعلیم', en: 'Education' },
      experience: { ur: 'تجربہ', en: 'Experience' },
      profession: { ur: 'پیشہ/روزگار', en: 'Profession / Occupation' },
      maritalStatus: { ur: 'ازدواجی حیثیت', en: 'Marital Status' },
      currentArea: { ur: 'موجودہ علاقہ', en: 'Current Area' },
      ancestralArea: { ur: 'آبائی علاقہ (کندیان)', en: 'Ancestral Area (Kandian)' },
      dob: { ur: 'تاریخ پیدائش', en: 'Date of Birth' },
      age: { ur: 'عمر', en: 'Age' },
      cnic: { ur: 'شناختی کارڈ نمبر', en: 'CNIC No. (13 digits)' },
      centralClan: { ur: 'مرکزی خاندان (تبر)', en: 'Central Clan (Tabar)' },
      centralClanEn: { ur: 'مرکزی خاندان (انگریزی)', en: 'Central Clan in English' },
      subBranch: { ur: 'ذیلی شاخ (تبر)', en: 'Sub Branch (Tabar)' },
      subBranchEn: { ur: 'ذیلی شاخ (انگریزی)', en: 'Sub Branch in English' },
      clanRepName: { ur: 'نمائندہ خاندان (تبر)', en: 'Clan Representative' },
      permanentAddress: { ur: 'مستقل پتہ', en: 'Permanent Address' },
      currentAddress: { ur: 'موجودہ پتہ', en: 'Current Address' },
      photoUrl: { ur: 'تصویر', en: 'Photograph' },
      applicantSignature: { ur: 'دستخط درخواست گزار', en: 'Applicant Signature' },
      clanRepSignature: { ur: 'دستخط نمائندہ خاندان', en: 'Clan Representative Signature' },
      officeSecretarySignature: { ur: 'دستخط ناظم دفتر', en: 'Office Secretary Signature' },
      presidentSignature: { ur: 'دستخط صدر', en: 'President Signature' },
    },
    oathTitle: 'عہد نامہ',
    oathTitleEn: 'OATH',
    oath:
      'میں اللہ تعالیٰ کا واسطہ دے کر عہد کرتا ہوں کہ میں سوئی خیل قومی اتحاد کا وفادار رکن رہوں گا، تنظیم کے مقاصدِ وحدت، خدمت، معاونت اور مصالحت کے لیے اپنی جان، مال اور وقت سے خدمت کروں گا۔ میں تنظیم کے فیصلوں اور نظم و ضبط کا احترام کروں گا، کسی فرد یا خاندان سے تعصب نہیں کروں گا، اور اپنے فرائض ایمانداری سے ادا کروں گا۔ میری فراہم کردہ تمام معلومات درست ہیں اور اگر کوئی معلومات غلط ثابت ہوں تو تنظیم مجھے رکنیت سے خارج کر سکتی ہے۔',
    verifyTitle: 'تصدیق نمائندہ خاندان',
    verifyTitleEn: 'CLAN REPRESENTATIVE VERIFICATION',
    verifyNote:
      'میں تصدیق کرتا ہوں کہ درخواست گزار میرے خاندان (تبر) کا معلوم اور قابلِ اعتماد فرد ہے اور اس کی فراہم کردہ معلومات درست ہیں۔',
    officeTitle: 'برائے دفتری کارروائی',
    officeTitleEn: 'FOR OFFICE USE ONLY',
    officeNote: 'دفتری مہر اور دستخط کے بعد ہی رکنیت مکمل تصور کی جائے گی۔',
    secretary: 'ناظم دفتر',
    secretaryEn: 'Office Secretary',
    president: 'صدر',
    presidentEn: 'President',
    stamp: 'مہر سوئی خیل قومی اتحاد',
    serialPending: 'جمع کرانے پر خودکار جاری ہوگا',
    cnicError: '۱۳ ہندسوں کا شناختی کارڈ نمبر لازمی ہے۔',
  },
  en: {
    org: 'سوئی خیل قومی اتحاد',
    orgEn: 'SUI KHEL QAUMI ITTEHAD',
    motto: 'Unity | Service | Support | Reconciliation',
    title: 'Membership Registration Form',
    titleEn: 'RUKNIYAT FORM',
    photo: 'Applicant Photograph',
    fields: {
      formDate: { ur: 'تاریخ', en: 'Date' },
      membershipNo: { ur: 'رکنیت نمبر', en: 'Membership No.' },
      unit: { ur: 'یونٹ', en: 'Unit' },
      applicantName: { ur: 'نام', en: 'Name' },
      fatherName: { ur: 'ولد', en: "Father's Name" },
      phone: { ur: 'رابطہ نمبر', en: 'Contact No.' },
      education: { ur: 'تعلیم', en: 'Education' },
      experience: { ur: 'تجربہ', en: 'Experience' },
      profession: { ur: 'پیشہ/روزگار', en: 'Profession / Occupation' },
      maritalStatus: { ur: 'ازدواجی حیثیت', en: 'Marital Status' },
      currentArea: { ur: 'موجودہ علاقہ', en: 'Current Area' },
      ancestralArea: { ur: 'آبائی علاقہ (کندیاں)', en: 'Ancestral Area (Kandian)' },
      dob: { ur: 'تاریخ پیدائش', en: 'Date of Birth' },
      age: { ur: 'عمر', en: 'Age' },
      cnic: { ur: 'شناختی کارڈ نمبر', en: 'CNIC No. (13 digits)' },
      centralClan: { ur: 'مرکزی خاندان (تبر)', en: 'Central Clan (Tabar)' },
      centralClanEn: { ur: 'مرکزی خاندان (انگریزی)', en: 'Central Clan in English' },
      subBranch: { ur: 'ذیلی شاخ (تبر)', en: 'Sub Branch (Tabar)' },
      subBranchEn: { ur: 'ذیلی شاخ (انگریزی)', en: 'Sub Branch in English' },
      clanRepName: { ur: 'نمائندہ خاندان (تبر)', en: 'Clan Representative' },
      permanentAddress: { ur: 'مستقل پتہ', en: 'Permanent Address' },
      currentAddress: { ur: 'موجودہ پتہ', en: 'Current Address' },
      photoUrl: { ur: 'تصویر', en: 'Photograph' },
      applicantSignature: { ur: 'دستخط درخواست گزار', en: 'Applicant Signature' },
      clanRepSignature: { ur: 'دستخط نمائندہ خاندان', en: 'Clan Representative Signature' },
      officeSecretarySignature: { ur: 'دستخط ناظم دفتر', en: 'Office Secretary Signature' },
      presidentSignature: { ur: 'دستخط صدر', en: 'President Signature' },
    },
    oathTitle: 'عہد نامہ',
    oathTitleEn: 'OATH',
    oath:
      'I swear in the name of Almighty Allah that I will remain a loyal member of Sui Khel Qaumi Ittehad, and will serve its aims of Unity, Service, Support and Reconciliation with my life, wealth and time. I will respect the decisions and discipline of the organisation, will show no prejudice towards any person or clan, and will discharge my duties honestly. All information I have provided is correct, and if any of it proves false the organisation may cancel my membership.',
    verifyTitle: 'تصدیق نمائندہ خاندان',
    verifyTitleEn: 'CLAN REPRESENTATIVE VERIFICATION',
    verifyNote:
      'I certify that the applicant is a known and trustworthy member of my clan (Tabar) and that the information provided is correct.',
    officeTitle: 'برائے دفتری کارروائی',
    officeTitleEn: 'FOR OFFICE USE ONLY',
    officeNote: 'Membership is considered complete only after the office seal and signatures.',
    secretary: 'ناظم دفتر',
    secretaryEn: 'Office Secretary',
    president: 'صدر',
    presidentEn: 'President',
    stamp: 'SQI Official Seal',
    serialPending: 'Issued automatically on submission',
    cnicError: 'A 13-digit CNIC is mandatory.',
  },
};

interface FieldProps {
  label: { ur: string; en: string };
  value: string;
  onChange?: (value: string) => void;
  editable: boolean;
  language: DocLanguage;
  wide?: boolean;
  numeric?: boolean;
  placeholder?: string;
  error?: string | null;
  maxLength?: number;
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  editable,
  language,
  wide,
  numeric,
  placeholder,
  error,
  maxLength,
}) => {
  const primary = language === 'ur' ? label.ur : label.en;
  const secondary = language === 'ur' ? label.en : label.ur;

  return (
    <div className={`sqi-row${wide ? ' sqi-row--wide' : ''}`}>
      <div className="sqi-row__label">
        <span>{primary}</span>
        <span className="sqi-row__en">{secondary}</span>
      </div>
      <div>
        {editable && onChange ? (
          <input
            className={`sqi-input${numeric ? ' sqi-input--num' : ''}${
              language === 'ur' && !numeric ? ' sqi-input--rtl' : ''
            }`}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={numeric ? 'numeric' : 'text'}
            onChange={(e) => onChange(e.target.value)}
            aria-label={primary}
          />
        ) : (
          <div className="sqi-row__value">{value || '\u00A0'}</div>
        )}
        {error ? <div className="sqi-error">{error}</div> : null}
      </div>
    </div>
  );
};

export interface RukniyatFormDocumentProps {
  values: RukniyatFormValues;
  onChange?: (patch: Partial<RukniyatFormValues>) => void;
  language?: DocLanguage;
  editable?: boolean;
  /** Membership serial — minted at submission, identical to the receipt. */
  serialNumber?: string | null;
  className?: string;
}

export const RukniyatFormDocument: React.FC<RukniyatFormDocumentProps> = ({
  values,
  onChange,
  language = 'ur',
  editable = false,
  serialNumber,
  className = '',
}) => {
  const L = LABELS[language];
  const dir = language === 'ur' ? 'rtl' : 'ltr';
  const set = (patch: Partial<RukniyatFormValues>) => onChange?.(patch);
  const cnicDigits = normalizeCnicDigits(values.cnic);
  const cnicError =
    editable && cnicDigits.length > 0 && !isValid13DigitCnic(values.cnic) ? L.cnicError : null;

  return (
    <div className={`sqi-doc ${className}`} dir={dir} data-document="rukniyat-form">
      <div className="sqi-doc__frame">
        <header className="sqi-head">
          <SqiEmblem />
          <div className="sqi-head__org">
            <div className="sqi-head__org-ur" dir="rtl">
              {L.org}
            </div>
            <div className="sqi-head__org-en">{L.orgEn}</div>
            <div className="sqi-head__motto" dir={dir}>
              {L.motto.split('|').map((part, i) => (
                <span key={i}>
                  {part.trim()}
                  {i < 2 ? ' | ' : ''}
                </span>
              ))}
            </div>
          </div>
          <div className="sqi-photo">
            {values.photoUrl ? (
              <img src={values.photoUrl} alt={L.photo} />
            ) : (
              <span>{L.photo}</span>
            )}
          </div>
        </header>

        <div className="sqi-title">
          <div className="sqi-title__ur" dir="rtl">
            {L.title}
          </div>
          <div className="sqi-title__en">{L.titleEn}</div>
        </div>

        <div className="sqi-meta">
          <Field
            label={L.fields.formDate}
            value={values.formDate}
            editable={editable}
            language={language}
            onChange={(v) => set({ formDate: v })}
          />
          <div className="sqi-row">
            <div className="sqi-row__label">
              <span>{language === 'ur' ? L.fields.membershipNo.ur : L.fields.membershipNo.en}</span>
              <span className="sqi-row__en">
                {language === 'ur' ? L.fields.membershipNo.en : L.fields.membershipNo.ur}
              </span>
            </div>
            <div>
              {serialNumber ? (
                <span className="sqi-serial-badge">{serialNumber}</span>
              ) : (
                <span className="sqi-serial-badge sqi-serial-badge--empty">{L.serialPending}</span>
              )}
            </div>
          </div>
          <Field
            label={L.fields.unit}
            value={values.unit}
            editable={editable}
            language={language}
            onChange={(v) => set({ unit: v })}
          />
        </div>

        <div className="sqi-grid">
          <Field
            label={L.fields.applicantName}
            value={values.applicantName}
            editable={editable}
            language={language}
            onChange={(v) => set({ applicantName: v })}
          />
          <Field
            label={L.fields.fatherName}
            value={values.fatherName}
            editable={editable}
            language={language}
            onChange={(v) => set({ fatherName: v })}
          />
          <Field
            label={L.fields.phone}
            value={values.phone}
            editable={editable}
            language={language}
            numeric
            maxLength={15}
            onChange={(v) => set({ phone: v })}
          />
          <Field
            label={L.fields.cnic}
            value={values.cnic}
            editable={editable}
            language={language}
            numeric
            maxLength={15}
            error={cnicError}
            placeholder="35201-1234567-1"
            onChange={(v) => set({ cnic: normalizeCnicDigits(v) })}
          />
          <Field
            label={L.fields.education}
            value={values.education}
            editable={editable}
            language={language}
            onChange={(v) => set({ education: v })}
          />
          <Field
            label={L.fields.experience}
            value={values.experience}
            editable={editable}
            language={language}
            onChange={(v) => set({ experience: v })}
          />
          <Field
            label={L.fields.profession}
            value={values.profession}
            editable={editable}
            language={language}
            onChange={(v) => set({ profession: v })}
          />
          <Field
            label={L.fields.maritalStatus}
            value={values.maritalStatus}
            editable={editable}
            language={language}
            onChange={(v) => set({ maritalStatus: v })}
          />
          <Field
            label={L.fields.currentArea}
            value={values.currentArea}
            editable={editable}
            language={language}
            onChange={(v) => set({ currentArea: v })}
          />
          <Field
            label={L.fields.ancestralArea}
            value={values.ancestralArea}
            editable={editable}
            language={language}
            onChange={(v) => set({ ancestralArea: v })}
          />
          <Field
            label={L.fields.dob}
            value={values.dob}
            editable={editable}
            language={language}
            onChange={(v) => set({ dob: v })}
          />
          <Field
            label={L.fields.age}
            value={values.age}
            editable={editable}
            language={language}
            numeric
            maxLength={3}
            onChange={(v) => set({ age: v })}
          />
          <Field
            label={L.fields.centralClan}
            value={values.centralClan}
            editable={editable}
            language={language}
            onChange={(v) => set({ centralClan: v })}
          />
          <Field
            label={L.fields.centralClanEn}
            value={values.centralClanEn}
            editable={editable}
            language={language}
            onChange={(v) => set({ centralClanEn: v })}
          />
          <Field
            label={L.fields.subBranch}
            value={values.subBranch}
            editable={editable}
            language={language}
            onChange={(v) => set({ subBranch: v })}
          />
          <Field
            label={L.fields.subBranchEn}
            value={values.subBranchEn}
            editable={editable}
            language={language}
            onChange={(v) => set({ subBranchEn: v })}
          />
          <Field
            label={L.fields.clanRepName}
            value={values.clanRepName}
            editable={editable}
            language={language}
            onChange={(v) => set({ clanRepName: v })}
          />
          <Field
            label={L.fields.permanentAddress}
            value={values.permanentAddress}
            editable={editable}
            language={language}
            onChange={(v) => set({ permanentAddress: v })}
          />
          <Field
            label={L.fields.currentAddress}
            value={values.currentAddress}
            editable={editable}
            language={language}
            wide
            onChange={(v) => set({ currentAddress: v })}
          />
        </div>

        <section className="sqi-section">
          <div className="sqi-section__title">
            <span dir="rtl">{L.oathTitle}</span>
            <span className="sqi-section__title-en">{L.oathTitleEn}</span>
          </div>
          <p className="sqi-oath" dir={dir}>
            {L.oath}
          </p>
        </section>

        <section className="sqi-section">
          <div className="sqi-section__title">
            <span dir="rtl">{L.verifyTitle}</span>
            <span className="sqi-section__title-en">{L.verifyTitleEn}</span>
          </div>
          <p className="sqi-oath" dir={dir} style={{ fontSize: '9.5pt' }}>
            {L.verifyNote}
          </p>
          <div className="sqi-signs" style={{ marginTop: '3mm' }}>
            <div className="sqi-sign">
              <div className="sqi-sign__value">{values.clanRepName || '\u00A0'}</div>
              <div className="sqi-sign__line">
                {language === 'ur' ? L.fields.clanRepName.ur : L.fields.clanRepName.en}
                <div className="sqi-sign__en">
                  {language === 'ur' ? L.fields.clanRepName.en : L.fields.clanRepName.ur}
                </div>
              </div>
            </div>
            <div className="sqi-sign">
              <div className="sqi-sign__value">{values.clanRepSignature || '\u00A0'}</div>
              <div className="sqi-sign__line">
                {language === 'ur' ? L.fields.clanRepSignature.ur : L.fields.clanRepSignature.en}
                <div className="sqi-sign__en">
                  {language === 'ur' ? L.fields.clanRepSignature.en : L.fields.clanRepSignature.ur}
                </div>
              </div>
            </div>
            <div className="sqi-sign">
              <div className="sqi-sign__value">{values.applicantSignature || '\u00A0'}</div>
              <div className="sqi-sign__line">
                {language === 'ur' ? L.fields.applicantSignature.ur : L.fields.applicantSignature.en}
                <div className="sqi-sign__en">
                  {language === 'ur' ? L.fields.applicantSignature.en : L.fields.applicantSignature.ur}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sqi-section">
          <div className="sqi-section__title">
            <span dir="rtl">{L.officeTitle}</span>
            <span className="sqi-section__title-en">{L.officeTitleEn}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4mm' }}>
            <div className="sqi-sign">
              <div className="sqi-sign__value">{values.officeSecretarySignature || '\u00A0'}</div>
              <div className="sqi-sign__line">
                {L.secretary}
                <div className="sqi-sign__en">{L.secretaryEn}</div>
              </div>
            </div>
            <div className="sqi-sign">
              <div className="sqi-sign__value">{values.presidentSignature || '\u00A0'}</div>
              <div className="sqi-sign__line">
                {L.president}
                <div className="sqi-sign__en">{L.presidentEn}</div>
              </div>
            </div>
            <div className="sqi-stamp">
              <span dir="rtl">{L.stamp}</span>
            </div>
          </div>
          <div className="sqi-row__en" style={{ marginTop: '2mm' }} dir={dir}>
            {L.officeNote}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RukniyatFormDocument;
