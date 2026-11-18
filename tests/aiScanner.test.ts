import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFormPatch,
  stripDataUrlPrefix,
  matchClan,
  matchDistrict,
  normalizeCnicValue,
  normalizeAmountValue,
  ENHANCE_MAX_DIMENSION,
  MAX_UPLOAD_BYTES,
  PRIMARY_MODEL,
  MODEL_CHAIN,
} from '../src/utils/aiFormScanner';

/** The scanner must read the same values whether the model answers in English or Urdu. */

test('scanner targets Gemini 3.8 Vision with a fallback chain and the documented limits', () => {
  assert.equal(PRIMARY_MODEL, 'gemini-3.8-flash');
  assert.deepEqual(MODEL_CHAIN, ['gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-3.5-flash-lite']);
  assert.equal(ENHANCE_MAX_DIMENSION, 1800);
  assert.equal(MAX_UPLOAD_BYTES, 50 * 1024 * 1024);
});

test('the data URL prefix is stripped cleanly', () => {
  const { base64, mimeType } = stripDataUrlPrefix('data:image/jpeg;base64,AAECAwQ=');
  assert.equal(base64, 'AAECAwQ=');
  assert.equal(mimeType, 'image/jpeg');

  // Already-bare base64 must survive untouched.
  const bare = stripDataUrlPrefix('AAECAwQ=');
  assert.equal(bare.base64, 'AAECAwQ=');
});

test('English keys and Urdu keys produce an identical form patch', () => {
  const english = buildFormPatch({
    name: 'Ali Khan',
    fatherName: 'Rahim Khan',
    contactNumber: '03001234567',
    cnic: '12345-1234567-1',
    tabar: 'Faiz Khel',
    district: 'Kohat',
    date: '2026-11-18',
    amount: '1300',
    currentAddress: 'Street 1, Kohat',
    permanentAddress: 'Village Kandian',
  });

  const urdu = buildFormPatch({
    نام: 'Ali Khan',
    ولد: 'Rahim Khan',
    'رابطہ نمبر': '03001234567',
    'شناختی کارڈ نمبر': '12345-1234567-1',
    'مرکزی خاندان': 'Faiz Khel',
    یونٹ: 'Kohat',
    تاریخ: '2026-11-18',
    مبلغ: '1300',
    'موجودہ پتہ': 'Street 1, Kohat',
    'مستقل پتہ': 'Village Kandian',
  });

  assert.deepEqual(urdu.patch, english.patch);
  assert.equal(urdu.filledCount, english.filledCount);
  assert.ok(english.filledCount >= 8, `expected many fields, got ${english.filledCount}`);
});

test('CNIC is reduced to exactly 13 digits and short input is ignored', () => {
  assert.equal(normalizeCnicValue('12345-1234567-1'), '1234512345671');
  assert.equal(normalizeCnicValue('12345 1234567 1'), '1234512345671');
  assert.equal(normalizeCnicValue('12345'), '');
});

test('amount is a plain PKR number and never the paper serial', () => {
  assert.equal(normalizeAmountValue('PKR 1,300'), '1300');
  assert.equal(normalizeAmountValue('1300'), '1300');

  const scanned = buildFormPatch({ name: 'Ali', serialNo: '4200', amount: '1300' });
  assert.equal(scanned.detected.serialNo, '4200');
  assert.equal(scanned.detected.amount, 1300);

  // A bare reference serial must never be promoted into the amount field.
  const serialOnly = buildFormPatch({ serialNo: '4200' });
  assert.equal(serialOnly.detected.amount, null);
});

test('clan names resolve from the 11-clan list in both scripts', () => {
  assert.ok(matchClan('Faiz Khel'), 'Faiz Khel should match a clan');

  // OCR output varies between the hamza and plain-alef spellings of the same clan.
  const hamza = matchClan('رؤسا خیل');
  const plain = matchClan('روسا خیل');
  assert.ok(hamza, 'رؤسا خیل should match a clan');
  assert.ok(plain, 'روسا خیل should match the same clan');
  assert.equal(plain?.englishName, hamza?.englishName);

  assert.equal(matchClan('Not A Clan At All'), null);
});

test('district names resolve from the Pakistan district list', () => {
  const hit = matchDistrict('Kohat');
  assert.ok(hit, 'Kohat should match a district');
});

test('unreadable photos still return an empty patch instead of an error', () => {
  const empty = buildFormPatch({});
  assert.equal(empty.filledCount, 0);
  assert.deepEqual(empty.patch, {});
});
