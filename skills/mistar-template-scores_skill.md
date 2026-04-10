---
name: mistar-template-scores
description: "Convert score tables to MiStar-ready continuous strand format. Plain text output with semicolon separators, no interpretation or classification. Also formats current report card grades from the Student Profile sheet."
---

When given raw score data from any academic or cognitive test battery, convert it to a single continuous strand in this exact format:
[Battery Name]: [Subtest] SS=[score], %ile=[number]; [Subtest] SS=[score], %ile=[number]. [Next Battery Name]: [Subtest] SS=[score], %ile=[number].
Rules:

Separate subtests within the same battery with semicolons
End each battery block with a period before starting the next
If composites are present, list them as a separate block labeled "[Battery] Composites:"
Do not drop the "th", "st", "rd" from percentile numbers (19th stays 19th)
Drop the Classification column entirely
Output is one continuous line of plain text, no line breaks
No headers, no labels, no interpretation

Example output:
WRAT-5: Sentence Comprehension SS=87, %ile=19th; Math Computation SS=89, %ile=23rd. WIAT-4: Word Reading SS=96, %ile=39th; Pseudoword Decoding SS=103, %ile=58th. WIAT-4 Composites: Reading SS=90, %ile=25th; Mathematics SS=84, %ile=14th.

---

## Report Card Grades Section

When the user provides current report card grades from the Student Profile sheet, output a second plain-text strand in this exact format:

Current Grades ([Grading Period], [School Year]): [Subject]: [Grade]; [Subject]: [Grade]; [Subject]: [Grade].

Rules:

Pull the most recent grading period available — label it exactly as it appears on the Student Profile sheet (e.g., "Q2", "Semester 1", "Trimester 2")
Include the school year if shown (e.g., 2024–2025)
List all subjects in the order they appear on the sheet
Use the grade exactly as shown — letter grades (A, B+, C-), percentages, or pass/fail — do not convert or interpret
If a grade is missing or blank for a subject, write: [Subject]: N/A
Output is one continuous line of plain text, no line breaks
No classification, no GPA calculation, no interpretation

Example output:
Current Grades (Q2, 2024–2025): English 10: C+; Algebra II: D; Biology: B-; World History: C; Spanish II: B; PE: A; Study Skills: P.

---

## Combined Output

If both score data and report card grades are provided, output the score strand first, then the grades strand on the next line, with a blank line separating them. No headers. No additional text.