---
name: mistar-met-populate
description: "Populate all MiStar MET form fields from a completed MET report attached to the message. Replaces the standalone mistar-template-scores skill. Extracts and formats: (1) EDUCATIONAL section — report card grades as continuous strand + 2-sentence teacher input summary; (2) PSYCHOLOGICAL section — all test score continuous strand; (3) OBSERVATION section — 2-sentence classroom observation summary. Trigger whenever the user invokes /mistar, 'mistar form', 'populate mistar', or 'MiStar fields'. Always reads the attached MET report before generating any output."
---

# MiStar MET Form Population Skill

## Purpose

Generate paste-ready text for all MiStar MET form fields from a completed MET report. Output is organized by MiStar section so Lisa can paste directly into the correct fields without searching.

This skill replaces the standalone `mistar-template-scores` skill. It does everything that skill did (scores + grades strand) and adds brief teacher input and observation summaries.

---

## Step 1: Read the Attached MET Report

The user will attach a completed MET report (.docx) to the message that invokes this skill.

Read the attached file immediately using the bash tool:

```bash
pandoc /mnt/user-data/uploads/[filename].docx -t plain 2>/dev/null
```

If the file is already visible as text in the context window (e.g., the project sample files), read it directly from context.

If the file fails to open with pandoc, try:
```bash
python3 -c "
import subprocess
result = subprocess.run(['python3', '-m', 'docx2txt', '/mnt/user-data/uploads/[filename].docx'], capture_output=True, text=True)
print(result.stdout)
"
```

Do not generate any output until the file has been successfully read.

---

## Step 2: Locate and Extract the Required Sections

Scan the full report text and locate these sections by heading:

| What to find | Section heading to look for |
|---|---|
| Report card grades | "Current Grades", "Report Card", "Educational History" (grades table or grades list within) |
| Teacher input | "Teacher Input", "Teacher Questionnaire", "Teacher Report" |
| Test score tables | Any table containing "Standard Score", "Scaled Score", "Percentile Rank", preceded by a battery name (WISC-V, WAIS-V, WIAT-4, KTEA-3, WJ-IV, WRAT-5, CTOPP-2, CTONI-2, Vineland-3, BASC-3, Conners-4, CELF-5, BRIEF-2, DP-4, etc.) |
| Classroom observation | "Classroom Observation", "Direct Observation", "School Social Worker Classroom Observation" |

---

## Step 3: Generate Output

Produce four clearly labeled blocks of output. Lisa will paste each block into the corresponding MiStar field.

Do not add introductory text, explanations, or transitions between blocks. Just the label and the content.

---

### BLOCK 1 — EDUCATIONAL: Report Card Grades

Format as a single continuous text strand, no line breaks:

```
Current Grades ([Grading Period], [School Year]): [Subject]: [Grade]; [Subject]: [Grade]; [Subject]: [Grade].
```

**Rules:**
- Pull the most recent grading period available. Label it exactly as it appears in the report (Q1, Q2, Semester 1, Trimester 2, etc.)
- Include the school year if shown
- List all subjects in the order they appear
- Use the grade exactly as shown — letter grades, percentages, or pass/fail — do not convert or interpret
- If a grade is missing or blank for a subject, write: [Subject]: N/A
- One continuous line of plain text, no line breaks, no headers, no interpretation

**Example:**
```
Current Grades (Q2, 2024–2025): English 10: C+; Algebra II: D; Biology: B-; World History: C; Spanish II: B; PE: A; Study Skills: P.
```

---

### BLOCK 2 — EDUCATIONAL: Teacher Input Summary

Two sentences maximum. Plain prose. No bullet points.

**What to capture:**
- Sentence 1: The teacher's primary academic concerns — what subject areas or skills are most affected, in plain terms
- Sentence 2: Any behavioral, organizational, or attentional concerns the teacher noted, OR a second academic concern if behavioral concerns were absent

**Rules:**
- Pull directly from the Teacher Input section. Do not invent or infer.
- Do not soften concerns. If the teacher flagged serious difficulty, state it as serious.
- No clinical framing. No interpretation. This is the teacher's report, compressed.
- No em dashes. No contrast constructions ("not X, but Y").
- No generic wrap-up sentence.
- If the report includes multiple teacher respondents, combine into two sentences covering the dominant themes.

**Example:**
```
[Teacher] reports [Student] demonstrates significant difficulty with reading comprehension and written expression, requiring frequent redirection and extended time to complete assignments. Organizational challenges and inconsistent homework completion are ongoing concerns.
```

---

### BLOCK 3 — PSYCHOLOGICAL: Test Scores (Continuous Strand)

One continuous strand per battery. Composites listed as a separate labeled block after the subtest strand for the same battery. Batteries separated by periods.

**Format:**
```
[Battery Name]: [Subtest] SS=[score], %ile=[number]; [Subtest] SS=[score], %ile=[number]. [Battery Name] Composites: [Composite] SS=[score], %ile=[number]; [Composite] SS=[score], %ile=[number].
```

**Rules:**
- Include every subtest and composite that has both a standard score (or scaled score) and a percentile rank reported in the MET
- Scaled scores (subtests with mean=10) are reported as SS= just like standard scores — do not label them differently
- Do NOT add "th", "st", "nd", "rd" suffixes to percentile numbers (19, not 19th)
- Drop the Classification column entirely
- No interpretation, no clinical language, no headers
- One continuous line per battery block, then composites block, then next battery
- If a score table appears in the report but subtests are missing percentiles, include only what is present — do not estimate or omit the battery entirely

**Adaptive behavior scales (Vineland-3):**
- Report domain scores and the Adaptive Behavior Composite
- Format: `Vineland-3 (Parent): Communication SS=[score], %ile=[number]; Daily Living Skills SS=[score], %ile=[number]; Socialization SS=[score], %ile=[number]. Vineland-3 Composite: Adaptive Behavior Composite SS=[score], %ile=[number].`
- If two raters are present, label each separately (Parent, Teacher)

**Behavior rating scales (BASC-3, Conners-4, BRIEF-2):**
- Report T-scores as SS= (MiStar does not distinguish T-score from standard score in this field — use SS= consistently)
- Label the rater in the battery name: `BASC-3 (Parent):`, `BASC-3 (Teacher):`, `Conners-4 (Self):`

**Example:**
```
WISC-V: Similarities SS=9, %ile=37; Vocabulary SS=10, %ile=50; Block Design SS=8, %ile=25; Matrix Reasoning SS=7, %ile=16; Digit Span SS=9, %ile=37; Coding SS=10, %ile=50; Symbol Search SS=9, %ile=37. WISC-V Composites: Verbal Comprehension SS=97, %ile=42; Visual Spatial SS=88, %ile=21; Fluid Reasoning SS=82, %ile=12; Working Memory SS=94, %ile=34; Processing Speed SS=95, %ile=37; Full Scale IQ SS=89, %ile=23. WIAT-4: Word Reading SS=96, %ile=39; Reading Comprehension SS=78, %ile=7; Pseudoword Decoding SS=103, %ile=58; Oral Reading Fluency SS=107, %ile=68; Numerical Operations SS=86, %ile=18; Math Problem Solving SS=80, %ile=9; Sentence Composition SS=91, %ile=27; Essay Composition SS=95, %ile=37. WIAT-4 Composites: Reading SS=88, %ile=21; Mathematics SS=81, %ile=10; Written Expression SS=92, %ile=30.
```

---

### BLOCK 4 — OBSERVATION: Classroom Observation Summary

Two sentences maximum. Plain prose. No bullet points.

**What to capture:**
- Sentence 1: Setting, activity observed, and the student's general engagement or on-task behavior — stated in concrete behavioral terms
- Sentence 2: Any specific behavior, interaction pattern, or notable observation (positive or concerning) that directly connects to the referral question

**Rules:**
- Pull directly from the Classroom Observation section. Do not invent or infer.
- Use behavioral, observable language — what the student was doing, not what it means
- No interpretation, no clinical framing, no eligibility language
- No em dashes. No contrast constructions.
- No generic closing sentence.
- Include the date and observer role if present in the report (e.g., "School Social Worker, 2/4/26")
- If no classroom observation is present in the report, output: `No classroom observation documented in this evaluation.`

**Example:**
```
[Observer role], [date]: [Student] was observed in [class/setting] during [activity]; [he/she/they] remained on task for the majority of the observation period, with [specific behavior noted]. [One additional concrete behavioral detail directly relevant to referral concern].
```

---

## Output Template

Produce output in this exact format — no preamble, no explanation:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISTAR — EDUCATIONAL SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REPORT CARD GRADES
[Grades continuous strand]

TEACHER INPUT SUMMARY
[2 sentences]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISTAR — PSYCHOLOGICAL SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST SCORES
[Continuous strand — all batteries]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MISTAR — OBSERVATION SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLASSROOM OBSERVATION
[2 sentences]
```

---

## Error Handling

**If no MET report is attached:**
Stop. Output only: `No MET report attached. Please attach the completed MET report and reinvoke this skill.`

**If a section is missing from the report:**
- Missing grades → output: `Current Grades: Not documented in this evaluation.`
- Missing teacher input → output: `Teacher Input: No teacher questionnaire data documented.`
- Missing test scores → output: `Test Scores: No standardized score tables found in this evaluation.`
- Missing observation → output: `No classroom observation documented in this evaluation.`

Do not fabricate, estimate, or fill in from general knowledge.

---

## Accuracy Rules (Non-Negotiable)

These rules apply to scores and descriptions equally:

- Do not inflate or deflate. Copy scores exactly as they appear in the report. No rounding, no adjustment.
- Do not add classification language (Average, Below Average, etc.) to any field.
- Do not summarize teacher or observation content with clinical language that was not used in the report.
- If a score appears in the report but no percentile is given, include the score and write %ile=NR (not reported).
- Bidirectional accuracy: a score of 86 is not "nearly average." A score of 114 is not "quite high." Reproduce what is there.