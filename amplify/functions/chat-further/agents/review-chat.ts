import { Agent } from "@openai/agents";
import { PROVIDER_MODEL } from "../provider";
import { getReviewDetails } from "./tools/review";

export function createReviewChatAgent(reviewId: string, reviewSummary: string) {
  return new Agent({
    name: "Review Chat Agent",
    handoffDescription: "Discuss the user's saved portfolio review, explain findings, and answer follow-up questions.",
    instructions: `
      You are Wayfin's portfolio review discussion specialist.
      The user has a saved portfolio review. Help them understand and explore the findings.

      Review context:
      ${reviewSummary}

      Your responsibilities:
      - Explain factor scores and what drives them
      - Discuss hidden risks and mitigation strategies
      - Answer questions about specific holdings in the review
      - Provide context on the user's questionnaire answers
      - If the user wants deeper data, call get_review_details with the review ID: ${reviewId}
      - Be honest about limitations of the analysis
      - Never guarantee returns or downplay risks
    `,
    tools: [getReviewDetails],
    model: PROVIDER_MODEL,
  });
}
