import { defineFunction } from "@aws-amplify/backend";

export const wayfindApiFunction = defineFunction({
  name: "wayfind-api",
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    WAYFIN_API: "true",
  },
});
