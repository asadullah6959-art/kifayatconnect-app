import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIRST_SERIAL_NUMBER,
  planSerialAllocation,
  formatSerial,
  parseSerial,
  isValidSerial,
  serialsMatch,
  serialMintBlocker,
  serialReuseBlocker,
  canVoidReceipt,
  isSerialEligibleStatus,
} from '../src/utils/membershipSerial.ts';

test('the series starts at 4201', () => {
  assert.equal(FIRST_SERIAL_NUMBER, 4201);
  const first = planSerialAllocation(null);
  assert.equal(first.serial, 4201);
  assert.equal(first.nextState.nextNumber, 4202);
  assert.equal(first.nextState.lastSerial, '4201');
});

test('serials increment by one and are never reused', () => {
  let state = planSerialAllocation(null).nextState;
  const issued = [4201];
  for (let i = 0; i < 5; i += 1) {
    const alloc = planSerialAllocation(state);
    issued.push(alloc.serial);
    state = alloc.nextState;
  }
  assert.deepEqual(issued, [4201, 4202, 4203, 4204, 4205, 4206]);
  assert.equal(new Set(issued).size, issued.length);
});

test('a corrupt or rolled-back counter cannot reissue a lower serial', () => {
  assert.equal(planSerialAllocation({ nextNumber: 0 }).serial, 4201);
  assert.equal(planSerialAllocation({ nextNumber: 4199 }).serial, 4201);
  assert.equal(planSerialAllocation({ nextNumber: Number.NaN }).serial, 4201);
  assert.equal(planSerialAllocation({ nextNumber: 5000 }).serial, 5000);
});

test('4200 is not a valid membership serial (it is the paper reference)', () => {
  assert.equal(isValidSerial(4200), false);
  assert.equal(parseSerial(4200), null);
  assert.equal(isValidSerial(4201), true);
  assert.equal(parseSerial('4201'), 4201);
  assert.equal(parseSerial('Rs. 4200'), null);
  assert.equal(parseSerial('KC-2026-0001'), null);
});

test('formatSerial prints plain digits so it is never read as money', () => {
  assert.equal(formatSerial(4201), '4201');
  assert.equal(formatSerial(4201.9), '4201');
});

test('form and receipt must carry the identical serial', () => {
  assert.equal(serialsMatch('4201', '4201'), true);
  assert.equal(serialsMatch('4201', 4201), true);
  assert.equal(serialsMatch('4201', '4202'), false);
  assert.equal(serialsMatch('4201', null), false);
  assert.equal(serialsMatch('', ''), false);
});

test('the serial is minted at submission, not only at approval', () => {
  assert.equal(isSerialEligibleStatus('PENDING_DISTRICT_REVIEW'), true);
  assert.equal(isSerialEligibleStatus('PENDING_REGIONAL_REVIEW'), true);
  assert.equal(isSerialEligibleStatus('ACTIVE'), true);
  assert.equal(isSerialEligibleStatus('REJECTED'), false);
  assert.equal(isSerialEligibleStatus('SUSPENDED'), false);

  assert.equal(serialMintBlocker({ status: 'PENDING_DISTRICT_REVIEW' }), null);
  assert.equal(serialMintBlocker({ status: 'ACTIVE' }), null);
  assert.ok(serialMintBlocker({ status: 'REJECTED' }));
});

test('an already issued serial is never replaced', () => {
  assert.ok(serialMintBlocker({ status: 'PENDING_DISTRICT_REVIEW', existingSerial: '4201' }));
  assert.ok(serialMintBlocker({ status: 'ACTIVE', existingSerial: '4201' }));
  assert.equal(serialMintBlocker({ status: 'ACTIVE', existingSerial: '' }), null);
  assert.equal(serialMintBlocker({ status: 'ACTIVE', existingSerial: null }), null);
});

test('approval reuses the submission serial and never mints a second number', () => {
  assert.equal(serialReuseBlocker({ status: 'ACTIVE', existingSerial: '4201' }), null);
  assert.ok(serialReuseBlocker({ status: 'ACTIVE', existingSerial: '' }));
  assert.ok(serialReuseBlocker({ status: 'ACTIVE', existingSerial: null }));
  assert.ok(serialReuseBlocker({ status: 'ACTIVE', existingSerial: 'Rs. 4200' }));
  // A submission that already holds its serial keeps it through approval.
  assert.equal(serialReuseBlocker({ status: 'PENDING_DISTRICT_REVIEW', existingSerial: '4201' }), null);
  assert.ok(serialReuseBlocker({ status: 'REJECTED', existingSerial: '4201' }));
});

test('only Founder / Super Admin may void a receipt', () => {
  assert.equal(canVoidReceipt({ isFounder: true, role: 'SUPER_ADMIN' }), true);
  assert.equal(canVoidReceipt({ role: 'SUPER_ADMIN' }), true);
  assert.equal(canVoidReceipt({ role: 'ADMIN' }), false);
  assert.equal(canVoidReceipt({ role: 'CO_ADMIN' }), false);
  assert.equal(canVoidReceipt({ role: 'MEMBER' }), false);
});
