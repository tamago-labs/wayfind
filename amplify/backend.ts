import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { priceTracker } from "./functions/price-tracker/resource";
import { prestockTracker } from "./functions/prestock-tracker/resource";
import { ohlcvFetcherFunction } from "./functions/ohlcv-fetcher/resource";
import { riskReviewFunction } from "./functions/risk-review/resource";

const backend = defineBackend({
  data,
  priceTracker,
  prestockTracker,
  ohlcvFetcherFunction,
  riskReviewFunction,
});
