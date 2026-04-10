---
name: met-talking-points-pdf
description: "Generate a professionally formatted, downloadable PDF of MET/IEP meeting talking points for a school psychologist. Use this skill whenever the user asks for meeting talking points, a talking points PDF, a parent-friendly meeting summary, or a NotebookLM prompt for a student evaluation. Always use this skill when the user has a completed MET report and wants to prepare for a team meeting. Covers all eligibility categories including SLD, OHI, EI, CI, ASD, and SLI. The output is a two-part PDF: (1) structured meeting talking points with a strengths-first opening, plain-language cognitive explanations, behavioral and adaptive functioning sections when relevant, eligibility reasoning, and anticipated parent questions; and (2) a ready-to-paste NotebookLM prompt for generating a podcast or video overview of the evaluation."
---

# MET Talking Points PDF Skill

## Purpose
Generate a downloadable PDF containing:
1. Meeting talking points structured for the evaluator to present findings clearly to parents and teachers
2. A NotebookLM prompt for generating a podcast or video overview of the evaluation

## What the User Will Provide
- A completed MET report (attached PDF or pasted text)
- Student name, grade, school, and report date (pull from report if present)
- Pronouns (ask if not clear from report)

## Critical Rules — Apply Before Writing Anything

### Score Accuracy — Non-Negotiable in Both Directions
- A standard score of 85–115 is Average. A score of 80–89 is Low Average.
- **Never** describe a score below 100 as bright, strong, capable, or above average.
- **Never** soften or inflate what a percentile rank means. The 18th percentile means the student scored higher than 18 out of 100 peers — not "close to average" or "nearly typical."
- Low Average is the lower end of the normal range. It is not a strength. It is not a deficit. State it accurately.
- Never call a Low Average FSIQ "really bright" or "capable." These are factually inaccurate.
- Score accuracy applies to all output — talking points, NotebookLM prompt, and any narrative text.

### Voice Rules
- No em dashes
- No X/Y contrast constructions in any form
- No generic wrap-up sentences
- No AI editorializing
- Plain, direct, parent-friendly language throughout

---

## PDF Structure

### PART 1: MEETING TALKING POINTS

#### Section 1 — Start Here: Student Strengths
**Always lead with strengths. This is not optional and not softening.**

Pull strengths from anywhere in the report:
- Attendance record — consistent attendance is a documented strength worth naming
- Teacher comments describing positive qualities (cooperative, courteous, engaged)
- Cognitive scores in the Average range or above
- Academic scores that are relative strengths within the profile
- Behavioral observations showing appropriate functioning
- Grade improvements or positive trends
- Any documented ability to engage when supported

If the report contains limited documented strengths, infer what must be present for the student to be functioning at their current level. For example: a student earning passing grades with a Low Average cognitive profile has persistence and some degree of engagement that is worth naming. A student with perfect attendance is showing up — that matters.

Present each strength as a bolded label followed by a specific grounding sentence from the data.

#### Section 2 — Why We Are Here
One brief paragraph: who was referred, by whom, when, and for what purpose.

#### Section 3 — What the Evaluation Found

**Cognitive Functioning subsection:**
- Open with a plain-language statement of overall cognitive functioning and FSIQ with percentile
- Present a clean score table (Area | Standard Score | Percentile | Range)
- For each cognitive area measured, provide THREE components:
  1. **What this measures** — plain-language explanation, no jargon. Translate CHC labels (Gf, Gc, Gsm, etc.) into what the ability actually is in everyday terms.
  2. **What this score means for this student** — specific to this student's actual score and how it shows up at school. Concrete, not generic.
  3. Where relevant, name what helps and what makes it harder.
- End with an overall pattern paragraph connecting the scores to the student's school experience.

**Academic Achievement subsection:**
- Brief score summary with classification for each area
- Note relative strengths and areas of concern
- Connect to classroom performance where data support it

**Behavioral and Social-Emotional Functioning subsection — include when behavioral data is present:**

This section is essential for EI, OHI with attention/behavioral components, ASD, and any student whose behavior is a primary driver of educational impact. Do not omit or minimize behavioral findings when they are central to the profile.

- State what rating scales were administered, who completed them, and what the results showed — plainly and specifically
- Describe the behavioral pattern in concrete terms: what the student does, how often, in what settings, and what triggers it
- For students whose frustration responses, emotional dysregulation, or refusal behaviors are blocking access to learning, state that plainly and specifically. Do not soften with clinical framing before stating the behavioral reality. Example: "When tasks feel difficult or unfamiliar, [student] shuts down, refuses to attempt the work, and becomes dysregulated to the degree that instruction stops." That is the kind of plain statement the team needs.
- Describe what conditions help the student regulate and engage — specific, not generic
- Address cross-rater consistency or discrepancies (home vs. school patterns)
- Connect the behavioral profile directly to academic impact: how does this student's behavioral pattern interfere with access to instruction, completion of work, and learning new material?
- For EI profiles: describe the pattern across time, settings, and raters — the team needs to understand this is not situational
- For ASD profiles: describe social communication patterns, rigidity, sensory sensitivities, and how these affect classroom participation
- For OHI profiles with ADHD: describe attention, impulsivity, and activity level in specific observable terms

**Adaptive Behavior subsection — include when Vineland-3 or DP-4 data is present:**

Adaptive behavior findings matter most for CI, ASD, and students in significantly supported programs. For these students, adaptive functioning often tells the story of what the student can and cannot do independently in the real world — and that picture is as important as cognitive and academic scores.

- State who completed the form(s) and when
- Report composite and domain scores with plain-language translations:
  - Communication domain: how the student uses language to get needs met, follow directions, and interact — at home and at school
  - Daily Living Skills: what the student can do independently in self-care, safety, and functional routines
  - Socialization: how the student initiates and responds in peer and adult interactions
- Describe item-level patterns: what the student can do independently, what requires prompting, what is not yet present
- Flag estimated response validity issues if present (25%+ estimated responses in a subdomain must be noted)
- Connect adaptive findings to educational programming: what does this profile mean for IEP goals, level of support needed, and post-secondary planning for older students?

**Communication subsection — include when SLP data or communication concerns are present:**

- Describe receptive and expressive language findings in plain language
- Explain what the student understands versus what they can express
- Connect communication profile to classroom demands: following directions, participating in discussion, accessing written language, expressing needs
- For ASD profiles: describe pragmatic language specifically — how the student uses language socially, not just structurally
- Note how communication strengths and weaknesses interact with behavioral patterns when relevant (e.g., a student who cannot express frustration verbally and therefore escalates behaviorally)

#### Section 4 — The Eligibility Decision

**Adapt this section based on the eligibility category or categories under consideration.**

For each category:
- State in plain language what the category requires
- State plainly whether criteria were or were not met and why
- Do not soften an ineligibility finding — state it directly and explain the reasoning
- Do not overstate an eligibility finding — state what the data support and stop there

**Category-specific framing:**

*SLD:* Explain the pattern of strengths and weaknesses requirement in plain terms. If ineligible, explain why the scores do not show the required discrepancy or processing deficit. If eligible, name the specific academic areas where SLD criteria were met.

*EI:* Explain that EI requires behavioral problems in the affective domain over an extended period of time across settings. Name the specific behavioral characteristics that are documented. Be direct about adverse educational impact — describe what the behavior actually prevents the student from doing at school.

*OHI:* Name the diagnosed condition(s) and explain how limited alertness, strength, or vitality are interfering with educational performance. Connect physician documentation to the evaluation findings.

*CI:* State the cognitive scores relative to the 2 SD below mean threshold. State the academic scores relative to the lowest 6th percentile criterion. Address adaptive behavior. All three components must be addressed.

*ASD:* Address all three domains — social interaction, communication, and restricted/repetitive behaviors. Describe specifically what the evaluation found in each area. Do not generalize.

*SLI:* State the specific communication disorder identified, the standardized measures used, and how the disorder adversely affects educational performance.

For all categories: end with one plain sentence stating the team's determination and one sentence noting what supports are recommended regardless of eligibility outcome.

#### Section 5 — What This Student Needs Going Forward
Two subsections:
- **Already in place** — list current RTI, 504, or IEP supports
- **Additional supports tied to the profile** — each item bolded with a brief plain-language explanation of why this student specifically needs it based on the data

For students with behavioral profiles, supports must address the behavioral pattern directly — not just academic accommodations. Include:
- Specific regulation supports (what helps this student when frustration builds)
- Environmental supports (what conditions reduce the likelihood of dysregulation)
- Instructional supports that reduce the trigger conditions (e.g., breaking tasks into small steps to reduce perceived difficulty for a student who refuses when overwhelmed)
- Communication supports when relevant
- Counseling or social-emotional supports when the data support them
- For ASD students: sensory, social, and communication supports specifically named

For students with adaptive behavior deficits, supports must address functional skill development and independence — not just academic access.

#### Section 6 — Questions the Family May Ask
2–4 anticipated questions with direct, honest answers grounded in the report data.

Common questions to anticipate for cognitive/academic profiles:
- Why doesn't he/she qualify if he/she is struggling?
- What about outside testing that showed different results?
- What happens if things get harder next year?
- What can we do at home to help?

Additional questions to anticipate for behavioral/EI/ASD profiles:
- Is this a behavior problem or a disability?
- Why does he/she act this way — is it on purpose?
- What should we do at home when this happens?
- Will this get better?
- Why can't he/she just try harder?

Answer all questions directly and honestly. Do not hedge. Do not give generic answers. Ground every answer in the specific data from this student's report.

---

### PART 2: NOTEBOOKLM PROMPT

Include a ready-to-paste NotebookLM prompt at the end of the PDF under a clear divider with the heading "NotebookLM Prompt — Podcast / Video Overview."

The prompt must include:
1. Instruction to use only the uploaded MET report as the source
2. **Critical scoring rules block** — explicitly prohibit score inflation and softening. State that Low Average means Low Average, that percentile ranks must be stated plainly, and that calling an FSIQ below 90 "bright" or "really capable" is factually inaccurate.
3. Structure for the podcast/video:
   - Begin with student strengths
   - Explain cognitive areas in plain language (no CHC abbreviations)
   - Describe academic scores accurately
   - When behavioral data is present: describe the behavioral pattern plainly — what the student does, what triggers it, how it affects access to learning. Do not soften serious behavioral concerns or attribute everything to a clinical explanation before stating what the behavior actually looks like.
   - When adaptive behavior data is present: explain what the student can and cannot do independently in communication, daily living, and social skills
   - When communication data is present: explain what the student understands versus what they can express, and how this affects classroom participation
   - Explain eligibility decision clearly and by category
   - Cover supports in place and recommended — include behavioral supports when relevant
   - Close with what the family should watch for and what to do if concerns increase
4. Tone instruction: direct, honest, parent-friendly; no jargon without plain-language explanation; behavioral concerns stated plainly before clinical explanation is offered

---

## PDF Formatting Requirements

Use reportlab to generate the PDF with these specifications:

**Colors:**
- Header/title: HexColor('#1a1a2e') — dark navy
- Body text: HexColor('#222222')
- Notes/italic callouts: HexColor('#555555')
- Table header background: HexColor('#1a1a2e') with white text
- Alternating table rows: white and HexColor('#f5f5f5')
- Strength rows in score tables: HexColor('#e8f0e8') — light green

**Typography:**
- Title: Helvetica-Bold, 15pt
- Subtitle (student/date): Helvetica, 10pt, gray
- Section headers: Helvetica-Bold, 11pt
- Subsection headers: Helvetica-Bold, 10pt
- Body: Helvetica, 10pt, leading 15
- Bullet text: Helvetica, 10pt, leftIndent 16
- Notes/italic: Helvetica-Oblique, 9pt

**Layout:**
- Margins: 0.9 inch all sides
- Section dividers: HRFlowable, 0.5pt gray between sections, 1.5pt navy after title
- Score table column widths: ~2.8in for label, 0.8in score, 1.0in percentile, 1.2in range
- Table cell padding: 5pt top and bottom, 8pt left on label column
- Grid: 0.5pt HexColor('#cccccc')

**Footer:**
- Final line: italic, gray, 9pt
- Content: "Evaluator: [name] | [district] | Confidential"

**File naming:**
`[StudentLastName]_[StudentFirstName]_MET_Talking_Points.pdf`

---

## Workflow

1. Read the attached MET report
2. Extract: student name, grade, school, report date, evaluator name, eligibility category/categories, all scores (cognitive, academic, behavioral rating scales, adaptive behavior, communication), teacher observations, parent input, eligibility determination, supports in place
3. Determine which sections are relevant based on the eligibility category and data present:
   - Cognitive and academic: always include
   - Behavioral/social-emotional: include whenever behavioral rating scale data, EI, OHI, or ASD are present, or when teacher input describes behavioral patterns affecting learning
   - Adaptive behavior: include whenever Vineland-3 or DP-4 data is present, or when CI, ASD, or significantly supported placement is involved
   - Communication: include whenever SLP data is present or communication concerns are documented
4. Identify student strengths from all sections of the report
5. Write the talking points content following the structure above, including only the sections relevant to this student's profile
6. Write the NotebookLM prompt
7. Generate the PDF using reportlab
8. Save to `/mnt/user-data/outputs/` and present to user

If pronouns are not clear from the report, ask before generating.
If evaluator name is not present in the report, use a placeholder and note it.

---

## What Good Output Looks Like

- Strengths section is specific and grounded — not generic praise
- Each cognitive area has a plain-language explanation a parent can understand
- Scores are stated accurately — Low Average is described as the lower end of typical, not softened or inflated
- Behavioral findings are stated plainly — what the student does, not just a category label
- Behavioral impact on learning is named specifically — what this student cannot access because of behavioral patterns
- Adaptive behavior findings describe what the student can and cannot do independently in functional terms
- Communication findings explain what the student understands versus what they can express
- Eligibility reasoning is clear, direct, and category-specific
- Parent questions are answered honestly without hedging — including hard questions about behavior
- Supports address the full profile — not just academic accommodations
- NotebookLM prompt contains explicit anti-inflation rules and explicit anti-softening rules for behavioral content
- PDF is visually clean, professionally formatted, and downloadable

## What to Avoid

- Calling any score below 100 bright, strong, or above average
- Describing Low Average as "nearly average" or "approaching typical"
- Softening behavioral findings with clinical framing before stating what the behavior actually looks like
- Reducing a serious behavioral pattern to a category label — "dysregulation" is not a description of a student shutting down and refusing to attempt any task perceived as difficult
- Softening an ineligibility finding with excessive balance language
- Generic strengths not tied to the specific student's data
- CHC abbreviations (Gf, Gc, Gsm) without plain-language translation
- Adaptive behavior findings described in score terms only — translate into what the student actually does
- Em dashes
- AI wrap-up sentences
- Score inventories in narrative paragraphs
- Omitting behavioral, adaptive, or communication sections when the data are present and central to the profile