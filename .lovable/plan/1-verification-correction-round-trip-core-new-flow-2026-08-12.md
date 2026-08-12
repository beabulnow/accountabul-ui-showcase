

Scope: registration wizard polish, document intake hardening, a verification/correction round-trip, dashboard restructure, and on-chain record language. No implementation in this pass — this document is the driver.

---

## 1. Verification correction round-trip (core new flow)

Today a submission goes `draft -> submitted -> under_review -> needs_information | approved -> anchoring -> anchored`. What is missing is a formal **corrected form the user must confirm** before the record counts as final.

Proposed flow:

```text
user submits  ->  staff / intelligence engine verifies
              ->  staff produces a CORRECTED version of the submitted fields
              ->  user sees side-by-side "You submitted" vs "Verified record"
              ->  user confirms  ->  record is final and eligible for anchoring
                  user disputes  ->  back to needs_information with a note
```

Data model additions (new migration, no changes to existing columns):

- `registration_corrections` — one row per correction round: `registration_id`, `round` (int), `corrected_fields` (jsonb snapshot of the verified values), `staff_rationale`, `created_by`, `sent_at`, `responded_at`, `response` (`confirmed` | `disputed`), `dispute_note`.
- New `registration_status` values: `correction_sent`, `confirmed_by_user`.
- Access rules: owner can read their own correction rounds and write only the response fields; staff can create rounds and read all.

UI:

- Staff review screen gains a "Propose corrections" editor prefilled with the submitted values; only changed fields are stored as a diff.
- User sees a **Confirm your verified record** screen: field-by-field diff, original struck through, corrected value highlighted, plus staff rationale. Two actions: `Confirm and finalize`, `Something is wrong`.
- Confirmation is the event that makes a record anchorable. Nothing anchors without it.

Intelligence engine hook (design now, wire later):

- Corrections are written by a single server function so a human reviewer and an automated engine share the same entry point.
- Add `source` on the correction row (`staff` | `engine`) and `confidence` per changed field so engine output can be reviewed before it is sent.

---

## 2. On-chain record language

- "Not anchored yet" is internal jargon and should not be user-facing. Replace user-visible anchoring states with plain status text:
  - `approved` / `confirmed_by_user` -> "Verified — preparing your permanent record"
  - `anchoring` -> "Publishing your permanent record"
  - `anchored` -> "Permanent record published" + a "View proof" link (tx hash, network, timestamp)
- Never show an empty anchor block. If there is no proof, show nothing rather than a negative state.
- Copy standard: a record is *tokenized as a permanent, tamper-evident record*, not "anchored".

---

## 3. Wizard — step 3 (Supporting context)

- The two textareas are visually mismatched. Fix: stack them in one card, full width — **Public source notes** on top, **Note to reviewer** directly beneath, both filling the card width with equal styling and matching row heights.
- Remove the two-column split for this step.

## 4. Wizard — step 4 (Supporting documents)

- **Drag and drop** on every slot: dashed drop target, hover/active state, keyboard-accessible fallback to the existing file picker.
- **Photos of the property get their own card**: same card height as the other slots, but spanning the full width of both columns (one wide card at the end of the grid), with a thumbnail strip preview.
- **Per-slot validation before upload**:
  - Type check by extension *and* sniffed magic bytes (not just the MIME the browser reports).
  - Per-slot rules: photo slots accept images only; deed/tax/mortgage/insurance slots accept PDF or image; ID slot accepts image or PDF.
  - Size cap per file and a per-slot file count cap, both already defined in `src/lib/documents.ts` and enforced consistently across pending and saved uploads.
  - Total-per-registration cap so no one dumps 80 files.
  - Reject with a specific, plain-language reason ("That looks like a photo, not a deed — try the Photos card").
- **Content sanity check** (phase 2 of this item): a server function that inspects each upload — blank/black page, unreadable scan, wrong document class, screenshot of a screen — and flags it for the reviewer rather than hard-rejecting it. Flags surface in the staff queue.

---

## 5. Dashboard restructure

- Add a **left sidebar navigation** to the signed-in area (collapsible, icon-mini when collapsed):
  - Overview
  - My properties
  - Submissions
  - Profile
  - Registry admin (staff only)
- **Submissions** becomes its own tab: the full list of registrations with status, receipt code, and last update. It leaves the dashboard home.
- **My properties** is the new dashboard centerpiece: only records that reached verified/confirmed, shown as property cards with a photo (from the new photos slot), address, and record status.
- Dashboard **Overview** keeps a short summary: counts, anything waiting on the user (correction to confirm, information requested), and one primary CTA.

---

## 6. Order of work

1. Step 3 layout fix + step 4 photo card and drag-and-drop (pure UI, ship first).
2. Client + server document validation rules.
3. Dashboard sidebar, Submissions tab, My properties tab.
4. Status copy rewrite and anchoring proof display.
5. Correction round-trip: migration, staff correction editor, user confirm screen.
6. Intelligence-engine entry point behind the same correction API.

---

## Technical notes

- Stack is TanStack Start + Lovable Cloud (Supabase). Server logic uses `createServerFn`; document inspection runs server-side because magic-byte sniffing and any model call must not be client-trusted.
- Documents live in the existing private bucket with signed URLs — photos in the new card use the same path, just a distinct `document_type`.
- New enum values and the corrections table need `GRANT` + RLS in the same migration.
- The correction diff is stored as a jsonb snapshot, so the confirmed record is reproducible byte-for-byte at anchor time — the hash covers the confirmed snapshot, not the original submission.