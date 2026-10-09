// Wayfind API Test Configuration
// Shared config and test utilities for all API test scripts
// Update API_URL and API_KEY here for your environment

export const API_URL = "https://o3qftki5dtnlhqlrtvswt336bq0mwdye.lambda-url.ap-southeast-1.on.aws";
export const API_KEY = "e1ee8520-305a-49b5-a2de-3e1a7e6078c0";

interface ApiResponse {
  data?: any;
  error?: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

const results: TestResult[] = [];

function pass(name: string, duration: number) {
  results.push({ name, passed: true, duration });
  console.log(`  ✅ ${name} (${duration}ms)`);
}

function fail(name: string, message: string, duration: number) {
  results.push({ name, passed: false, message, duration });
  console.log(`  ❌ ${name} — ${message} (${duration}ms)`);
}

export async function request(path: string, apiKey?: string): Promise<{ status: number; body: ApiResponse }> {
  const headers: Record<string, string> = {};
  if (apiKey !== undefined) headers["x-api-key"] = apiKey;
  else headers["x-api-key"] = API_KEY;

  const res = await fetch(`${API_URL}${path}`, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

export async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    pass(name, Date.now() - start);
  } catch (err: any) {
    fail(name, err.message, Date.now() - start);
  }
}

export function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

export function assertDefined(value: any, message?: string) {
  if (value === undefined || value === null) {
    throw new Error(message || "Value is undefined/null");
  }
}

export function getResults() {
  return results;
}
