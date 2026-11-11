# Kifayat Connect — Security Specification & Security Matrix

## 1. Core Data Invariants & Zero-Trust Access Control
1. **Root Super Admin Invariant**: Only authenticated users with `request.auth.token.email == 'asadullah6959@gmail.com'` and `request.auth.token.email_verified == true` can hold the `SUPER_ADMIN` authority or perform master governance overrides.
2. **Anti-Privilege Escalation**: Standard users during registration can ONLY create documents with `role: 'MEMBER'`. Any attempt to create or modify a profile with `role: 'SUPER_ADMIN'`, `role: 'FINANCE_OFFICER'`, or `role: 'REGIONAL_OFFICER'` is strictly rejected at the database gate.
3. **Regional Sandboxing**: Regional Officers can only review and recommend applications or manage complaints where `region` matches their assigned jurisdiction. They cannot inspect or alter records of other regions.
4. **Financial Integrity**: Finance Officers cannot edit member identity records, create staff accounts, or approve memberships. Only Finance Officers and Super Admin can verify payment transactions.
5. **PII Isolation**: Phone numbers, CNIC, and addresses are strictly protected; members can only view and update their own personal information (`request.auth.uid == userId`).
6. **Immutable Audit Trail**: The `audit_logs` collection is strictly append-only (create allowed by authorized actors; update and delete are unconditionally denied).

---

## 2. The Dirty Dozen Threat Payloads (Targeting PERMISSION_DENIED)

1. **Payload 1 (Super Admin Impersonation)**:
   - User `attacker_uid` (email `hacker@evil.com`) attempts to write `/users/attacker_uid` with `{ role: "SUPER_ADMIN" }`.
   - *Expected Result*: **PERMISSION_DENIED** (Email is not `asadullah6959@gmail.com`).

2. **Payload 2 (Unverified Email Spoof)**:
   - User claims email `asadullah6959@gmail.com` but `email_verified == false`.
   - *Expected Result*: **PERMISSION_DENIED** (`email_verified == true` required).

3. **Payload 3 (Self-Role Elevation on Update)**:
   - User `member_123` (`role: "MEMBER"`) sends update diff changing `role` to `"FINANCE_OFFICER"`.
   - *Expected Result*: **PERMISSION_DENIED** (`affectedKeys().hasOnly(['role'])` locked to Super Admin).

4. **Payload 4 (Ghost Field / Shadow Injection)**:
   - User registers with `{ name: "Ali", role: "MEMBER", isSuperUser: true, bypassLimit: true }`.
   - *Expected Result*: **PERMISSION_DENIED** (`isValidUser()` enforces `hasOnly` valid blueprint schema keys).

5. **Payload 5 (Cross-Regional Tampering)**:
   - Regional Officer of *Multan Division* attempts to update an application in *Lahore Central*.
   - *Expected Result*: **PERMISSION_DENIED** (`regionalOfficerRegion == targetDoc.region`).

6. **Payload 6 (Unauthorized Payment Self-Verification)**:
   - Member attempts to update their own payment transaction status to `"VERIFIED"`.
   - *Expected Result*: **PERMISSION_DENIED** (Only Finance Officer or Super Admin can verify payments).

7. **Payload 7 (Audit Trail Deletion / Tampering)**:
   - Any authenticated user attempts to execute `delete` or `update` on `/audit_logs/aud_123`.
   - *Expected Result*: **PERMISSION_DENIED** (Audit records are immutable; `allow update, delete: if false`).

8. **Payload 8 (ID Path Poisoning)**:
   - Attacker attempts a write to `/users/{userId}` where `userId` is a 2KB malicious string or contains traversal characters.
   - *Expected Result*: **PERMISSION_DENIED** (`isValidId(userId)` strictly mandates max 128 chars regex `^[a-zA-Z0-9_\-]+$`).

9. **Payload 9 (Terminal State Override)**:
   - Member attempts to reopen or edit an application after status is `"ACTIVE"` or `"REJECTED"`.
   - *Expected Result*: **PERMISSION_DENIED** (Terminal state locking enforced).

10. **Payload 10 (PII Snooping via List Query)**:
    - Member queries all documents in `/users` without restricting to their own `id`.
    - *Expected Result*: **PERMISSION_DENIED** (List queries must enforce `resource.data.id == request.auth.uid` or caller is staff/admin).

11. **Payload 11 (Fabricated Verified Receipt)**:
    - User directly writes `/payments/fake_tx` with `status: "VERIFIED"`.
    - *Expected Result*: **PERMISSION_DENIED** (New payments can only be created with `status: "PENDING_VERIFICATION"`).

12. **Payload 12 (Unauthorized Bulletin Publication)**:
    - Regular Member attempts to create a document in `/announcements`.
    - *Expected Result*: **PERMISSION_DENIED** (Only Super Admin and Regional Officers can publish announcements).
