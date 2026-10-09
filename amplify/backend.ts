import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Function as LambdaFunction, FunctionUrl, InvokeMode, FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { data } from "./data/resource";
import { priceTracker } from "./functions/price-tracker/resource";
import { prestockTracker } from "./functions/prestock-tracker/resource";
import { ohlcvFetcherFunction } from "./functions/ohlcv-fetcher/resource";
import { riskReviewFunction } from "./functions/risk-review/resource";
import { chatFurtherFunction } from "./functions/chat-further/resource";
// import { wayfindApiFunction } from "./functions/wayfind-api/resource";

const backend = defineBackend({
  data,
  priceTracker,
  prestockTracker,
  ohlcvFetcherFunction,
  riskReviewFunction,
  chatFurtherFunction,
  // wayfindApiFunction,
});

const chatLambda = backend.chatFurtherFunction.resources.lambda as LambdaFunction;
// const apiLambda = backend.wayfindApiFunction.resources.lambda as LambdaFunction;

const chatFunctionUrl = chatLambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  invokeMode: InvokeMode.RESPONSE_STREAM,
  cors: {
    allowCredentials: true,
    allowedOrigins: ["*"],
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ["*"],
    maxAge: Duration.minutes(5),
  },
});

// const apiFunctionUrl = apiLambda.addFunctionUrl({
//   authType: FunctionUrlAuthType.NONE,
//   invokeMode: InvokeMode.BUFFERED,
//   cors: {
//     allowedOrigins: ["*"],
//     allowedMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
//     allowedHeaders: ["*"],
//     maxAge: Duration.minutes(5),
//   },
// });

backend.addOutput({
  custom: {
    chatFurther: {
      functionUrl: chatFunctionUrl.url,
      region: Stack.of(chatLambda).region,
      functionName: chatLambda.functionName,
    },
    wayfindApi: {
      // functionUrl: apiFunctionUrl.url,
      // region: Stack.of(apiLambda).region,
      // functionName: apiLambda.functionName,
    },
  },
});
