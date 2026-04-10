---
name: redundancy-pass
description: "Remove redundant restatements from a fully assembled MET report. Use this skill whenever Lisa types \"/redundancy-pass\", \"redundancy pass\", \"clean up the report\", or \"assemble and clean\". Paste the full assembled report and this skill will identify and strip content that has already been stated in full in an earlier section. Does NOT rewrite — only cuts. Output is the cleaned report plus a brief log of what was removed and where."
---

# Redundancy Pass Skill

## What This Skill Does

A MET report is written section by section. Each section does its job correctly in isolation. The problem is that later sections — especially the Summary — restate things that were already said in full earlier. This skill reads the full assembled report and removes those restatements.

This skill does NOT rewrite. It does NOT change clinical content, voice, scores, or wording. It cuts. Only cuts.

## What Counts as Redundancy

### Primary targets:

**1. Summary re-explanation**
The Summary should weave and connect findings — not re-explain them. Strip from the Summary:
- Restatements of scores already reported in full in cognitive or academic sections
- Behavioral descriptions already stated in full in the Testing Behavior or Background sections
- Sentences that re-describe what a test measures or what a cognitive ability is
- Any sentence that a reader could find nearly verbatim in an earlier section

The Summary is allowed to:
- Reference findings by name ("Johnny's processing speed weakness")
- Connect findings to each other and to eligibility
- State the overall pattern that no single section captured on its own
- Make the eligibility argument

**2. Testing behavior content restated in later sections**
If a behavioral observation (e.g., frustration response, need for breaks, response style, effort rating) was described in full in the Testing Behavior / Evaluation Results section, do not restate it in the cognitive, academic, or behavioral sections. A brief reference is acceptable. Full restatement is not.

**3. Background details restated in later sections**
If a student's attendance history, prior school history, or prior evaluation findings were stated in full in the Educational History or Background section, do not restate them in full in the Summary. Reference only.

### What is NOT redundancy:

- A brief reference to a finding for context ("Given his processing speed weakness...") — this is connection, not restatement
- Eligibility language in the Summary that names findings — that is the Summary's job
- Scores appearing in a score table AND in narrative — tables and narrative serve different readers
- Classroom meaning stated in a section AND connected to eligibility in the Summary — these are different functions

---

## How to Run This Pass

### Step 1 — Map the report
Read the full assembled report. Identify which sections are present. Note where key findings were first stated in full:
- Where was testing behavior first described?
- Where were cognitive scores first reported in narrative?
- Where were academic scores first reported in narrative?
- Where was behavioral/attention data first described in full?
- Where was background/history first stated?

### Step 2 — Flag redundancies
Go section by section. Mark any sentence or passage that:
- Restates in full something already stated in full in an earlier section
- Re-explains what a test or ability is (if already explained earlier)
- Describes testing behavior that was already covered

### Step 3 — Cut
Remove flagged content. Do not replace it with anything. If cutting leaves a paragraph that no longer connects, remove the orphaned transition sentence too. Do not smooth over the cut with new writing.

### Step 4 — Deliver output in two parts

**Part 1: Cleaned Report**
The full report with redundancy removed. Clearly marked with student name and "Redundancy Pass Complete" at the top.

**Part 2: Cut Log**
A brief list of what was removed, section by section. Format:

SUMMARY — Removed: [brief description of what was cut, e.g., "restatement of processing speed score and classroom impact already covered in Cognitive section"]
COGNITIVE — Removed: [e.g., "restatement of testing behavior from Evaluation Results section"]

The cut log should be short — one line per cut is enough. Its purpose is to let Lisa review what was removed and restore anything that was cut incorrectly.

---

## Hard Rules

- Do NOT rewrite any sentence that stays in the report. If it stays, it stays as written.
- Do NOT add transition language to cover cuts. Cut and stop.
- Do NOT make judgment calls about clinical content. If a passage has unique clinical content not stated elsewhere, it stays even if it feels repetitive.
- Do NOT touch the eligibility statement or recommendations.
- If uncertain whether something is redundant, leave it in and note it in the cut log as "flagged but retained — verify."
- Preserve all direct quotes from teachers, parents, and students exactly as written.

---

## Trigger Phrases

- `/redundancy-pass`
- "redundancy pass"
- "clean up the report"
- "assemble and clean"
- "strip the redundancy"
- "pull it together and clean it up"