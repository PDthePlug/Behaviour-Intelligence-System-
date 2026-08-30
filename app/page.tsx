"use client";

import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Eye,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { deliverySkins, productFamilies, productLabs } from "@/lib/product-architecture";

const liveLabCount = productLabs.filter((lab) => lab.status === "available").length;
const preparingLabCount = productLabs.length - liveLabCount;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="BIS Outcomes Cloud home">
          <span className="wordmark-mark">B</span>
          <span><strong>BIS</strong><em>Outcomes Cloud</em></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#system">The system</a>
          <a href="#labs">The Labs</a>
          <a href="#editions">Editions</a>
          <a href="/measurement">Measurement</a>
        </nav>
        <button className="text-link" onClick={() => scrollTo("founding")}>Become a founding partner <ArrowRight size={15} /></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Applied Commerce® Behaviour Intelligence Series™</p>
          <h1>See the pattern.<br /><i>Practise what comes next.</i></h1>
          <p className="hero-lede">A private development system for school, youth-programme and workplace cohorts—built around source-faithful Labs, real-world practice and responsibly described behavioural evidence.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => scrollTo("system")}>Explore the system <ArrowDownRight size={18} /></button>
            <button className="quiet-button" onClick={() => window.location.assign("/portal")}>Enter the platform <ArrowRight size={17} /></button>
          </div>
          <div className="hero-note"><LockKeyhole size={15} /> Private by default. Descriptive evidence, never a diagnosis.</div>
        </div>

        <div className="hero-art" aria-label="BIS interface demonstration">
          <div className="paper-stack back" />
          <div className="paper-stack mid" />
          <div className="evidence-card">
            <div className="card-topline"><span>Interface demonstration · no outcome claim</span><span className="live-dot">Governed</span></div>
            <div className="evidence-title"><p>HABIT LAB™</p><h2>A private record of what the learner notices, practises and reports.</h2></div>
            <div className="path-line"><span className="active" /><span className="active" /><span className="active" /><span /><span /><span /></div>
            <div className="evidence-metric-grid">
              <div><small>PUBLISHED LABS</small><strong>{liveLabCount}</strong><i>Complete Volume 1</i></div>
              <div><small>BEI DEFINITIONS</small><strong>10<span>/Lab</span></strong><i>Descriptive only</i></div>
            </div>
            <div className="observer-note"><Eye size={16} /><span><b>Interpretation boundary</b><br />No automated profile, diagnosis or composite score.</span></div>
          </div>
          <div className="orange-tab">BEI<br />evidence</div>
          <Image className="workbook-cover" src="/bis-workbook-cover.png" alt="Applied Commerce Behaviour Intelligence Series learner workbook" width={124} height={176} priority />
        </div>
      </section>

      <section className="signal-strip" aria-label="BIS learning model">
        <span>Experience</span><ArrowRight size={17} /><span>Reflect</span><ArrowRight size={17} /><span>Observe</span><ArrowRight size={17} /><span>Practise</span><ArrowRight size={17} /><strong>Record evidence responsibly</strong>
      </section>

      <section className="principle-section" id="system">
        <div className="section-kicker"><span>01</span> THE BIS PRINCIPLE</div>
        <div className="principle-content">
          <h2>Evidence can be useful <i>without pretending to be more than it is.</i></h2>
          <p>BIS gives participants a dignified space to investigate a real pattern, practise a response and preserve source-specific evidence. Current BEIs are behavioural evidence indicators—not validated psychometric measures or causal proof of change.</p>
          <div className="principle-points">
            <article><Eye /><h3>Evidence with provenance</h3><p>Every defined BEI points back to the exact workbook interaction that produced it.</p></article>
            <article><LockKeyhole /><h3>Privacy preserved</h3><p>Private reflection writing stays in the participant vault and outside cohort reporting.</p></article>
            <article><ShieldCheck /><h3>Claims governed</h3><p>Scoring rules, missing-data treatment and interpretation limits are versioned and published.</p></article>
          </div>
        </div>
      </section>

      <section className="lab-section" id="labs">
        <div className="lab-heading">
          <div><p className="section-kicker"><span>02</span> THE BIS LAB CATALOGUE</p><h2>Volume 1 is live.<br /><i>{preparingLabCount} more remain governed.</i></h2></div>
          <p>The marketplace reflects the actual 32-Lab BIS source architecture. All twelve Volume 1 workbooks are now digital learner cartridges; future Labs remain listed without invented content.</p>
        </div>
        <div className="lab-grid">
          <article className="lab-card featured"><span>01 · AVAILABLE NOW</span><div><h3>Habit Lab™</h3><p>11 milestones · 91 authored response points · one governed seven-calendar-day field experiment.</p></div><button className="lab-open" aria-label="Open Habit Lab" onClick={() => window.location.assign("/portal")}><ChevronRight size={18} /></button></article>
          <article className="lab-card featured"><span>02 · AVAILABLE NOW</span><div><h3>Decision Lab™</h3><p>11 milestones · 92 authored response points · one governed seven-calendar-day field experiment.</p></div><button className="lab-open" aria-label="Open Decision Lab" onClick={() => window.location.assign("/portal")}><ChevronRight size={18} /></button></article>
          <article className="lab-card more"><Layers3 /><div><h3>10 more Volume 1 Labs now live</h3><p>Money, Identity, Attention, Time, Risk, Trust, Influence, Leadership, Purpose and Resilience.</p></div><button className="lab-open" aria-label="Open the complete Volume 1 library" onClick={() => window.location.assign("/portal")}><ChevronRight size={18} /></button></article>
        </div>
        <div className="family-grid">
          {productFamilies.map((family) => <article key={family.id}><span>{family.eyebrow}</span><h3>{family.title}</h3><p>{family.description}</p><small>{family.labs.length} source Labs · {family.labs.filter((lab) => lab.status === "available").length} live</small></article>)}
        </div>
      </section>

      <section className="edition-section" id="editions">
        <div className="edition-heading"><p className="section-kicker"><span>03</span> THREE DELIVERY SKINS</p><h2>One intellectual core.<br /><i>Language that fits the room.</i></h2><p>The underlying Lab remains canonical. Participant and reporting language changes for commercial relevance without creating three curricula.</p></div>
        <div className="edition-grid">{Object.values(deliverySkins).map((edition) => <article key={edition.id}><UsersRound size={20} /><span>{edition.name}</span><h3>{edition.participant}</h3><p>{edition.description}</p><dl><div><dt>Delivery</dt><dd>{edition.facilitator}</dd></div><div><dt>Reporting</dt><dd>{edition.manager}</dd></div></dl></article>)}</div>
      </section>

      <section className="institution-section" id="institutions">
        <div className="institution-copy">
          <p className="section-kicker inverse"><span>04</span> OPERATIONAL REPORTING</p>
          <h2>Participation first. Interpretation only under governance.</h2>
          <p>The operations layer keeps attendance and completion reporting separate from behavioural-evidence interpretation. Private writing is excluded, and current BEIs remain descriptive until validation supports stronger use.</p>
          <ul><li><Check size={17} /> Operational counts for delivery management</li><li><Check size={17} /> Versioned evidence definitions and source provenance</li><li><Check size={17} /> Facilitator observations stored as a distinct evidence stream</li></ul>
          <a className="measurement-link" href="/measurement">Read the Measurement Manual v0.1 <ArrowRight size={16} /></a>
        </div>
        <div className="institution-dashboard">
          <div className="dash-header"><span>INTERFACE DEMONSTRATION · NO OUTCOME CLAIM</span><CircleDot size={17} /></div>
          <div className="dash-hero"><p>GOVERNANCE VIEW</p><h3>Participation and evidence stay separate.</h3><span>Illustrative structure; not a live cohort or benchmark</span></div>
          <div className="dash-stats"><div><small>LIVE LABS</small><strong>{liveLabCount}</strong></div><div><small>MODEL STATUS</small><strong>Descriptive</strong></div><div><small>MANUAL</small><strong>v0.1</strong></div></div>
          <div className="dash-progress"><span>Completed response points</span><div><i /><i /><i /><i className="pale" /><i className="pale" /></div><b>Count</b></div>
          <div className="dash-footer"><UsersRound size={17} /> Demonstration only · no private participant writing displayed</div>
        </div>
      </section>

      <section className="founding-section" id="founding">
        <div className="founding-symbol">↗</div>
        <div><p className="section-kicker"><span>05</span> FOUNDING PARTNER COHORT</p><h2>Choose the edition.<br />Keep the evidence honest.</h2></div>
        <div className="founding-right"><p>Start with one school, youth-programme or workplace cohort. Receive the participant journey, facilitator setup and operational reporting under the BIS measurement boundary.</p><button className="primary-button" onClick={() => window.location.assign("/portal")}>Enter the platform <BookOpen size={18} /></button></div>
      </section>

      <footer>
        <a className="wordmark light" href="#top"><span className="wordmark-mark">B</span><span><strong>BIS</strong><em>Outcomes Cloud</em></span></a>
        <p>Applied Commerce® Behaviour Intelligence Series™<br />Behaviour evidence, described responsibly.</p>
        <span><a href="/measurement"><ClipboardCheck size={13} /> Measurement v0.1</a><br />© 2026</span>
      </footer>
    </main>
  );
}
