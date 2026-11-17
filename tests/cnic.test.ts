import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCnicDigits, isValid13DigitCnic, formatCnicDisplay } from '../src/utils/cnic.ts';

test('13 digits are mandatory', () => {
  assert.equal(isValid13DigitCnic('35201-1234567-1'), true);
  assert.equal(isValid13DigitCnic('3520112345671'), true);
  assert.equal(isValid13DigitCnic('35201-1234567'), false);
  assert.equal(isValid13DigitCnic('35201-1234567-12'), false);
  assert.equal(isValid13DigitCnic(''), false);
  assert.equal(isValid13DigitCnic(null), false);
});

test('digits are normalized and capped at 13', () => {
  assert.equal(normalizeCnicDigits('35201-1234567-1'), '3520112345671');
  assert.equal(normalizeCnicDigits('35201-1234567-1999'), '3520112345671');
  assert.equal(normalizeCnicDigits(null), '');
});

test('display format groups the CNIC', () => {
  assert.equal(formatCnicDisplay('3520112345671'), '35201-1234567-1');
  assert.equal(formatCnicDisplay('35201'), '35201');
});
