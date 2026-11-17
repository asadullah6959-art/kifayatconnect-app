/**
 * Membership serial minting — one atomic counter, one number per member.
 *
 * The counter lives in Firestore at counters/membership_serial and starts at
 * 4201. A serial is minted the moment the member submits the Rukniyat Form and is
 * written to the record, so the form prints its رکنیت نمبر immediately and the
 * Raseed Wasooli reuses that identical number when an officer approves it.
 *
 * If Firestore is unreachable the same monotonic series is continued from a
 * local counter so the UI never blocks and numbers are never reused downward.
 */
import { doc, runTransaction, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  FIRST_SERIAL_NUMBER,
  SERIAL_COUNTER_COLLECTION,
  SERIAL_COUNTER_DOC_ID,
  SERIAL_AUDIT_COLLECTION,
  planSerialAllocation,
  formatSerial,
  parseSerial,
  type SerialCounterState,
} from '../utils/membershipSerial';

const LOCAL_KEY = 'kc_local_membership_serial';

function readLocalNext(): number {
  try {
    const raw = Number(window.localStorage.getItem(LOCAL_KEY) || '');
    return Number.isFinite(raw) && raw >= FIRST_SERIAL_NUMBER ? Math.floor(raw) : FIRST_SERIAL_NUMBER;
  } catch {
    return FIRST_SERIAL_NUMBER;
  }
}

function writeLocalNext(value: number): void {
  try {
    window.localStorage.setItem(LOCAL_KEY, String(value));
  } catch {
    /* storage unavailable — the Firestore counter remains authoritative */
  }
}

export interface MintedSerial {
  /** The printed serial, e.g. "4201". Identical on form and receipt. */
  serial: string;
  number: number;
  source: 'firestore' | 'local';
}

/**
 * Mint the next membership serial at submission.
 * Passing an already issued serial returns it unchanged — a number is never
 * replaced, so the approval step that passes the stored serial reuses it and the
 * form and receipt can never diverge.
 */
export async function mintMembershipSerial(existingSerial?: string | number | null): Promise<MintedSerial> {
  const already = parseSerial(existingSerial);
  if (already !== null) {
    return { serial: formatSerial(already), number: already, source: 'firestore' };
  }

  try {
    const counterRef = doc(db, SERIAL_COUNTER_COLLECTION, SERIAL_COUNTER_DOC_ID);
    const allocated = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const state = snap.exists() ? (snap.data() as SerialCounterState) : null;
      const { serial, nextState } = planSerialAllocation(state);

      tx.set(
        counterRef,
        {
          id: SERIAL_COUNTER_DOC_ID,
          nextNumber: nextState.nextNumber,
          lastSerial: nextState.lastSerial,
          updatedAt: new Date().toISOString(),
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );

      // Permanent audit trail of every issued serial.
      tx.set(doc(db, SERIAL_AUDIT_COLLECTION, formatSerial(serial)), {
        serial: formatSerial(serial),
        number: serial,
        issuedAt: new Date().toISOString(),
        issuedAtServer: serverTimestamp(),
      });

      return serial;
    });

    writeLocalNext(allocated + 1);
    return { serial: formatSerial(allocated), number: allocated, source: 'firestore' };
  } catch (err) {
    console.warn('Membership serial counter unavailable, continuing local series:', err);
    const next = readLocalNext();
    writeLocalNext(next + 1);
    return { serial: formatSerial(next), number: next, source: 'local' };
  }
}

/**
 * Persist the issued serial on the member's application document so both
 * documents and the member account resolve the same value forever.
 */
export async function attachSerialToApplication(
  applicationId: string,
  serial: string,
  meta: { approvedBy?: string; amount?: number; fundPlan?: string } = {}
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'membershipApplications', applicationId),
      {
        membershipSerial: serial,
        membershipSerialIssuedAt: new Date().toISOString(),
        approvedBy: meta.approvedBy || null,
        approvedAmount: typeof meta.amount === 'number' ? meta.amount : null,
        fundPlan: meta.fundPlan || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not persist membership serial (kept in local state):', err);
  }
}
