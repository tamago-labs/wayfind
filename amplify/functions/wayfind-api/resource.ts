import { defineFunction } from "@aws-amplify/backend";

export const wayfindApiFunction = defineFunction({
  name: "wayfind-api",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    OKX_API_KEY: process.env.OKX_API_KEY ?? "",
    OKX_SECRET_KEY: process.env.OKX_SECRET_KEY ?? "",
    OKX_PASSPHRASE: process.env.OKX_PASSPHRASE ?? "",
  },
});
