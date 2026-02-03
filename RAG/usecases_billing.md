Medical Billing RAG Training Data

INDEX & QUICK REFERENCE

|  Case Type | Primary Code | Secondary Code | Key Constraint  |
| --- | --- | --- | --- |
|  Chest Pain / ACS Rule-Out | H102 | H105 | Document bridge orders  |
|  Laceration Repair | H101 + Z176 | G847 (if vaccine) | Measure wound size precisely  |
|  Cardiac Arrest / Code Blue | G521 | G523, G522 | Start/stop times required  |
|  Wrist Fracture / Reduction | H122 (night) | F028 | E410 after-hours premium (+75%)  |
|  Mental Health / Form 1 | K623 | K070, K013 | Must sign Form 1 to bill  |
|  Respiratory Distress (Critical) | G521A | G523A, G522A | Continuous attendance required  |
|  Cardioversion / Arrhythmia | G395 + Z408 | E410 (if night) | Cannot use Z408 inside G521  |
|  Palliative Consult | H055 or H065 | K070, K023 | Must reply to referrer  |
|  Early Bird (Before 08:00) | A-codes | H980, H981 | Document call-in time  |
|  Night Owl (23:00–24:00) | A-codes | H962, H984, H985 | Switch to H-codes at 00:00  |
|  Polytrauma (ISS >16) | R-codes | E420 | Calculate ISS in note  |
|  Anesthesia | R440C + Time Units | E007C (age) | 1 unit/15m (hr 1), 2 units/15m (hr 2), 3 units/15m (after)  |
|  Critical Care + Procedure | G521/G523/G522 | Procedure code (Z/F/etc) | Exclude procedure time from critical care  |
|  Resident Supervision | F-codes (procedure) | — | Resident = on-site; Fellow = available  |

## DETAILED CASE ENTRIES

### 1. CHEST PAIN / SUSPECTED ACUTE CORONARY SYNDROME

Diagnosis Code: 413 (Angina Pectoris)

**Billing Path:**

- Primary: H102 ($43.05) – Comprehensive Assessment
- Secondary: H105 ($26.25) – In-patient Interim Admission Orders
- Optional: K013 ($49.35/unit if ≥30 min counseling documented with timestamps)

**Key Rules:**

- H105 requires explicit "bridge orders" documentation in chart
- Document start/stop times for counseling to claim K013
- Use even without confirmed MI (troponin negative acceptable)

### 2. LACERATION REPAIR

Diagnosis Code: 883 (Open Wound of Finger)

**Billing Path:**

- Primary: H101 (17.10) + Z176 ($20.00 for <5cm simple)
- Alternatives:
- Z175 ($35.90 for 5–10cm)
- Z154 ($35.90 for face/complex <5cm)
- Add-on: G847 ($5.40) if tetanus vaccine actually administered

---

Key Rules:
- Measure wound to 0.1 cm accuracy — gap at 5.1 cm nearly doubles procedural fee
- Z176 is 50% fee if using dermabond (tissue glue)
- Document any nerve block (G224) separately
- Avoid H102 for isolated injuries (use H101 instead)

3. CARDIAC ARREST / CODE BLUE RESUSCITATION

Diagnosis Code: 427 (Cardiac Arrest/Dysrhythmia)

Billing Path:
- Primary: G521 ($110.55 first 15 min)
- Add-ons: G523 ($55.20 per 15 min unit for 16–30 min block)
- Subsequent: G522 ($38/unit per 15 min, up to 4 units)
- Procedures: G211 (Intubation $154.10), G212 (Central Line $70.95) — bill separately

Key Rules:
- Intubation/lines are excluded from G521 base fee; bill separately
- Procedures cannot overlap critical care time in most interpretations
- Document explicit start/stop times (e.g., 19:05–20:05)
- Continuous bedside attendance required (leaving stops clock)

4. WRIST FRACTURE WITH REDUCTION

Diagnosis Code: 813 (Fracture of Radius/Ulna)

Billing Path:
- Primary (Night): H122 ($76.95) + F028 ($109.45)
- Premium: E410 (+75% to procedure if 2–8 AM or nights)
- Optional: G370 ($20.25 for hematoma block if not bundled per local policy)

Key Rules:
- H122 is specific night-shift code (not H102)
- E410 premium applies to procedure time, not assessment time
- Example: F028 $109.45 + 1.75 = $191 after E410 premium
- Document exact time of reduction and post-reduction X-ray result

5. MENTAL HEALTH ASSESSMENT WITH FORM 1

Diagnosis Code: 300 (Anxiety/Depression) or appropriate psychiatric diagnosis

Billing Path (Choose One):
- Option A (Safest): K623 ($117.05) alone — for pure Form 1 assessment
- Option B: H102 ($43.05) + K023 ($49.35/unit) + K070 ($31.75) if extensive counseling
- Option C (Long Visit >40 min): H102 + K023 (2 units = $98.70) + K070 = $173.50

Key Rules:
- K623 includes necessary history/exam — avoid double billing with H102
- Cannot bill K623 AND K023 together (incompatible)
- K623 requires signed Form 1 — no signature = no bill
- K070 (Home Care) requires physician-written clinical instruction — non-physician form completion = nil fee
- Must reply to referring doctor to audit-proof H055 consultation claim

6. RESPIRATORY DISTRESS (LIFE-THREATENING CRITICAL CARE)

Diagnosis Code: J96.00 (Acute Respiratory Failure)

Billing Path:
- First 15 min: G521A ($111–112)
- Second 15 min: G523A ($57–58)
- Each additional 15 min (up to 4 units): G522A ($38 each)
- Example: 60 min = G521A + G523A + G522A (2 units) = $239

Key Rules:
- Requires continuous attendance with life-threatening single/multiple organ failure
- Cannot bill standard A-codes for same time block (local policies vary)
- Document explicit start/stop times (e.g., 19:05–20:05)
- List organ failures treated (e.g., “Acute hypoxemia managed with BiPAP”)
- Continuous bedside presence is mandatory
- E415A COVID premium applies only if still active in region

---

# 7. CARDIOVERSION FOR ARRHYTHMIA

Diagnosis Code: 427 (Cardiac Dysrhythmia)

Billing Path (Choose One):

- Option A (Stable, quick): H102 ($43.05) + Z408 ($64.95)
- Option B (Unstable, monitoring): G395 (varies) + Z408
- Add-on (If after midnight): E410 procedure premium (+75%)

Key Rules:

- Cannot bill G521 + Z408 together (Z408 bundled into G521)
- Use G395 + Z408 if patient required stabilization or risk of decompensation
- Use H102 + Z408 if stable and quick procedure
- Document joules delivered and exact time of rhythm change
- E410 applies to Z408 if delivered after midnight

# 8. PALLIATIVE CARE CONSULT FROM PRIMARY CARE

Diagnosis Code: V66 (Convalescence/Palliative Care)

Billing Path (Choose Highest-Paying Option):

|  Strategy | Codes | Fee | Time Trigger  |
| --- | --- | --- | --- |
|  A: Consult (Recommended) | H055 + K070 | $138.55 | 20–40 min  |
|  B: Assess + Counseling | H102 + K023 (1 unit) + K070 | $124.15 | 20–40 min  |
|  C: Long Visit | H102 + K023 (2 units) + K070 | $173.50 | >40 min  |

Key Rules:

- H055 (FRCP/Specialist) = $106.80; H065 (CCFP/GP) = $81.25
- Cannot bill H055 AND K023 together (double-dipping audit trap)
- K070 (Home Care Application) requires physician signature on clinical instruction — form completion alone = $0
- K023 unit = $49.35; can bill up to 2 units if time documented
- Must reply to referring doctor with brief note to audit-proof H055 claim

# 9. EARLY BIRD VISIT (BEFORE 08:00 WEEKDAY)

Diagnosis Code: V68 (Administrative) or patient diagnosis

Billing Path:

- Assessment Codes: A007 or appropriate A-prefix code (varies)
- Premium 1: H960 (Travel Premium — bill once)
- Premium 2: H980 (First Patient Seen)
- Premium 3: H981 (Additional Patients 2–5)

Key Rules:

- Only applies to patients seen before 08:00
- Stop premiums at 08:00 — revert to standard H101/H102 after shift start
- Must document "Called in early at [TIME] by [NAME]" — just showing up early doesn't count
- Travel premium H960 applies only if physician drove in specifically
- No premium stacking after your scheduled shift begins

# 10. NIGHT OWL VISIT (23:00–24:00 WEEKDAY EVENING)

Diagnosis Code: V68 (Administrative) or patient diagnosis

Billing Path:

- Assessment Codes: A007 or appropriate A-prefix code (varies)
- Premium 1: H962 (Travel Premium — bill once for 17:00–24:00 window)
- Premium 2: H984 (First Patient Seen before midnight)
- Premium 3: H985 (Additional Patients before midnight)

Key Rules:

- Applies only to patients seen between 23:00–24:00 (11 PM–midnight)
- At 00:00 (scheduled shift start), stop premiums and A-codes — switch to H122/H102

---

- Must document "Called in at 23:00" — distinct from shift start time
- H962 travel premium billed once per call-in session
- Cannot use H984/H985 after midnight; use standard ER codes instead

## 11. POLYTRAUMA (ADULT, ISS >16)

Diagnosis Code: 959 (Polytrauma/Multiple Injury)

Billing Path:
- Primary: R-codes for each surgical repair
- Premium: E420 (Polytrauma Premium) — applies to services within 24 hours of trauma

Key Rules:
- ISS >16 required to bill E420
- List ISS calculation in note (e.g., "ISS 27 due to Face(3) + Chest(3) + Leg(3)")
- Both surgeons can bill if two specialties operate (each claims R-codes + E420)
- E420 applies within 24 hours of trauma event
- ISS = sum of highest AIS scores for 3 most severely injured body regions

## 12. ANESTHESIA TIME-BASED CODING

Diagnosis Code: 715 (Osteoarthritis) or procedure indication

Billing Path (Example: THR 07:35–10:00 = 145 min):
- Base Units: R440C (10 units)
- Time Units: 20 units
- Age Premium: E007C (1 unit if 70–79 years)
- Total: 31 units

Time Unit Calculation:
- 0–60 min: 1 unit per 15 min = 4 units
- 61–90 min: 2 units per 15 min = 4 units
- 91–145 min: 3 units per 15 min = 12 units
- Total time units: 20

Key Rules:
- Record start time (in OR) and stop time (handover) to the minute
- First hour: 1 unit/15 min
- Next 30 min: 2 units/15 min
- Thereafter: 3 units/15 min
- Age premium E007C adds 1 unit for patients 70–79 years

## 13. CRITICAL CARE (PURE / NO PROCEDURE)

Diagnosis Code: 427.5 (Cardiac Arrest) or appropriate critical code

Billing Path (Example: 09:15–10:30 = 75 min):
- First 15 min: G521 ($110.55)
- Second 15 min: G523 ($55.20)
- Remaining 45 min: G522 (3 units @ $38 each = $114)
- Total: $279.75

Time Breakdown:
- 0–15 min: G521
- 16–30 min: G523
- 31–75 min: G522 (3 units)

Key Rules:
- Intubation, defibrillation, procedures are bundled into G521/G523/G522 — do NOT bill separately
- Do NOT bill for nurse procedures (IV lines)
- Constant attendance excluding all other work required
- Document "leaving room = clock stops"

## 14. CRITICAL CARE + SEPARATE PROCEDURE (TIME CARVED OUT)

Diagnosis Code: 860 (Traumatic Pneumothorax) or trauma code

Billing Path (Example: 09:20–10:40, pause 10:00–10:20 for chest tube):

|  Activity | Duration | Code  |
| --- | --- | --- |

---

|  Activity/itation | Duration | G523 + G523  |
| --- | --- | --- |
|  Chest Tube (Pause) | 20 min | Z341  |
|  Resuscitation Resumed | 20 min | G522 (1–2 units)  |

**Total Coding:**

- Critical Care: 60 min = G521 + G523 + G522 (2 units)
- Procedure: Z341 (Thoracostomy)

**Key Rules:**

- Cannot bill critical care time during the procedure — must pause critical care clock
- Document exact pause time ("Resus suspended 10:00–10:20 for chest tube insertion")
- Carving out procedure time usually pays better than generic time
- Overlapping time = audit trap

## 15. RESIDENT SUPERVISION (BILLING BY STAFF PHYSICIAN)

Diagnosis Code: 813 (Radius Fracture) or procedure indication

**Billing Rules by Trainee Rank:**

|  Scenario | Resident (PGY) | Fellow | Billable?  |
| --- | --- | --- | --- |
|  On-site supervision | Required | — | YES  |
|  Phone/home (Resident) | Not allowed | — | NO  |
|  Phone/home (Fellow) | — | "Immediately available" | YES  |

**Billing Path:**

- Procedure Code: F-codes (e.g., F028 for fracture reduction)
- Billed by: Staff physician
- Supervision Documentation: "Resident performed under direct supervision" or "Fellow performed under my immediate availability"

**Key Rules:**

- Residents: staff must be physically present in building
- Fellows: staff can be off-site but immediately available
- If resident performs without on-site staff: not billable
- Document trainee rank clearly

## CODING PRIORITY RULES (FOR RAG DECISION TREE)

1. Measure wounds/injuries first.
2. Check time stamps (early, night, after-hours).
3. Identify critical vs routine (G521+ vs H/A codes).
4. Separate procedures from time (pause for procedures).
5. Check trainee rank (Resident vs Fellow).
6. Avoid double-billing (H055 vs K023; K623 vs H102; G521 vs Z408).
7. Document everything (times, measurements, signatures, ISS, orders).
8. Verify premiums (E410, E420, H960/H980/H981, H962/H984/H985).

## AUDIT TRAPS TO AVOID

|  Trap | Consequence | Prevention  |
| --- | --- | --- |
|  No bridge order documentation for H105 | Audit denial | Explicit bridge orders in chart  |
|  Approximate wound size | Fee loss | Precise measurement  |
|  No critical care times | G521+ not defensible | Record clock times  |

---

|  H055 without referrer reply | Denied Consequence | Send brief reply Prevention  |
| --- | --- | --- |
|  K070 done only by nurse | Nil fee | MD clinical instruction + signature  |
|  Overlapping critical + procedure time | Overpayment | Document pause  |
|  K623 + K023 | Double-dip | Choose one path  |
|  Resident unsupervised | Denied | On-site staff  |
|  No ISS for polytrauma | E420 denied | Document ISS  |
|  A-codes after shift start | Overpayment | Switch to H-codes  |

# GLOSSARY FOR RAG AGENT

- H-codes: ER assessment/procedure
- A-codes: Consult/visit (often pre-shift)
- G-codes: Critical care time
- Z-codes: Procedures
- F-codes: Fracture reductions
- R-codes: Surgery/anesthesia
- K-codes: Psych/palliation/counseling
- E-codes: Premiums
- ISS: Injury Severity Score
- AIS: Abbreviated Injury Scale
- ROSC: Return of Spontaneous Circulation
- BiPAP: Bilevel Positive Airway Pressure
- PGY: Postgraduate year
- FRCP / CCFP: Specialist/GP certifications


