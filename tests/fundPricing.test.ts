import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFundQuote,
  isValidMonthCount,
  isValidYearCount,
  receiptPayableAmount,
  MONTHLY_RATE_PKR,
  YEARLY_RATE_PKR,
  FORM_PRINTING_FEE_PKR,
  MAX_MONTHS,
} from '../src/utils/fundPricing.ts';

test('rates match the official decision', () => {
  assert.equal(MONTHLY_RATE_PKR, 100);
  assert.equal(YEARLY_RATE_PKR, 1200);
  assert.equal(FORM_PRINTING_FEE_PKR, 100);
});

test('new member: 1 year = 1200 + 100 = 1300', () => {
  const q = calculateFundQuote({ plan: 'SALANA', years: 1, memberType: 'NEW' });
  assert.equal(q.fundAmount, 1200);
  assert.equal(q.printingFee, 100);
  assert.equal(q.totalAmount, 1300);
});

test('new member: 1 month = 100 + 100 = 200', () => {
  const q = calculateFundQuote({ plan: 'MAHANA', months: 1, memberType: 'NEW' });
  assert.equal(q.totalAmount, 200);
});

test('old member by hand: fund only, no printing fee', () => {
  assert.equal(calculateFundQuote({ plan: 'SALANA', years: 1, memberType: 'OLD_BY_HAND' }).totalAmount, 1200);
  assert.equal(calculateFundQuote({ plan: 'MAHANA', months: 1, memberType: 'OLD_BY_HAND' }).totalAmount, 100);
  assert.equal(calculateFundQuote({ plan: 'MAHANA', months: 1, memberType: 'OLD_BY_HAND' }).printingFee, 0);
});

test('monthly accepts 1..11 and rejects 12', () => {
  for (let m = 1; m <= 11; m += 1) {
    assert.equal(isValidMonthCount(m), true, `month ${m} should be valid`);
  }
  assert.equal(MAX_MONTHS, 11);
  assert.equal(isValidMonthCount(12), false);
  assert.equal(calculateFundQuote({ plan: 'MAHANA', months: 12, memberType: 'NEW' }).isValid, false);
  assert.equal(isValidMonthCount(0), false);
  assert.equal(isValidMonthCount(2.5), false);
  assert.equal(isValidMonthCount('3'), false);
});

test('yearly accepts 1, 2, 10 and arbitrary whole years', () => {
  for (const y of [1, 2, 3, 10, 25, 50]) {
    assert.equal(isValidYearCount(y), true, `year ${y} should be valid`);
  }
  assert.equal(isValidYearCount(0), false);
  assert.equal(isValidYearCount(1.5), false);
  const q = calculateFundQuote({ plan: 'SALANA', years: 10, memberType: 'OLD_BY_HAND' });
  assert.equal(q.fundAmount, 12000);
  assert.equal(q.totalAmount, 12000);
});

test('monthly totals scale by 100 and stay separate from any serial number', () => {
  const q = calculateFundQuote({ plan: 'MAHANA', months: 11, memberType: 'NEW' });
  assert.equal(q.fundAmount, 1100);
  assert.equal(q.totalAmount, 1200);
  // 4200/4201 are serial numbers, never amounts.
  assert.notEqual(receiptPayableAmount({ plan: 'MAHANA', months: 11, memberType: 'NEW' }), 4200);
});

test('invalid selections still return a quote object with errors', () => {
  const q = calculateFundQuote({ plan: 'MAHANA', months: 12, memberType: 'NEW' });
  assert.equal(q.isValid, false);
  assert.ok(q.errors.length > 0);
  assert.equal(q.totalAmount, 1100 + 100); // clamped to 11 months + fee
});

test('period labels are produced in both languages', () => {
  const q = calculateFundQuote({ plan: 'SALANA', years: 2, memberType: 'NEW' });
  assert.match(q.periodLabelEn, /2 years/);
  assert.match(q.periodLabelUr, /۲ سال/);
});
