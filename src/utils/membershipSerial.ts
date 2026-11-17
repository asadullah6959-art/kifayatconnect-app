/**
 * Membership serial numbering — one number, two documents.
 *
 * Rules (Founder decision, do not change):
 *  - The first issued serial is 4201 and the series increments by one.
 *  - A serial is minted ONLY when an authorised officer approves the application.
 *    Pending and rejected applications never hold a serial.
 *  - The Rukniyat Form (رکنیت نمبر) and the Raseed Wasooli (رسید نمبر) always
 *    print the SAME number for the same member.
 *  - A serial is never reused or decremented, including concurrent approvals.
 *  - The serial is an identifier, never a currency amount. 4200 in the original
 *    paper receipt is a reference serial, NOT Rs. 4,200.
 */
import type { MembershipStatus } from '../types';

export const FIRST_SERIAL_NUMBER = 4201;
export const SERIAL_COUNTER_COLLECTION = 'counters';
export const SERIAL_COUNTER_DOC_ID = 'membership_serial';
export const SERIAL_AUDIT_COLLECTION = 'serial_registry';

export interface SerialCounterState {
  nextNumber?: number;
  lastSerial?: string;
}

export interface SerialAllocation {
  serial: number;
  nextState: { nextNumber: number; lastSerial: string };
}

/** Statuses that may hold a serial. Everything else must remain serial-less. */
const SERIAL_ELIGIBLE_STATUSES: MembershipStatus[] = ['ACTIVE'];

export function isSerialEligibleStatus(status: MembershipStatus | string | undefined): boolean {
  return SERIAL_ELIGIBLE_STATUSES.includes(status as MembershipStatus);
}

/**
 * Compute the next serial from persisted counter state.
 * Missing / corrupt counters restart safely at FIRST_SERIAL_NUMBER.
 */
export function planSerialAllocation(state?: SerialCounterState | null): SerialAllocation {
  const rawNext = Number(state?.nextNumber);
  const next = Number.isFinite(rawNext) && rawNext >= FIRST_SERIAL_NUMBER
    ? Math.floor(rawNext)
    : FIRST_SERIAL_NUMBER;

  return {
    serial: next,
    nextState: { nextNumber: next + 1, lastSerial: formatSerial(next) },
  };
}

/** Canonical printed form of a serial: plain digits, e.g. "4201". */
export function formatSerial(serial: number): string {
  return String(Math.trunc(serial));
}

/** Read a serial back from stored text. Returns null when it is not a valid serial. */
export function parseSerial(raw?: string | number | null): number | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(value)) return null;
  return isValidSerialNumber(value) ? value : null;
}

export function isValidSerialNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= FIRST_SERIAL_NUMBER;
}

export function isValidSerial(raw?: string | number | null): boolean {
  return parseSerial(raw) !== null;
}

/** The two official documents must always carry an identical, valid serial. */
export function serialsMatch(
  formSerial?: string | number | null,
  receiptSerial?: string | number | null
): boolean {
  const form = parseSerial(formSerial);
  const receipt = parseSerial(receiptSerial);
  return form !== null && receipt !== null && form === receipt;
}

/**
 * Guard for the approval step: returns the reason approval cannot mint a serial,
 * or null when it may proceed.
 */
export function serialMintBlocker(input: {
  status: MembershipStatus | string | undefined;
  existingSerial?: string | number | null;
}): string | null {
  if (!isSerialEligibleStatus(input.status)) {
    return `Application status "${input.status}" cannot receive a membership serial. Only an approved (ACTIVE) application can.`;
  }
  if (input.existingSerial !== undefined && input.existingSerial !== null && input.existingSerial !== '') {
    return `Serial ${input.existingSerial} is already issued for this application and must never be replaced.`;
  }
  return null;
}

/** Receipts are permanent. Only the Founder / Super Admin may void one. */
export function canVoidReceipt(input: { isFounder?: boolean; role?: string }): boolean {
  return Boolean(input.isFounder) || input.role === 'SUPER_ADMIN';
}
