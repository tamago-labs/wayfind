import { defineFunction } from "@aws-amplify/backend";

export const prestockTracker = defineFunction({
  name: "prestock-tracker",
  schedule: "every 6h",
  timeoutSeconds: 300,
});
