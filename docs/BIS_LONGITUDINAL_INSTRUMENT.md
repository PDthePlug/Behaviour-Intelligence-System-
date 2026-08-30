# BIS longitudinal instrument contract

Version: `BIS-LI-1.0.0`  
Measurement reference: `BIS-MM-0.1.0`  
Status: governed descriptive evidence; not a validated psychometric instrument.

## One interaction grammar

All Volume 1 Labs use the same runtime sequence:

1. Pre-Lab check-in: BEI-01 followed by BEI-02.
2. Investigations 1–6: reading, prediction, observation, mapping, equation and contract.
3. Seven-day field experiment: BEI-06.
4. Post-Lab evidence review: BEI-07 and BEI-08.
5. Identity statement and automatic Behaviour Evidence Summary: BEI-09 and BEI-10.
6. Profile-filled completion certificate plus a separate private descriptive evidence record.

Uniformity means the same response grammar and evidence rules. It does not mean forcing every Lab to have the same number of questions. A response point is one authored answer field, one scale item, one checklist item or one daily observation. Container/component counts are not presented as learner interaction counts.

## Seven-day state model

The server owns the clock. Starting an experiment stores its start date, the participant's profile timezone, reminder preferences and an empty record set. The timezone cannot be changed after evidence is captured.

Each day is one of:

- `scheduled`: the calendar day has not happened and cannot be answered;
- `available`: the current local calendar day;
- `grace`: yesterday, available only until 12:00 local time and marked retrospective;
- `recorded`: an admissible observation was saved;
- `missed`: the capture window closed without evidence.

A missed day remains missing. It is never converted to “not done” and never silently scored as zero. Review unlocks only after the seventh calendar day is experienced. A learner may therefore finish with fewer than seven captured days, but cannot complete the Lab in one sitting.

The learner records one experienced moment, a binary source-faithful rule-application response, and optional context. BIS derives days captured, rules applied and days missing. Learners do not re-enter these totals.

## Reminders

BIS displays the current-day action in Today and refreshes temporal state when the app becomes visible, gains focus and at five-minute intervals while open. The learner can download a seven-day calendar schedule containing morning observation and evening capture reminders. The product does not claim closed-browser push delivery without a configured notification provider.

## Pre/post and summaries

Post-Lab questions are explicitly labelled post. BIS retrieves paired pre/post responses and calculates approved arithmetic differences. It does not infer causation, diagnose a participant, compare the participant to a benchmark or create a composite Behaviour Intelligence score.

The Behaviour Evidence Summary retrieves relevant earlier reflections and the seven-day record. Calculated values are read-only; the learner supplies only the requested synthesis in their own words.

## Completion credential

The completion certificate is generated from the authenticated profile, Lab identity, delivery edition and server completion time. School context may include grade; youth-programme context may include programme/cohort; workplace context may include organisation. A server-generated certificate ID identifies the completion record.

The certificate records participation. Pre/post differences and experiment details remain in a separate private descriptive evidence record and carry the claims boundary.
