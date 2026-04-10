---
name: intake-hub
description: "MET intake hub for setting up new student evaluation records and adding section data. Use this skill whenever Lisa types \"intake form\", \"input form\", or \"adding section data\". This skill runs a conversational intake process to gather student information, then generates a ready-to-paste prompt for a student-named chat in the MET Reports Project. Covers both new student setup and section data prompts. Always use this skill at the start of any new student or section data workflow — do not attempt intake from memory without reading this skill first."
---

# MET Intake Hub Skill

This skill powers the intake hub chat. Its job is simple: ask Lisa questions conversationally, then generate a clean, ready-to-paste prompt for a student-named chat in the MET Reports Project.

## What this chat is for

This chat is Lisa's **launching pad only**. It does not write MET sections. It does not store data between sessions. Each time Lisa runs intake, the output is a self-contained prompt she copies into a separate student chat. Section work happens in those student chats, not here.

---

## Triggers

Run this skill when Lisa types any of:
- `intake form`
- `input form`
- `adding section data`
- `add section data`
- `new student`
- `update [student name] intake`

---

## Two modes

### MODE 1: New Student Setup

Ask questions in this order. Use `ask_user_input_v0` for bounded choices. Use prose questions for open-ended items. **Never ask more than 2-3 questions at once.**

**Step 1 — Evaluation type + eligibility**
- Evaluation type: Initial / Reevaluation (single select)
- Eligibility categories: SLD, OHI, EI, ASD, CI, SLI (multi-select)

Then ask in prose: *"What's the student's name, grade, school, and date of birth?"*

**Step 2 — Purpose + sections**
- Evaluation purpose: Determine eligibility / Update present levels / Inform IEP development / Guide transition planning (multi-select)
- Sections needed (multi-select): Reason for Referral, Educational History, Review of Previous Evaluations, Parent Input, Teacher Input, Student Input, Classroom Observation, Cognitive Functioning, Academic Achievement, Social-Emotional/Behavioral, Adaptive Behavior, Communication (SLP), Summary and Recommendations, Eligibility Appendix, PLAAFP Appendix

Then ask in prose: *"What are the specific concerns driving this evaluation? And what is the student's current placement and services?"*

**Step 3 — Transition + pronouns (if not already clear)**
- Transition language needed? (single select: Yes / No)
- If self-contained or 11th/12th grade, default to Yes and confirm
- Ask pronouns only if not obvious from the name or prior context

**Step 4 — Generate prompt**

Show the prompt in a clearly labeled block. Do not generate until all questions are answered. Tell Lisa to copy it into a new chat named after the student.

---

### MODE 2: Adding Section Data

Ask:
- Which student? (if multiple active, list them; otherwise ask in prose)
- Which section? (single select from sections list)

Then ask what data she has. Depending on the section:

| Section | Ask for |
|---|---|
| Reason for Referral / Reason for Evaluation | REED language or document |
| Educational History | Records available, years covered, attendance, discipline, NWEA/MSTEP/PSAT data |
| Review of Previous Evaluations | Documents available — list what she has or note what is missing |
| Parent Input | How obtained (form/interview/phone), date, parent name and relationship, responses |
| Teacher Input | Teacher name, subject, date, responses |
| Student Input | Interview date, notes or transcript |
| Classroom Observation | Date, time, setting, subject, notes |
| Cognitive Functioning | Tests administered, framework (CHC or composite/index), scores, testing behavior notes |
| Academic Achievement | Test administered, scores, error pattern notes |
| Social-Emotional/Behavioral | Instruments, raters, dates, scores |
| Adaptive Behavior | Instrument, raters, scores, item-level notes, rater accuracy concerns |
| Summary and Recommendations | Ask if interpretive analysis is ready or if she wants to build from raw data |

Then generate the section data prompt. Show it before copying. Do not write the section — that happens in the student chat.

---

## Prompt format — New Student

```
NEW STUDENT: [First Last]
Grade: [X] | DOB: [date] | Age: [X] | Pronouns: [she/he/they]
School: [school name]
Evaluation type: [Initial / Reevaluation]
Eligibility areas: [list]
Evaluation purpose: [list]
Transition language: [Yes — reason / Not needed]

Current placement/services: [description]

Concerns:
[2-4 sentences describing what is driving this evaluation, in plain language]

SECTIONS NEEDED:
[bulleted list of sections]
[Note: sections NOT needed and who will complete them, if applicable]

---
I will provide data for each section separately as it becomes available. Do not generate any section yet. Wait for me to tell you which section I am ready to work on and to provide the data. Use Strict Mode unless I say Interpretive Mode.
```

---

## Prompt format — Section Data

```
ADDING SECTION DATA: [First Last]
[One-line student summary: grade, school, eval type, placement]

SECTION TO WRITE: [Section Name]

[Data block — organized and labeled. Include:]
- Source documents and what they contain
- Data provided (scores, quotes, responses, notes)
- Any student-specific flags (e.g., sparse records, outside eval, hospitalization history, behavior notes)
- Instructions for the student chat (e.g., "read the skill before writing", "wait for confirmation before generating", "background use only")

Use Strict Mode unless otherwise specified.
```

---

## Key rules

- **Never generate section content in this chat.** This chat generates prompts only.
- **Always show the prompt before telling Lisa to copy it.** Do not skip the review step.
- **Do not infer missing data.** If Lisa has not provided something, ask or note it as unknown.
- **Behavioral history requires full severity.** If the student has hospitalizations, suspensions, or a serious behavioral record, flag that plainly in the concerns block. Do not soften.
- **REED-based reevaluations:** When the REED indicates no new eligibility determination is needed (present levels only), note this explicitly in the prompt so the student chat knows this is not an eligibility evaluation.
- **Score accuracy:** If Lisa mentions scores or test data during intake, do not characterize them — just record them. Interpretation happens in the student chat.
- **Section data prompts for Student Input:** Remind Lisa to use her own Student Input prompt (the LISA MET – STUDENT INPUT STRICT SOURCE-VOICE MODE prompt) with the transcript attached, and note the behavioral observations paragraph separately.

---

## Edge cases

**"Update [student] intake"** — Ask what needs to change. Regenerate only the affected portion of the prompt, or regenerate the full prompt with the change incorporated. Show before copying.

**Multiple active students** — When Lisa says "adding section data" without naming a student, ask which student first.

**Sparse records** — Note explicitly in the prompt that records are sparse and instruct the student chat to report only what is documented.

**Outside evaluations (ABA plans, hospital discharge, private psych evals)** — Include in Review of Previous Evaluations data block as clinical history. Flag as outside evaluation, not school-based.

**Focused reevaluations (one or two sections only)** — Note in the prompt which sections are NOT needed and instruct the student chat not to generate anything else.