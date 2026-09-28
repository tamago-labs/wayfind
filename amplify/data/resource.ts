import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { priceTracker } from "../functions/price-tracker/resource";
import { prestockTracker } from "../functions/prestock-tracker/resource";
import { ohlcvFetcherFunction } from "../functions/ohlcv-fetcher/resource";
import { riskReviewFunction } from "../functions/risk-review/resource";

const schema = a.schema({
  PriceSnapshot: a
    .model({
      symbol: a.string().required(),
      rwa_id: a.integer().required(),
      token_symbol: a.string().required(),
      crypto_id: a.integer().required(),
      price: a.float(),
      market_cap: a.float(),
      volume_24h: a.float(),
      percent_1h: a.float(),
      percent_24h: a.float(),
      percent_7d: a.float(),
      percent_30d: a.float(),
      circulating_supply: a.float(),
      total_supply: a.float(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
    ])
    .secondaryIndexes((index) => [
      index("rwa_id").queryField("byRwaId"),
      index("token_symbol").queryField("byTokenSymbol"),
    ]),
  PreStock: a
    .model({
      symbol: a.string().required(),
      markPrice: a.float(),
      markValuation: a.float(),
      tokenPrice: a.float(),
      impliedValuation: a.float(),
      supply: a.float(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
    ])
    .secondaryIndexes((index) => [
      index("symbol").queryField("bySymbol"),
    ]),
  UserProfile: a
    .model({
      walletAddress: a.string().required(),
      profileName: a.string(),
      credits: a.float().required(),
      experience: a.enum(["newcomer", "regular", "lite_degen", "full_degen"]),
      writingStyle: a.enum(["default", "journalist", "storytelling", "ct_vibes", "concise"]),
      sources: a.string().array(),
      tokenRegistries: a.hasMany("UserTokenRegistry", "userProfileId"),
      portfolios: a.hasMany("Portfolio", "userProfileId"),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update"])])
    .secondaryIndexes((index) => [index("walletAddress").queryField("byWallet")]),

  UserTokenRegistry: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      tokenAddress: a.string().required(),
      symbol: a.string().required(),
      name: a.string(),
      decimals: a.integer(),
      chain: a.enum(["solana", "ethereum", "bnb", "arbitrum", "xlayer"]),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("userProfileId").queryField("byUser")]),

  Portfolio: a
    .model({
      userProfileId: a.id().required(),
      userProfile: a.belongsTo("UserProfile", "userProfileId"),
      name: a.string().required(),
      tokens: a.hasMany("PortfolioToken", "portfolioId"),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [index("userProfileId").queryField("byPortfolioOwner")]),

  PortfolioToken: a
    .model({
      portfolioId: a.id().required(),
      portfolio: a.belongsTo("Portfolio", "portfolioId"),
      symbol: a.string().required(),
      name: a.string(),
      customValue: a.float().required(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "delete"])])
    .secondaryIndexes((index) => [
      index("portfolioId").queryField("byPortfolio"),
    ]),

  AgentSession: a
    .model({
      walletAddress: a.string().required(),
      sessionName: a.string().required(),
      items: a.json().required(),
      transactions: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey().to(["read", "create", "update", "delete"])])
    .secondaryIndexes((index) => [
      index("walletAddress").queryField("bySessionWallet"),
    ]),

  ohlcvFetcher: a
    .query()
    .arguments({
      cryptoId: a.string(),
      interval: a.string(),
      timeStart: a.string(),
      timeEnd: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(ohlcvFetcherFunction)),

  riskReview: a
    .query()
    .arguments({
      userProfileId: a.string().required(),
      prompt: a.string().required(),
      holdings: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(riskReviewFunction)),

}).authorization((allow) => [
  allow.resource(priceTracker),
  allow.resource(prestockTracker),
  allow.resource(riskReviewFunction),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
