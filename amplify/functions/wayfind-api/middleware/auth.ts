import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/wayfin-api";
import type { Schema } from "../../../data/resource";

let cachedClient: ReturnType<typeof generateClient<Schema>> | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
  Amplify.configure(resourceConfig, libraryOptions);
  cachedClient = generateClient<Schema>();
  return cachedClient;
}

export interface AuthResult {
  valid: boolean;
  profileId?: string;
  error?: string;
}

export async function validateApiKey(apiKey: string): Promise<AuthResult> {
  if (!apiKey) return { valid: false, error: "API key required" };

  try {
    const client = await getClient();
    const { data: profile } = await client.models.UserProfile.get({ id: apiKey });
    if (!profile) return { valid: false, error: "Invalid API key" };
    if (profile.apiKeyActive === false) return { valid: false, error: "API key deactivated" };
    return { valid: true, profileId: profile.id };
  } catch {
    return { valid: false, error: "Invalid API key" };
  }
}
