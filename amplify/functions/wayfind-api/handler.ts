import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { validateApiKey } from "./middleware/auth";
import { handleTokens, handleTokenTicker } from "./routes/tokens";
import { handleRiskProfile } from "./routes/risk-profile";
import { handleMarketOverview } from "./routes/market";
import { handlePreIpo } from "./routes/pre-ipo";

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

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") {
    return json(200, {});
  }

  const apiKey = event.headers["x-api-key"] || event.queryStringParameters?.apiKey;
  const auth = await validateApiKey(apiKey ?? "");
  if (!auth.valid) {
    return json(401, { error: auth.error });
  }

  const profileId = auth.profileId!;
  const path = event.rawPath || event.requestContext.http.path;
  const qs = event.queryStringParameters || {};

  try {
    // GET /api/v1/tokens
    if (path.endsWith("/tokens") || path.endsWith("/tokens/")) {
      const tokens = await handleTokens(qs.chain);
      return json(200, { data: tokens });
    }

    // GET /api/v1/tokens/:ticker
    const tokensMatch = path.match(/\/tokens\/(.+)$/);
    if (tokensMatch) {
      const ticker = decodeURIComponent(tokensMatch[1]);
      const tokens = await handleTokenTicker(ticker);
      return json(200, { data: tokens });
    }

    // GET /api/v1/risk-profile
    if (path.endsWith("/risk-profile")) {
      const result = await handleRiskProfile(profileId);
      if ((result as any).error) return json(404, result);
      return json(200, { data: result });
    }

    // GET /api/v1/market-overview
    if (path.endsWith("/market-overview")) {
      const result = await handleMarketOverview();
      return json(200, { data: result });
    }

    // GET /api/v1/pre-ipo
    if (path.endsWith("/pre-ipo")) {
      const result = await handlePreIpo();
      return json(200, { data: result });
    }

    return json(404, { error: "Not found" });
  } catch (err) {
    console.error("[wayfin-api] error:", err);
    return json(500, { error: "Internal server error" });
  }
};
