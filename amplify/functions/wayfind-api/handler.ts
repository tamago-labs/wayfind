import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(process.env as any);
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

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") return json(200, {});

  const apiKey = event.headers["x-api-key"] || event.queryStringParameters?.apiKey;

  try {
    const { data: profile } = await dataClient.models.UserProfile.get({ id: apiKey ?? "" });
    if (!profile) return json(401, { error: "Invalid API key" });
    return json(200, { data: "ok" });
  } catch (err) {
    console.error("[wayfind-api] error:", err);
    return json(500, { error: "Internal server error" });
  }
};
