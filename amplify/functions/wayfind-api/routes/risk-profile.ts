import { getClient } from "../middleware/auth";

export async function handleRiskProfile(profileId: string) {
  const client = await getClient() as any;

  const { data: profile } = await client.models.UserProfile.get({ id: profileId });
  if (!profile) return { error: "Profile not found" };

  const defaultReviewId = profile.defaultReviewId;
  if (!defaultReviewId) return { error: "No default risk profile set" };

  const { data: review } = await client.models.SavedReview.get({ id: defaultReviewId });
  if (!review) return { error: "Risk profile not found" };

  const r = review as any;
  const report = JSON.parse(r.report as string);
  const answers = JSON.parse(r.answers as string);

  return {
    overallScore: report.overallScore,
    overallLabel: report.overallLabel,
    answers,
  };
}
