import { ArrowLeft, ArrowRight, Check, Circle, ClipboardCheck, Eye, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { publishedLabs } from "@/lib/lab-catalog";
import { BIS_MEASUREMENT_MANUAL_VERSION } from "@/lib/measurement";

export default function MeasurementPage() {
  return (
    <main className="measurement-page">
      <header className="measurement-nav"><Link href="/"><ArrowLeft size={15} /> BIS Outcomes Cloud</Link><span>{BIS_MEASUREMENT_MANUAL_VERSION}</span><Link href="/portal">Enter platform <ArrowRight size={15} /></Link></header>

      <section className="measurement-hero">
        <div><p><ClipboardCheck size={15} /> CONTROLLED DRAFT · AUGUST 2026</p><h1>Measurement should make BIS<br /><i>more credible, not more theatrical.</i></h1><span>Measurement Manual v0.1 establishes the operational boundary for Habit Lab and Decision Lab. It is a governance release, not a validation claim.</span></div>
        <aside><small>CURRENT MODEL STATUS</small><strong>Descriptive<br />behavioural evidence</strong><p>BEIs organise self-report, practice records and reflection outputs. They are not validated psychometric measures.</p></aside>
      </section>

      <section className="measurement-boundary">
        <article><Check size={20} /><span>WHAT BIS CAN REPORT NOW</span><h2>Evidence with a source.</h2><ul><li>Interaction and milestone completion</li><li>Workbook item responses</li><li>Learner-reported pre/post differences</li><li>Seven-day done/not-done practice counts</li><li>Private reflection completion</li></ul></article>
        <article className="dark"><ShieldCheck size={20} /><span>WHAT BIS DOES NOT CLAIM</span><h2>No shortcut to validity.</h2><ul><li>No psychometric diagnosis or norm</li><li>No forensic marker</li><li>No composite Behaviour Intelligence score</li><li>No automated identity profile</li><li>No causal proof that a Lab changed behaviour</li></ul></article>
      </section>

      <section className="measurement-streams">
        <div className="measurement-section-heading"><span>01 · EVIDENCE CLASSES</span><h2>Different evidence streams remain different.</h2><p>Combining streams does not automatically improve validity. Each record retains its source, timepoint and measurement version.</p></div>
        <div className="measurement-stream-grid">
          <article><Eye /><strong>Self-report</strong><p>Workbook ratings and episode-level choices, described as learner-reported evidence.</p><span>Active</span></article>
          <article><Circle /><strong>Practice record</strong><p>Seven done/not-done entries retained as a count out of seven, with missing days left missing.</p><span>Active</span></article>
          <article><LockKeyhole /><strong>Reflection output</strong><p>Private learner-authored text. Completion can be counted; content is not exposed or scored.</p><span>Active</span></article>
          <article><Scale /><strong>Facilitator observation</strong><p>A separate future-facing evidence stream with behaviour, context, opportunity and confidence anchors.</p><span>Architecture ready</span></article>
        </div>
      </section>

      <section className="measurement-registry">
        <div className="measurement-section-heading"><span>02 · VERSIONED REGISTRY</span><h2>Every BEI points to its source.</h2><p>The current cartridge registry fixes the definition, source component, evidence class, timepoint, scoring rule and interpretation limit.</p></div>
        {publishedLabs.map((lab) => <article key={lab.cartridgeId}><header><div><small>{lab.cartridgeId}</small><h3>{lab.title}</h3></div><span>{lab.measurement.manualVersion} · {lab.beiSchema.length} definitions</span></header><div className="measurement-table-wrap"><table><thead><tr><th>Code</th><th>Evidence definition</th><th>Class</th><th>Timepoint</th><th>Source component</th></tr></thead><tbody>{lab.beiSchema.map((indicator) => <tr key={indicator.code}><td>{indicator.code}</td><td><strong>{indicator.description}</strong><span>{indicator.interpretationLimit}</span></td><td>{indicator.evidenceClass.replaceAll("_", " ")}</td><td>{indicator.timepoint}</td><td>{indicator.sourceComponentIds.join(", ")}</td></tr>)}</tbody></table></div></article>)}
      </section>

      <section className="measurement-rules">
        <div className="measurement-section-heading"><span>03 · SCORING & MISSING DATA</span><h2>Simple rules, visible limits.</h2></div>
        <div><article><span>1–10 items</span><p>Store the selected response directly. Pre/post differences may be shown only as learner-reported differences.</p></article><article><span>1–5 item sets</span><p>Retain item responses. Display an arithmetic mean only after every item is answered; do not norm or classify it.</p></article><article><span>Seven-day record</span><p>Count Done responses as x/7. An unanswered day is missing, not a zero and not a failed day.</p></article><article><span>Private text</span><p>Record completion. Do not score sentiment, identity, quality, depth or psychological state.</p></article></div>
      </section>

      <section className="measurement-reporting">
        <div><span>04 · REPORTING SEPARATION</span><h2>Operations can move now.<br />Interpretation waits for governance.</h2></div><div className="reporting-lanes"><article><small>PARTICIPATION LANE</small><strong>Operational reporting</strong><p>Active participants, saved interactions, completed interactions, published Labs and delivery status.</p></article><article><small>EVIDENCE LANE</small><strong>Descriptive reporting</strong><p>Captured evidence points, source class and learner-reported differences—without benchmarks or automated scoring.</p></article></div>
      </section>

      <section className="measurement-roadmap">
        <div className="measurement-section-heading"><span>05 · VALIDATION ROADMAP</span><h2>What must happen before stronger claims.</h2></div>
        <ol><li><span>01</span><div><strong>Content review</strong><p>Expert review of construct definitions, item relevance and delivery equivalence.</p></div></li><li><span>02</span><div><strong>Facilitator calibration</strong><p>Anchored observation training, inter-rater agreement checks and drift monitoring.</p></div></li><li><span>03</span><div><strong>Pilot and reliability study</strong><p>Missingness, item behaviour, repeated administration and subgroup fairness analysis.</p></div></li><li><span>04</span><div><strong>Validity and benchmark programme</strong><p>Pre-registered hypotheses, external criteria, longitudinal testing and defensible reference groups.</p></div></li></ol>
      </section>

      <footer className="measurement-footer"><div><strong>{BIS_MEASUREMENT_MANUAL_VERSION}</strong><span>Change-controlled. Historical responses retain the definition version active when captured.</span></div><Link href="/portal">Open the governed learner experience <ArrowRight size={17} /></Link></footer>
    </main>
  );
}
