import { tool } from "@openai/agents";
import { z } from "zod";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/chat-further";
import type { Schema } from "@/../amplify/data/resource";

export const getReviewDetails = tool({
  name: "get_review_details",
  description: "Get the full portfolio review details including factor breakdown, hidden risks, and user answers. Use when the user asks for deeper analysis, specific factor scores, or wants to revisit review findings.",
  parameters: z.object({
    reviewId: z.string().describe("The SavedReview ID"),
  }),
  execute: async ({ reviewId }: { reviewId: string }) => {
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
    Amplify.configure(resourceConfig, libraryOptions);
    const client = generateClient<Schema>();

    const { data: review } = await client.models.SavedReview.get({ id: reviewId });
    if (!review) return JSON.stringify({ error: "Review not found" });

    const report = JSON.parse(review.report as string);
    const holdings = JSON.parse(review.holdings as string);
    const answers = JSON.parse(review.answers as string);

    return JSON.stringify({
      overallScore: report.overallScore,
      overallLabel: report.overallLabel,
      overallSummary: report.overallSummary,
      factors: report.factors ?? [],
      hiddenRisks: report.hiddenRisks ?? [],
      portfolioStats: report.portfolioStats ?? {},
      holdings,
      answers,
    });
  },
});
