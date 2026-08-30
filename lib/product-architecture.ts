export type DeliveryEdition = "school" | "youth_programme" | "workplace";

export const deliverySkins: Record<DeliveryEdition, {
  id: DeliveryEdition;
  name: string;
  participant: string;
  facilitator: string;
  manager: string;
  description: string;
}> = {
  school: {
    id: "school",
    name: "School Edition",
    participant: "Learner",
    facilitator: "Teacher",
    manager: "Principal",
    description: "School-ready language for learner cohorts and education leadership.",
  },
  youth_programme: {
    id: "youth_programme",
    name: "Youth Programme Edition",
    participant: "Participant",
    facilitator: "Facilitator",
    manager: "Programme manager",
    description: "Neutral programme language for post-school and youth-development cohorts.",
  },
  workplace: {
    id: "workplace",
    name: "Workplace Edition",
    participant: "Participant",
    facilitator: "Facilitator",
    manager: "L&D or HR",
    description: "Workplace language for employability, leadership and development cohorts.",
  },
};

export const defaultDeliveryEdition: DeliveryEdition = "youth_programme";

export function isDeliveryEdition(value: unknown): value is DeliveryEdition {
  return typeof value === "string" && Object.hasOwn(deliverySkins, value);
}

export function contextualiseWorkbookText(text: string, edition: DeliveryEdition) {
  if (edition === "school") return text;
  const ending = edition === "workplace" ? "From me, in this workplace cohort" : "From me, in this programme";
  return text
    .replaceAll("From me, in Grade ___", ending)
    .replaceAll("School/Work", edition === "workplace" ? "Workplace" : "Programme/Work")
    .replaceAll("school/work", edition === "workplace" ? "workplace" : "programme/work");
}

export type ProductFamilyId = "personal-operating-system" | "work-leadership-readiness" | "applied-commerce-enterprise" | "cross-cutting";

export type ProductLab = {
  slug: string;
  title: string;
  familyId: ProductFamilyId;
  status: "available" | "preparing";
  cartridgeId?: string;
};

function lab(familyId: ProductFamilyId, slug: string, title: string, cartridgeId?: string): ProductLab {
  return { slug, title, familyId, status: cartridgeId ? "available" : "preparing", cartridgeId };
}

export const productFamilies: Array<{
  id: ProductFamilyId;
  title: string;
  eyebrow: string;
  description: string;
  labs: ProductLab[];
}> = [
  {
    id: "personal-operating-system",
    title: "Personal Operating System",
    eyebrow: "SELF-REGULATION & AGENCY",
    description: "The BIS Labs concerned with how people notice, choose, regulate and sustain their own behaviour.",
    labs: [
      lab("personal-operating-system", "habit-lab", "Habit Lab™", "habit-lab-2026"),
      lab("personal-operating-system", "decision-lab", "Decision Lab™", "decision-lab-2026"),
      lab("personal-operating-system", "identity-lab", "Identity Lab™"),
      lab("personal-operating-system", "attention-lab", "Attention Lab™"),
      lab("personal-operating-system", "time-lab", "Time Lab™"),
      lab("personal-operating-system", "risk-lab", "Risk Lab™"),
      lab("personal-operating-system", "future-self-lab", "Future Self Lab™"),
      lab("personal-operating-system", "resilience-lab", "Resilience Lab™"),
    ],
  },
  {
    id: "work-leadership-readiness",
    title: "Work & Leadership Readiness",
    eyebrow: "RELATIONSHIPS & CONTRIBUTION",
    description: "The BIS Labs concerned with communication, collaboration, ethical judgement and workplace contribution.",
    labs: [
      lab("work-leadership-readiness", "communication-lab", "Communication Lab™"),
      lab("work-leadership-readiness", "team-lab", "Team Lab™"),
      lab("work-leadership-readiness", "trust-lab", "Trust Lab™"),
      lab("work-leadership-readiness", "influence-lab", "Influence Lab™"),
      lab("work-leadership-readiness", "leadership-lab", "Leadership Lab™"),
      lab("work-leadership-readiness", "negotiation-lab", "Negotiation Lab™"),
      lab("work-leadership-readiness", "ethics-lab", "Ethics Lab™"),
      lab("work-leadership-readiness", "grit-lab", "Grit Lab™"),
      lab("work-leadership-readiness", "personal-effectiveness-lab", "Personal Effectiveness Lab™"),
      lab("work-leadership-readiness", "transferable-skills-lab", "Transferable Skills Lab™"),
      lab("work-leadership-readiness", "launch-lab", "Launch Lab™"),
    ],
  },
  {
    id: "applied-commerce-enterprise",
    title: "Applied Commerce & Enterprise Thinking",
    eyebrow: "VALUE, SYSTEMS & ENTERPRISE",
    description: "The BIS Labs concerned with money, markets, enterprise, value creation and long-term thinking.",
    labs: [
      lab("applied-commerce-enterprise", "money-lab", "Money Lab™"),
      lab("applied-commerce-enterprise", "entrepreneurship-lab", "Entrepreneurship Lab™"),
      lab("applied-commerce-enterprise", "opportunity-lab", "Opportunity Lab™"),
      lab("applied-commerce-enterprise", "customer-thinking-lab", "Customer Thinking Lab™"),
      lab("applied-commerce-enterprise", "innovation-thinking-lab", "Innovation Thinking™ Lab"),
      lab("applied-commerce-enterprise", "economics-for-humans-lab", "Economics for Humans Lab™"),
      lab("applied-commerce-enterprise", "asset-thinking-lab", "Asset Thinking Lab™"),
      lab("applied-commerce-enterprise", "financial-philosophy-lab", "Financial Philosophy Lab™"),
      lab("applied-commerce-enterprise", "systems-thinking-lab", "Systems Thinking Lab™"),
      lab("applied-commerce-enterprise", "long-term-thinking-lab", "Long-Term Thinking Lab™"),
    ],
  },
  {
    id: "cross-cutting",
    title: "Cross-cutting Labs",
    eyebrow: "PURPOSE & META-LEARNING",
    description: "Three source Labs that can be used across the commercial families when the programme design calls for them.",
    labs: [
      lab("cross-cutting", "purpose-lab", "Purpose Lab™"),
      lab("cross-cutting", "growth-mindset-lab", "Growth Mindset Lab™"),
      lab("cross-cutting", "meta-learning-lab", "Meta-Learning Lab™"),
    ],
  },
];

export const productLabs = productFamilies.flatMap((family) => family.labs);

export function productFamilyById(id: ProductFamilyId) {
  return productFamilies.find((family) => family.id === id);
}
