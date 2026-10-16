import { defineFunction } from "@aws-amplify/backend";

export const prestockTracker = defineFunction({
  name: "prestock-tracker",
  // schedule: "every 6h", // disabled for multi-chain migration
  timeoutSeconds: 300,
});
