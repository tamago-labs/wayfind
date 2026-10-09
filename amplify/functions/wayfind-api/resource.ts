import { defineFunction } from "@aws-amplify/backend";

export const wayfindApiFunction = defineFunction({
  name: "wayfin-api",
  timeoutSeconds: 60,
  memoryMB: 512,
});
