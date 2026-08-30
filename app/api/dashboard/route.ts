import { and, count, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { labComponentResponses, learnerProfiles, partnershipInquiries } from "@/db/schema";
import { publishedLabs } from "@/lib/lab-catalog";
import { BIS_MEASUREMENT_MANUAL_VERSION } from "@/lib/measurement";

export async function GET() {
  const db = getDb();
  const [responseCount, completeCount, evidenceCount, learnerCount, enquiryCount] = await Promise.all([
    db.select({ count: count() }).from(labComponentResponses),
    db.select({ count: count() }).from(labComponentResponses).where(eq(labComponentResponses.isComplete, true)),
    db.select({ count: count() }).from(labComponentResponses).where(and(eq(labComponentResponses.isComplete, true), isNotNull(labComponentResponses.beiTarget))),
    db.select({ count: count() }).from(learnerProfiles),
    db.select({ count: count() }).from(partnershipInquiries),
  ]);

  const liveResponses = Number(responseCount[0]?.count ?? 0);
  const completed = Number(completeCount[0]?.count ?? 0);
  const learners = Number(learnerCount[0]?.count ?? 0);
  return Response.json({
    participation: {
      activeLearners: learners,
      interactionsSaved: liveResponses,
      completedInteractions: completed,
      publishedLabs: publishedLabs.length,
      partnershipInterest: Number(enquiryCount[0]?.count ?? 0),
      status: liveResponses > 0 ? "Learner activity recorded" : "Awaiting learner activity",
    },
    behaviouralEvidence: {
      capturedEvidencePoints: Number(evidenceCount[0]?.count ?? 0),
      manualVersion: BIS_MEASUREMENT_MANUAL_VERSION,
      interpretationStatus: "Descriptive evidence only",
      automatedScoring: false,
      benchmarkComparison: false,
    },
    safeguards: ["Private learner writing is never included in this view.", "Participation counts are reported separately from behavioural evidence.", "No labels, diagnoses, composite Behaviour Intelligence score or automated learner profiles."],
  }, { headers: { "Cache-Control": "no-store" } });
}
