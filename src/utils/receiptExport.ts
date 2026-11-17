import type { PaymentTransaction, User } from '../types';
import { drawMoharStampOnCanvas } from '../components/common/OfficialMoharStamp';
import { formatRupeesUr } from './dastoor';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Wraps a JPEG byte array inside a self-contained standards-compliant PDF 1.4 document.
 * Works 100% offline on desktop, iOS Safari, Android Chrome, and Capacitor Android WebView.
 */
function buildPdfFromJpegBytes(jpegBytes: Uint8Array, imgWidthPx: number, imgHeightPx: number): Uint8Array {
  const pageW = 595.28; // A4 width in pt
  const pageH = Math.round((pageW * imgHeightPx) / imgWidthPx * 100) / 100;
  const encoder = new TextEncoder();

  const header = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  const obj4Start = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj4End = '\nendstream\nendobj\n';
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const obj5 = `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    cursor += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    cursor += b.length;
  };

  pushStr(header);
  offsets.push(cursor);
  pushStr(obj1);
  offsets.push(cursor);
  pushStr(obj2);
  offsets.push(cursor);
  pushStr(obj3);
  offsets.push(cursor);
  pushStr(obj4Start);
  pushBytes(jpegBytes);
  pushStr(obj4End);
  offsets.push(cursor);
  pushStr(obj5);

  const xrefOffset = cursor;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  pushStr(xref + trailer);

  const out = new Uint8Array(cursor);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function resolveReceiptFundTierLabel(tx: PaymentTransaction): { en: string; ur: string } {
  if (tx.fundTier === 'MAHANA') {
    return { en: 'Mahana Fund (Monthly)', ur: 'ماہانہ فنڈ' };
  }
  if (tx.fundTier === 'SALANA') {
    return { en: 'Salana Fund (Annual)', ur: 'سالانہ فنڈ' };
  }
  if (tx.fundTier === 'HANGAMI' || tx.fundCategory === 'Emergency Relief') {
    return { en: 'Hangami Fund (Emergency)', ur: 'ہنگامی فنڈ / Hangami Fund' };
  }
  if (tx.fundCategory === 'Annual Welfare Fund') {
    return { en: 'Salana Fund', ur: 'سالانہ فنڈ' };
  }
  if (tx.fundCategory === 'Monthly Contribution') {
    return { en: 'Mahana Fund', ur: 'ماہانہ فنڈ' };
  }
  return { en: tx.fundCategory, ur: tx.fundCategory };
}

/**
 * Generates & downloads a high-resolution PDF Raseed ("رسید وصولی") with matching Serial Number
 * and embedded Circular 3D Royal Gold & Emerald Official Mohar Stamp.
 */
export async function downloadOfficialReceiptPdf(
  receipt: PaymentTransaction,
  payer?: User | null,
  options?: { allowCnic?: boolean }
): Promise<void> {
  if (receipt.status !== 'VERIFIED') return;

  const width = 1240;
  const height = 1660;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const serial = receipt.serialNumber || receipt.receiptNumber;
  const unitLabel = receipt.unit || receipt.unionCouncil || receipt.district || payer?.district || 'Central Unit';
  const tier = resolveReceiptFundTierLabel(receipt);

  // Luxury dark parchment-midnight background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#070D14');
  bg.addColorStop(0.5, '#0F172A');
  bg.addColorStop(1, '#070D14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Outer Royal Gold Double Frame
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 32, 32, width - 64, height - 64, 28);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 48, 48, width - 96, height - 96, 20);
  ctx.stroke();

  // Header Banner
  const hdrGrad = ctx.createLinearGradient(64, 64, width - 64, 290);
  hdrGrad.addColorStop(0, '#033527');
  hdrGrad.addColorStop(0.55, '#064E3B');
  hdrGrad.addColorStop(1, '#022C22');
  ctx.fillStyle = hdrGrad;
  drawRoundedRect(ctx, 64, 64, width - 128, 240, 18);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 54px "Noto Nastaliq Urdu", "Plus Jakarta Sans", sans-serif';
  ctx.fillText('سوئی خیل قومی اتحاد', width / 2, 140);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SUI KHEL QAUMI ITTEHAD · KIFAYAT CONNECT', width / 2, 195);

  // Badge: رسید وصولی
  ctx.fillStyle = '#D4AF37';
  drawRoundedRect(ctx, width / 2 - 170, 218, 340, 56, 14);
  ctx.fill();
  ctx.fillStyle = '#070D14';
  ctx.font = '900 28px "Noto Nastaliq Urdu", "Plus Jakarta Sans", sans-serif';
  ctx.fillText('رسید وصولی · OFFICIAL RASEED', width / 2, 255);

  // Meta Strip: Serial Number, Date, Unit
  ctx.fillStyle = '#131C31';
  drawRoundedRect(ctx, 64, 330, width - 128, 125, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SERIAL NO. / سیریل نمبر', 96, 372);
  ctx.fillStyle = '#FDE047';
  ctx.font = '900 32px "JetBrains Mono", monospace';
  ctx.fillText(serial, 96, 418);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DATE / تاریخ', width / 2, 372);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 26px "JetBrains Mono", monospace';
  ctx.fillText(receipt.date, width / 2, 418);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('UNIT / یونٹ', width - 96, 372);
  ctx.fillStyle = '#38BDF8';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(String(unitLabel).slice(0, 28), width - 96, 418);

  // Official Urdu Wording Highlight Card
  ctx.fillStyle = '#0B1424';
  drawRoundedRect(ctx, 64, 480, width - 128, 190, 18);
  ctx.fill();
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FEF08A';
  ctx.font = '700 32px "Noto Nastaliq Urdu", serif';
  ctx.fillText(
    `محترم جناب ${receipt.userName} صاحب کی جانب سے`,
    width / 2,
    555
  );
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 34px "Noto Nastaliq Urdu", serif';
  ctx.fillText(
    `مبلغ ${receipt.amount.toLocaleString()} روپے (${formatRupeesUr(receipt.amount)}) سکہ رائج الوقت وصول پائے۔`,
    width / 2,
    625
  );

  // Structured Details Grid
  ctx.fillStyle = '#131C31';
  drawRoundedRect(ctx, 64, 695, width - 128, 410, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const rows: Array<[string, string]> = [
    ['Member / Contributor', `${receipt.userName} (${receipt.userMembershipId || 'ACTIVE'})`],
    ['Tabar / Clan (ٹبر)', `${receipt.userTabbarEnglish || payer?.tabbarEnglish || '—'} ${receipt.userTabbarUrdu || payer?.tabbarUrdu ? `(${receipt.userTabbarUrdu || payer?.tabbarUrdu})` : ''}`],
    ['District & Province', `${receipt.district || payer?.district || '—'}, ${receipt.stateProvince || payer?.stateProvince || 'Pakistan'}`],
    ['Fund Type (قسم فنڈ)', `${tier.en} · ${tier.ur}`],
    ['Period / Reference', receipt.periodLabelEn || receipt.referenceNumber || 'Verified Contribution'],
    ['Payment Method', `${receipt.paymentMethod} · Ref: ${receipt.referenceNumber}`],
    ['Approved Amount', `PKR ${receipt.amount.toLocaleString()} (${formatRupeesUr(receipt.amount)})`],
  ];

  if (options?.allowCnic && (receipt.payerCnic || payer?.cnic)) {
    rows.splice(1, 0, ['CNIC (شناختی کارڈ)', receipt.payerCnic || payer?.cnic || '']);
  }

  let rowY = 745;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, 98, rowY);

    ctx.textAlign = 'right';
    ctx.fillStyle = label.includes('Amount') ? '#FDE047' : '#F8FAFC';
    ctx.font = label.includes('Amount') ? '900 24px "JetBrains Mono", monospace' : '700 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(String(value).slice(0, 58), width - 98, rowY);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(96, rowY + 18);
    ctx.lineTo(width - 96, rowY + 18);
    ctx.stroke();
    rowY += 50;
  }

  // Verification & Signatures + Official Circular Mohar Stamp
  ctx.fillStyle = '#0B1424';
  drawRoundedRect(ctx, 64, 1130, width - 128, 390, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Official Mohar in Center
  drawMoharStampOnCanvas(ctx, width / 2, 1320, 128, {
    variant: 'VERIFIED',
    serialNumber: serial,
  });

  // Left signature block: دستخط پرانا مالیات
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38BDF8';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(receipt.verifiedBy || 'Approved Leadership', 240, 1275);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 1315);
  ctx.lineTo(370, 1315);
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 24px "Noto Nastaliq Urdu", serif';
  ctx.fillText('دستخط پرانا مالیات', 240, 1365);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Finance Verification Signature', 240, 1400);

  // Right signature block: دستخط وصول کنندہ
  ctx.fillStyle = '#38BDF8';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Kifayat Connect Treasury', width - 240, 1275);
  ctx.strokeStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(width - 370, 1315);
  ctx.lineTo(width - 110, 1315);
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 24px "Noto Nastaliq Urdu", serif';
  ctx.fillText('دستخط وصول کنندہ', width - 240, 1365);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Receiver / Authorized Collector', width - 240, 1400);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText(
    `E-SEAL: KC-AUTH-${receipt.id.toUpperCase()} · Verified At: ${receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : receipt.date}`,
    width / 2,
    1575
  );

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = jpegDataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const jpegBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    jpegBytes[i] = bin.charCodeAt(i);
  }

  const pdfBytes = buildPdfFromJpegBytes(jpegBytes, width, height);
  const pdfCopy = new Uint8Array(pdfBytes.length);
  pdfCopy.set(pdfBytes);
  const blob = new Blob([pdfCopy], { type: 'application/pdf' });
  const safeSerial = serial.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerBlobDownload(blob, `Kifayat_Raseed_${safeSerial}.pdf`);
}

function escapeXml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates & downloads a formatted Excel (.xls SpreadsheetML) Raseed workbook
 * with UTF-8 Urdu & English fields, Serial Number, and Approval audit details.
 */
export function downloadOfficialReceiptExcel(
  receipt: PaymentTransaction,
  payer?: User | null,
  options?: { allowCnic?: boolean }
): void {
  if (receipt.status !== 'VERIFIED') return;

  const serial = receipt.serialNumber || receipt.receiptNumber;
  const tier = resolveReceiptFundTierLabel(receipt);
  const unitLabel = receipt.unit || receipt.unionCouncil || receipt.district || payer?.district || 'Central Unit';

  const rows: Array<[string, string]> = [
    ['Organization / تنظیم', 'سوئی خیل قومی اتحاد — Kifayat Connect Welfare Organization'],
    ['Document / دستاویز', 'رسید وصولی — Official Verified Payment Receipt'],
    ['Serial Number / سیریل نمبر', serial],
    ['Receipt Reference / حوالہ', receipt.receiptNumber],
    ['Date / تاریخ', receipt.date],
    ['Unit / یونٹ', unitLabel],
    ['Member Name / نام ممبر', receipt.userName],
    ['Membership ID / رکنیت نمبر', receipt.userMembershipId || 'ACTIVE'],
    ['Tabar / Clan (ٹبر)', `${receipt.userTabbarEnglish || payer?.tabbarEnglish || '—'} (${receipt.userTabbarUrdu || payer?.tabbarUrdu || '—'})`],
    ['District & Province', `${receipt.district || payer?.district || '—'}, ${receipt.stateProvince || payer?.stateProvince || 'Pakistan'}`],
    ['Fund Category / قسم فنڈ', `${tier.en} (${tier.ur})`],
    ['Covered Period / مدت', receipt.periodLabelEn || receipt.periodLabelUr || 'Standard Contribution'],
    ['Amount (PKR) / رقم', `${receipt.amount}`],
    ['Amount (Urdu) / رقم الفاظ میں', formatRupeesUr(receipt.amount)],
    ['Payment Method / ادائیگی کا طریقہ', receipt.paymentMethod],
    ['Transaction Ref / ٹرانزیکشن نمبر', receipt.referenceNumber],
    ['Approval Status / منظوری کی حیثیت', 'APPROVED & VERIFIED (منظور شدہ)'],
    ['Verified By / دستخط پرانا مالیات و منظوری', receipt.verifiedBy || 'Super Admin / Founder'],
    ['Verified At / منظوری کا وقت', receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString() : receipt.date],
    ['Official Statement', `محترم جناب ${receipt.userName} صاحب کی جانب سے مبلغ ${receipt.amount.toLocaleString()} روپے سکہ رائج الوقت وصول پائے۔`],
    ['Official Seal / مہر', 'KIFAYAT CONNECT · مہر سوئی خیل قومی اتحاد · VERIFIED SEAL'],
  ];

  if (options?.allowCnic && (receipt.payerCnic || payer?.cnic)) {
    rows.splice(8, 0, ['CNIC / شناختی کارڈ نمبر', receipt.payerCnic || payer?.cnic || '']);
  }

  const xmlRows = rows
    .map(
      ([k, v]) => `
      <Row>
        <Cell ss:StyleID="LabelCell"><Data ss:Type="String">${escapeXml(k)}</Data></Cell>
        <Cell ss:StyleID="ValueCell"><Data ss:Type="String">${escapeXml(v)}</Data></Cell>
      </Row>`
    )
    .join('');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="TitleCell">
      <Font ss:Bold="1" ss:Size="14" ss:Color="#064E3B"/>
      <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="LabelCell">
      <Font ss:Bold="1" ss:Size="11" ss:Color="#0F172A"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="ValueCell">
      <Font ss:Size="11" ss:Color="#020617"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Official_Raseed">
    <Table>
      <Column ss:Width="220"/>
      <Column ss:Width="440"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="1" ss:StyleID="TitleCell"><Data ss:Type="String">سوئی خیل قومی اتحاد · Kifayat Connect — Official Raseed (${escapeXml(serial)})</Data></Cell>
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob(['\uFEFF' + workbookXml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const safeSerial = serial.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerBlobDownload(blob, `Kifayat_Raseed_${safeSerial}.xls`);
}

export function buildWhatsAppReceiptText(receipt: PaymentTransaction): string {
  const serial = receipt.serialNumber || receipt.receiptNumber;
  const tier = resolveReceiptFundTierLabel(receipt);
  return [
    `✅ *سوئی خیل قومی اتحاد — KIFAYAT CONNECT*`,
    `🧾 *رسید وصولی (Official Verified Raseed)*`,
    `🔢 *Serial No:* ${serial}`,
    `📅 *Date:* ${receipt.date}`,
    `👤 *Member:* ${receipt.userName} (${receipt.userMembershipId || 'ACTIVE'})`,
    `💰 *Amount:* PKR ${receipt.amount.toLocaleString()} (${formatRupeesUr(receipt.amount)})`,
    `📂 *Fund Type:* ${tier.en} / ${tier.ur}`,
    receipt.periodLabelEn ? `📆 *Period:* ${receipt.periodLabelEn}` : '',
    `🏛️ *Approved By:* ${receipt.verifiedBy || 'Central Leadership'}`,
    ``,
    `محترم جناب ${receipt.userName} صاحب کی جانب سے مبلغ ${receipt.amount.toLocaleString()} روپے سکہ رائج الوقت وصول پائے۔`,
    `🔏 *VERIFIED BY OFFICIAL SEAL (مہر سوئی خیل قومی اتحاد)*`,
  ]
    .filter(Boolean)
    .join('\n');
}
