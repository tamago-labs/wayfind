import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/wayfind-api";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
Amplify.configure(resourceConfig, libraryOptions);
const dataClient = generateClient<Schema>();

function json(statusCode: number, body: any): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; profileId?: string; error?: string }> {
  if (!apiKey) return { valid: false, error: "API key required" };
  try {
    const { data: profile } = await dataClient.models.UserProfile.get({ id: apiKey });
    if (!profile) return { valid: false, error: "Invalid API key" };
    if (profile.apiKeyActive === false) return { valid: false, error: "API key deactivated" };
    return { valid: true, profileId: profile.id };
  } catch {
    return { valid: false, error: "Invalid API key" };
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") return json(200, {});

  const apiKey = event.headers["x-api-key"] || event.queryStringParameters?.apiKey;
  const auth = await validateApiKey(apiKey ?? "");
  if (!auth.valid) return json(401, { error: auth.error });

  const path = event.rawPath || event.requestContext.http.path;

  try {
    if (path.endsWith("/tokens")) {
      const { data } = await dataClient.models.PriceSnapshot.list({ limit: 100 });
      return json(200, { data });
    }

    if (path.endsWith("/risk-profile")) {
      return json(200, { data: "ok" });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("[wayfind-api] error:", err);
    return json(500, { error: "Internal server error" });
  }
};
