// Wayfind API Test 2: Token Endpoints
// Tests GET /tokens (all) and GET /tokens/:ticker (by asset symbol)
// Validates token structure, Solana addresses, and empty results
// Usage: npx tsx scripts/test-api/2-tokens.ts

import { test, assert, assertEquals, assertDefined, request } from "./config";

export async function run() {
  console.log("🪙 Token Tests");

  await test("GET /tokens returns token list", async () => {
    const { status, body } = await request("/tokens");
    assertEquals(status, 200);
    assertDefined(body.data);
    assert(Array.isArray(body.data), "Data is not an array");
    assert(body.data.length > 0, "No tokens returned");
  });

  await test("Token has expected fields", async () => {
    const { body } = await request("/tokens");
    const token = body.data[0];
    assertDefined(token.token_symbol, "Missing token_symbol");
    assertDefined(token.symbol, "Missing symbol");
    assertDefined(token.price, "Missing price");
    assertDefined(token.name, "Missing name");
    assertDefined(token.addresses, "Missing addresses");
  });

  await test("GET /tokens/TSLA returns TSLA variants", async () => {
    const { status, body } = await request("/tokens/TSLA");
    assertEquals(status, 200);
    assertDefined(body.data);
    assert(body.data.length > 0, "No TSLA tokens found");
    body.data.forEach((t: any) => {
      assertEquals(t.symbol, "TSLA");
    });
  });

  await test("TSLA tokens include Solana addresses", async () => {
    const { body } = await request("/tokens/TSLA");
    const withSolana = body.data.filter((t: any) => t.addresses?.solana);
    assert(withSolana.length > 0, "No TSLA tokens with Solana address");
  });

  await test("Unknown ticker returns empty array", async () => {
    const { status, body } = await request("/tokens/UNKNOWNTICKER");
    assertEquals(status, 200);
    assertEquals(body.data.length, 0);
  });
}

run();


// {
//     "data":  [
//                  {
//                      "token_symbol":  "TSLAX",
//                      "symbol":  "TSLA",
//                      "price":  367.92229917969837,
//                      "market_cap":  70656051.90749286,
//                      "volume_24h":  6047807.91945027,
//                      "percent_1h":  -0.7410647,
//                      "percent_24h":  -0.94427392,
//                      "percent_7d":  -0.64134154,
//                      "percent_30d":  3.49867495,
//                      "name":  "Tesla tokenized stock (xStock)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/37004.png",
//                      "issuer_name":  "Backed Assets",
//                      "crypto_id":  37004,
//                      "addresses":  {
//                                        "solana":  "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
//                                        "ethereum":  "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0",
//                                        "arbitrum":  "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0",
//                                        "bnb":  "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0",
//                                        "xlayer":  "0x8aD3c73F833d3F9A523aB01476625F269aEB7Cf0"
//                                    }
//                  },
//                  {
//                      "token_symbol":  "TSLAon",
//                      "symbol":  "TSLA",
//                      "price":  372.3126373014056,
//                      "market_cap":  17113260.364410084,
//                      "volume_24h":  2765375.5495429,
//                      "percent_1h":  0.00321748,
//                      "percent_24h":  0.35110323,
//                      "percent_7d":  -0.13586463,
//                      "percent_30d":  5.46266121,
//                      "name":  "Tesla Tokenized Stock (Ondo)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/38029.png",
//                      "issuer_name":  "Ondo Assets",
//                      "crypto_id":  38029,
//                      "addresses":  {
//                                        "solana":  "KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo",
//                                        "ethereum":  "0xf6b1117ec07684D3958caD8BEb1b302bfD21103f",
//                                        "arbitrum":  null,
//                                        "bnb":  "0x2494b603319d4d9f9715c9f4496d9e0364b59d93",
//                                        "xlayer":  null
//                                    }
//                  },
//                  {
//                      "token_symbol":  "TSLA",
//                      "symbol":  "TSLA",
//                      "price":  300.00479191867413,
//                      "market_cap":  6063.2498471202825,
//                      "volume_24h":  0,
//                      "percent_1h":  0,
//                      "percent_24h":  0,
//                      "percent_7d":  0,
//                      "percent_30d":  22.46702301,
//                      "name":  "Tesla Tokenized Stock (Hyperliquid)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/39618.png",
//                      "issuer_name":  "Hyperliquid Assets",
//                      "crypto_id":  39618,
//                      "addresses":  {
//                                        "solana":  null,
//                                        "ethereum":  null,
//                                        "arbitrum":  null,
//                                        "bnb":  null,
//                                        "xlayer":  null
//                                    }
//                  },
//                  {
//                      "token_symbol":  "TSLAB",
//                      "symbol":  "TSLA",
//                      "price":  373.28818264941106,
//                      "market_cap":  19692986.33849096,
//                      "volume_24h":  3673819.09834093,
//                      "percent_1h":  -0.04390305,
//                      "percent_24h":  0.42014523,
//                      "percent_7d":  2.88876365,
//                      "percent_30d":  4.94938105,
//                      "name":  "Tesla Tokenized bStocks",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/40214.png",
//                      "issuer_name":  "bStocks",
//                      "crypto_id":  40214,
//                      "addresses":  {
//                                        "solana":  null,
//                                        "ethereum":  null,
//                                        "arbitrum":  null,
//                                        "bnb":  "0x5b1910eaad6450e50f816082aa078c41f10c292f",
//                                        "xlayer":  null
//                                    }
//                  },
//                  {
//                      "token_symbol":  "rTSLA",
//                      "symbol":  "TSLA",
//                      "price":  369.9170511514081,
//                      "market_cap":  4002869.1490913155,
//                      "volume_24h":  610390.96149871,
//                      "percent_1h":  0.09507129,
//                      "percent_24h":  -0.75541534,
//                      "percent_7d":  0.0399232,
//                      "percent_30d":  5.81488833,
//                      "name":  "Tesla Tokenized Stock (Reality)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/40624.png",
//                      "issuer_name":  "Reality",
//                      "crypto_id":  40624,
//                      "addresses":  {
//                                        "solana":  null,
//                                        "ethereum":  null,
//                                        "arbitrum":  "0xf912911c9c8d5131929c758e66e6dc54e65cf3ba",
//                                        "bnb":  null,
//                                        "xlayer":  null
//                                    }
//                  },
//                  {
//                      "token_symbol":  "TSLA",
//                      "symbol":  "TSLA",
//                      "price":  300.00479191867413,
//                      "market_cap":  6063.2498471202825,
//                      "volume_24h":  0,
//                      "percent_1h":  0,
//                      "percent_24h":  0,
//                      "percent_7d":  0,
//                      "percent_30d":  22.46702301,
//                      "name":  "Tesla Tokenized Stock (Robinhood)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/40691.png",
//                      "issuer_name":  "Robinhood",
//                      "crypto_id":  40691,
//                      "addresses":  {
//                                        "solana":  null,
//                                        "ethereum":  null,
//                                        "arbitrum":  null,
//                                        "bnb":  null,
//                                        "xlayer":  null
//                                    }
//                  },
//                  {
//                      "token_symbol":  "WTSLAX",
//                      "symbol":  "TSLA",
//                      "price":  356.4417596195172,
//                      "market_cap":  505876.97709304764,
//                      "volume_24h":  432003.01655552,
//                      "percent_1h":  -0.14913872,
//                      "percent_24h":  1.72383441,
//                      "percent_7d":  -5.29713226,
//                      "percent_30d":  -1.65371672,
//                      "name":  "Wrapped Tesla Tokenized stock (xStock)",
//                      "logo":  "https://s2.coinmarketcap.com/static/img/coins/64x64/37227.png",
//                      "issuer_name":  "Backed Assets",
//                      "crypto_id":  37227,
//                      "addresses":  {
//                                        "solana":  null,
//                                        "ethereum":  null,
//                                        "arbitrum":  null,
//                                        "bnb":  null,
//                                        "xlayer":  "0xc3fdbe3a68ee5de461d30415a8165cf9aefe1171"
//                                    }
//                  }
//              ]
// }
