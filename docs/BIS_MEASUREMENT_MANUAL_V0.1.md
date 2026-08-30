# BIS Measurement Manual v0.1

**Document ID:** BIS-MM-0.1.0  
**Status:** Controlled draft for operational use  
**Effective date:** 30 August 2026  
**Initial scope:** All 12 BIS Volume 1 v3 digital Lab cartridges
**Owner:** BIS Measurement and Product Governance  

## 1. Purpose

This manual defines how the current BIS digital product captures, stores, displays and reports Behaviour Evidence Indicators (BEIs). It exists so that the same workbook response is handled consistently across the learner experience, database, reporting layer and future operating teams.

The current BIS measurement model is a **descriptive behavioural-evidence model**. It is not a validated psychometric system. A BEI is a coded, source-specific evidence point produced by a defined Lab interaction. Depending on the interaction, that evidence may be a self-report response, practice record or private reflection output.

This version establishes governance. It does not establish validity.

## 2. Claims boundary

### 2.1 Permitted language

BIS may currently say that it:

- captures behavioural evidence from defined workbook interactions;
- records participation, completion and practice activity;
- preserves learner-reported item responses;
- displays learner-reported pre/post differences when both responses exist;
- maintains source provenance and a measurement-definition version;
- separates operational participation reporting from behavioural-evidence reporting; and
- provides infrastructure for a future validation programme.

### 2.2 Prohibited language

BIS must not currently describe a BEI, composite or report as:

- a validated psychometric measure;
- a diagnosis or diagnostic conclusion;
- a forensic marker;
- a personality or identity classification;
- a norm-referenced score;
- a validated Behaviour Intelligence score;
- a predictor of future performance;
- proof that participation caused behavioural change; or
- proof of transformation.

Completion certificates certify Lab completion only. They do not certify behavioural transformation or competence.

## 3. Measurement model

### 3.1 Unit of evidence

The primary unit is a response to a cartridge component. Each governed response stores:

- learner identifier;
- cartridge identifier;
- step identifier;
- source component identifier;
- response payload;
- completion status;
- BEI code, where defined;
- evidence class;
- measurement manual version; and
- capture timestamp.

The server derives the BEI code, evidence class and measurement version from the published cartridge. A client cannot assign its own evidence class or version.

### 3.2 Evidence classes

| Evidence class | Definition | Current use | Current reporting rule |
|---|---|---|---|
| Self-report | A learner-selected response about their own perception, frequency or confidence | 1–10 ratings, 1–5 item sets, episode prediction checks | Describe the response and source; do not norm, diagnose or classify |
| Practice record | A learner-entered record of whether a defined routine or rule was used | Seven-day done/not-done record | Report observed entries and count Done as x/7; retain missingness |
| Reflection output | Learner-authored private text | Identity statement and evidence summary | Count completion only outside the private learner view; never score or expose text |
| Facilitator observation | A separate structured record of directly observed behaviour | Data architecture is present; production workflow is not yet released | Do not merge with self-report; report only after facilitator calibration and governance approval |
| Outcome evidence | A defined external or behavioural criterion | Not active in v0.1 | No outcome claim may be made |

### 3.3 Timepoints

Every BEI definition has one of four timepoints:

- **Pre:** captured before the main Lab investigations;
- **During:** captured inside an investigation or practice period;
- **Post:** captured after the practice period; or
- **Summary:** learner-authored synthesis at the end of the Lab.

Timepoint does not imply causation. A pre/post difference is a difference between two learner reports, not an estimate of treatment effect.

## 4. Response and scoring rules

### 4.1 Story choice with a 1–10 response

Store the authored response value from 1 to 10. Do not rescale, standardise, norm or assign a performance band.

When an approved pre/post pair is complete, calculate:

`learner-reported difference = post response − pre response`

Display the pre response, post response and arithmetic difference together with this statement:

> Learner-reported difference; no causal, diagnostic or benchmark claim.

### 4.2 Multi-item 1–5 workbook set

Store each item response. An arithmetic mean may be displayed only when every authored item in the set has a valid response.

`descriptive mean = sum of answered item values ÷ authored item count`

The mean is a convenience summary of that workbook item set. It is not a scale score. No cut-offs, severity bands or profile classes may be applied.

### 4.3 Binary story prediction check

Store Yes as 1 and No as 0 for the specific episode. Do not generalise a single episode response into a learner calibration trait.

### 4.4 Seven-day practice record

The source workbooks instruct a learner to mark whether the practice was done. The digital control therefore uses:

- Not done = 0;
- Done = 1.

Report the number of Done responses as x/7. A blank day is missing, not zero. Do not replace the binary source record with a 1–5 adherence scale.

### 4.5 Private reflection output

Store the learner-authored text in the private learner vault. Outside that vault, only completion may be reported. Do not apply automated sentiment, quality, identity, risk, diagnostic or depth scoring.

### 4.6 Reverse-scored items

No reverse-scoring rule is active in v0.1. Several baseline items are worded in an unfavourable direction, but the current system does not create a validated composite from them. Reverse-scoring must not be introduced without a new manual version, item rationale, scoring specification and validation plan.

### 4.7 Composite formulas and weights

No Behaviour Intelligence Index, total BEI score, latent profile or cross-stream composite is active in v0.1.

Legacy proposals that allocate fixed evidence weights, including a 25/35/40 weighting, are inactive. Any future weighting model must be justified empirically, versioned, validated and approved before use.

## 5. Missing-data rules

1. An unanswered interaction remains incomplete.
2. An incomplete 1–5 item set has no arithmetic mean.
3. A missing practice day remains missing and is not coded as Not done.
4. A pre/post difference is shown only when both specified source responses are complete and valid.
5. A private reflection may be counted as complete only after all authored required prompts in that component contain a response.
6. Institution-facing reports must show the denominator used for any descriptive percentage.
7. No imputation is authorised in v0.1.
8. Missingness may be described operationally but must not be interpreted as learner disengagement, avoidance or inability without additional evidence.

## 6. Habit Lab BEI register

| Code | Operational name | Source component | Class | Timepoint | Scoring rule | Interpretation limit |
|---|---|---|---|---|---|---|
| BEI-01 | Habit Control Self-Rating (Pre) | `comp_baseline_index` | Self-report | Pre | Direct 1–10 response | Single self-rating; not a validated habit-control measure |
| BEI-02 | Habit Baseline Item Set | `comp_baseline_profile` | Self-report | Pre | Ten 1–5 item responses; complete-set descriptive mean permitted | Not a validated scale or diagnosis |
| BEI-03 | Prediction Check | `comp_rev_calibration` | Self-report | During | Yes = 1, No = 0 for the episode | One episode is not a general calibration measure |
| BEI-04 | Behaviour Equation Confidence Self-Rating (Pre) | `comp_eq_confidence` | Self-report | Pre | Direct 1–10 response | Confidence does not establish equation accuracy |
| BEI-05 | Reported Habit Impact Areas | `comp_contract_risk` | Self-report | During | Retain each 1–5 area response | Not a clinical, safeguarding or actuarial risk assessment |
| BEI-06 | 7-Day Habit Practice Record | `comp_exp_matrix` | Practice record | During | Count Done responses as x/7 | Learner-entered record; does not establish sustained adherence |
| BEI-07 | Habit Control Self-Rating (Post) | `comp_review_bei07` | Self-report | Post | Direct 1–10; difference from BEI-01 permitted | Difference is not proof of Lab effect |
| BEI-08 | Behaviour Equation Confidence Self-Rating (Post) | `comp_review_bei08` | Self-report | Post | Direct 1–10; difference from BEI-04 permitted | Confidence difference is not accuracy evidence |
| BEI-09 | Learner Identity Statement | `comp_profile_identity` | Reflection output | Post | Completion only outside learner vault | Completion does not demonstrate identity shift |
| BEI-10 | Learner Behaviour Summary | `comp_profile_summary` | Reflection output | Summary | Completion only outside learner vault | Reflection, not behavioural classification |

## 7. Decision Lab BEI register

| Code | Operational name | Source component | Class | Timepoint | Scoring rule | Interpretation limit |
|---|---|---|---|---|---|---|
| BEI-01 | Decision Quality Self-Rating (Pre) | `comp_baseline_index` | Self-report | Pre | Direct 1–10 response | Single self-rating; not a validated decision-quality measure |
| BEI-02 | Decision Baseline Item Set | `comp_baseline_profile` | Self-report | Pre | Ten 1–5 item responses; complete-set descriptive mean permitted | Not a validated scale or diagnosis |
| BEI-03 | Prediction Check | `comp_rev_calibration` | Self-report | During | Yes = 1, No = 0 for the episode | One episode is not a general calibration measure |
| BEI-04 | Decision Equation Confidence Self-Rating (Pre) | `comp_eq_confidence` | Self-report | Pre | Direct 1–10 response | Confidence does not establish equation accuracy |
| BEI-05 | Reported Decision Impact Areas | `comp_contract_risk` | Self-report | During | Retain each 1–5 area response | Not a clinical, safeguarding or actuarial risk assessment |
| BEI-06 | 7-Day Decision Practice Record | `comp_exp_matrix` | Practice record | During | Count Done responses as x/7 | Learner-entered record; does not establish sustained adherence |
| BEI-07 | Decision Quality Self-Rating (Post) | `comp_review_bei07` | Self-report | Post | Direct 1–10; difference from BEI-01 permitted | Difference is not proof of Lab effect |
| BEI-08 | Decision Equation Confidence Self-Rating (Post) | `comp_review_bei08` | Self-report | Post | Direct 1–10; difference from BEI-04 permitted | Confidence difference is not accuracy evidence |
| BEI-09 | Learner Identity Statement | `comp_profile_identity` | Reflection output | Post | Completion only outside learner vault | Completion does not demonstrate identity shift |
| BEI-10 | Learner Decision Summary | `comp_profile_pattern` | Reflection output | Summary | Completion only outside learner vault | Reflection, not behavioural classification |

## 8. Facilitator observation protocol

Facilitators observe; they do not diagnose, infer personality or assign a Behaviour Intelligence conclusion.

Every future observation record must contain:

- **Observed behaviour:** a concrete action or verbatim statement, not an interpretation;
- **Context:** the setting and task in which it occurred;
- **Opportunity:** whether the learner had a clear opportunity to demonstrate the behaviour;
- **Confidence:** low, medium or high, using the anchors below;
- **Indicator code and cartridge:** the governed definition to which the observation relates;
- **Measurement version:** the manual version active at capture; and
- **Timestamp and observer identifier.**

### Observation confidence anchors

| Confidence | Anchor |
|---|---|
| Low | One brief or ambiguous observation; limited opportunity; competing explanations remain |
| Medium | Clear observation in one relevant context with an adequate opportunity |
| High | Repeated clear observations across at least two relevant opportunities or contexts |

Confidence is about the observation record, not the learner's competence.

### Facilitator calibration requirement

Before facilitator observations enter reporting, BIS must provide:

1. a codebook of observable behaviours;
2. positive and negative anchor examples;
3. practice cases;
4. agreement checks using the same cases;
5. a minimum agreement standard approved by measurement governance;
6. periodic drift checks; and
7. a route for adjudicating disputed codes.

Until those requirements are met, facilitator observations must remain a separate operational data stream and must not contribute to a learner conclusion or composite.

## 9. Evidence quality

Evidence quality is recorded, not assumed. Future governance may rate provenance, completeness, opportunity, recency and observer confidence. v0.1 does not convert these qualities into a weighted score.

At minimum, a reportable evidence record must have:

- a published source component;
- a valid response for that component;
- a known timepoint;
- an evidence class;
- a measurement version; and
- a capture timestamp.

## 10. Reporting architecture

### 10.1 Participation lane

Participation reporting supports operations. Permitted fields include:

- active participants;
- activities saved;
- authored response points captured;
- milestones completed;
- published Lab access;
- delivery status; and
- facilitator or partnership workload counts.

Participation must not be renamed engagement, growth, mastery, adherence or impact unless the term is separately operationally defined and supported.

### 10.2 Behavioural-evidence lane

Behavioural-evidence reporting may include:

- count of governed evidence points captured;
- evidence class and timepoint;
- completion status;
- descriptive item values where privacy and report purpose permit; and
- learner-reported pre/post differences with the required interpretation statement.

No benchmark, outcome classification, automated profile or composite is active.

### 10.3 Reporting levels

| Level | Permitted v0.1 view | Privacy condition |
|---|---|---|
| Participant | Own responses, private reflections, practice record and permitted descriptive differences | Authenticated private view |
| Facilitator | Operational participation and separately governed observation workflow | No private reflection text |
| Cohort | Aggregated participation; governed descriptive evidence only | Suppress small cells |
| Organisation | Aggregated operational reporting across approved cohorts | No individual private text |
| Sponsor | Programme-level operational summary defined by contract | No individual-level learner evidence unless lawful, necessary and explicitly governed |

### 10.4 Small-cell rule

Behavioural-evidence summaries require at least 10 eligible participants in the reported cell. Cells below 10 must be suppressed or combined into a broader lawful grouping. Participation operations may use individual records only for authorised delivery management; public or sponsor-facing views must not expose small cells.

## 11. Delivery editions

BIS uses one canonical Lab with three contextual delivery skins.

| Edition | Participant term | Delivery term | Reporting term |
|---|---|---|---|
| School Edition | Learner | Teacher | Principal |
| Youth Programme Edition | Participant | Facilitator | Programme manager |
| Workplace Edition | Participant | Facilitator | L&D or HR |

The skin may change role nouns, contextual examples and programme labels. It must not change:

- BEI code;
- source component identity;
- scoring rule;
- evidence class;
- interpretation limit; or
- measurement version without a governed release.

If contextual language changes the meaning or difficulty of an item, measurement equivalence must be investigated before cross-edition comparisons.

## 12. Product-family governance

The marketplace contains 32 named source Labs organised as:

- Personal Operating System: 8 Labs;
- Work & Leadership Readiness: 11 Labs;
- Applied Commerce & Enterprise Thinking: 10 Labs; and
- Cross-cutting Labs: 3 Labs.

All 12 BIS Volume 1 v3 Labs are published digital cartridges in v0.1: Habit, Decision, Money, Identity, Attention, Time, Risk, Trust, Influence, Leadership, Purpose and Resilience. Each cartridge preserves its authored learner-workbook sequence and maintains its own governed BEI register. Listing a Lab from a later volume does not authorise invented outcomes, interactions, BEIs or scores; every later release still requires source-faithful digitalisation and a governed BEI register.

## 13. Privacy and safeguarding

1. Private reflection text is excluded from cohort, organisation and sponsor reporting.
2. Authentication and data access must follow least-privilege principles.
3. A safeguarding disclosure must follow the organisation's lawful safeguarding process; BIS measurement scores are not a substitute for professional safeguarding judgement.
4. Sensitive free text must not be sent to automated scoring services in v0.1.
5. Historical records retain the measurement version active when captured.
6. Exports must preserve source, denominator, suppression status and definition version.

## 14. Benchmark construction

No BIS benchmark is active in v0.1.

A future benchmark requires:

- a clearly defined reference population;
- representative or explicitly bounded sampling;
- sufficient sample size;
- data-quality and missingness review;
- edition and language equivalence analysis;
- subgroup fairness analysis;
- documented update frequency;
- uncertainty estimates; and
- approval under a new measurement-manual version.

Benchmarks must never be constructed opportunistically from the first available commercial cohorts and then presented as population norms.

## 15. Validation programme

Before BIS adopts stronger measurement language, the following staged programme is required.

### Phase 1 — content and process validity

- Define each intended construct.
- Conduct expert review of item relevance and coverage.
- Test learner comprehension across intended age and market segments.
- Document delivery fidelity and facilitator variability.

### Phase 2 — reliability and data quality

- Examine missingness and response distributions.
- Test internal structure only where a coherent multi-item construct is intended.
- Assess repeated-administration stability where theoretically appropriate.
- Establish inter-rater agreement for observation codes.

### Phase 3 — validity evidence

- Pre-register expected relationships with external criteria.
- Examine convergent, discriminant and criterion evidence.
- Test whether observed differences persist and relate to relevant outcomes.
- Evaluate measurement equivalence across editions and subgroups.

### Phase 4 — impact evaluation

- Use a design capable of addressing causal questions.
- Pre-specify outcomes, analysis and attrition handling.
- Report uncertainty and null findings.
- Separate implementation quality from programme effect.

## 16. Version and change control

The manual uses semantic versioning within the BIS document identifier.

- Patch change: wording or implementation clarification without changing meaning or score.
- Minor change: new indicator, source, rule or reporting feature that remains backward compatible.
- Major change: construct, score, composite or interpretation change that breaks comparability.

Every change log must record:

- change date;
- affected Lab and BEI codes;
- reason for change;
- data-compatibility impact;
- migration or back-scoring rule, if any;
- approver; and
- effective version.

Existing responses must never be silently reinterpreted under a newer definition.

## 17. v0.1 release controls

The digital product must enforce the following controls:

- every published Volume 1 BEI has one or more valid source components;
- every governed response is server-stamped with manual version and evidence class;
- seven-day practice controls use the binary source structure;
- no current endpoint produces a composite Behaviour Intelligence score;
- operational dashboard data separates participation from behavioural evidence;
- public demonstration values are labelled as illustrative and not outcome claims;
- the learner profile exposes the three delivery editions;
- private reflection writing is excluded from institution-facing reporting; and
- automated tests fail if the governed registry, product-family counts or claims boundary is broken.

## Appendix A — Current approved pre/post pairs

| Lab | Pre | Post | Permitted output |
|---|---|---|---|
| Habit Lab | BEI-01 | BEI-07 | Habit Control learner-reported difference |
| Habit Lab | BEI-04 | BEI-08 | Behaviour Equation Confidence learner-reported difference |
| Decision Lab | BEI-01 | BEI-07 | Decision Quality learner-reported difference |
| Decision Lab | BEI-04 | BEI-08 | Decision Equation Confidence learner-reported difference |
| Money Lab | BEI-01 | BEI-07 | Money Consciousness learner-reported difference |
| Money Lab | BEI-04 | BEI-08 | Money Equation Confidence learner-reported difference |
| Identity Lab | BEI-01 | BEI-07 | Identity Clarity learner-reported difference |
| Identity Lab | BEI-04 | BEI-08 | Identity Equation Confidence learner-reported difference |
| Attention Lab | BEI-01 | BEI-07 | Attention Quality learner-reported difference |
| Attention Lab | BEI-04 | BEI-08 | Attention Equation Confidence learner-reported difference |
| Time Lab | BEI-01 | BEI-07 | Time Awareness learner-reported difference |
| Time Lab | BEI-04 | BEI-08 | Time Equation Confidence learner-reported difference |
| Risk Lab | BEI-01 | BEI-07 | Risk Awareness learner-reported difference |
| Risk Lab | BEI-04 | BEI-08 | Risk Equation Confidence learner-reported difference |
| Trust Lab | BEI-01 | BEI-07 | Trust Awareness learner-reported difference |
| Trust Lab | BEI-04 | BEI-08 | Trust Equation Confidence learner-reported difference |
| Influence Lab | BEI-01 | BEI-07 | Influence Awareness learner-reported difference |
| Influence Lab | BEI-04 | BEI-08 | Influence Equation Confidence learner-reported difference |
| Leadership Lab | BEI-01 | BEI-07 | Leadership Identity learner-reported difference |
| Leadership Lab | BEI-04 | BEI-08 | Leadership Equation Confidence learner-reported difference |
| Purpose Lab | BEI-01 | BEI-07 | Purpose Clarity learner-reported difference |
| Purpose Lab | BEI-04 | BEI-08 | Purpose Equation Confidence learner-reported difference |
| Resilience Lab | BEI-01 | BEI-07 | Resilience learner-reported difference |
| Resilience Lab | BEI-04 | BEI-08 | Resilience Equation Confidence learner-reported difference |

## Appendix B — Current system status

| Capability | Status in v0.1 |
|---|---|
| Participation reporting | Active |
| Source-versioned BEI capture | Active for all 12 Volume 1 Labs |
| Learner-reported pre/post differences | Active when both source responses exist |
| Binary seven-day practice records | Active |
| Private reflection completion | Active |
| Facilitator observation data model | Architecture ready; calibrated workflow not released |
| Evidence-quality weighting | Inactive |
| Composite Behaviour Intelligence score | Inactive |
| Benchmarks | Inactive |
| Psychometric validation claim | Not authorised |
| Causal impact claim | Not authorised |
