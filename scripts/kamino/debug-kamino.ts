const KAMINO_API = "https://api.kamino.finance";

async function main() {
  const markets = [
    { name: "xStocks Market", address: "5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua" },
    { name: "Sentora xStocks Market", address: "8BNUWRSibVasaAmhYpBCFpGgMisGKfVAf9ho3Cmf6vjr" },
  ];

  for (const m of markets) {
    console.log(`\n=== ${m.name} ===`);
    const res = await fetch(`${KAMINO_API}/kamino-market/${m.address}/reserves/metrics`);
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const reserves = data?.data ?? data;
      if (Array.isArray(reserves)) {
        console.log(`Reserves: ${reserves.length}`);
        console.log(`First reserve keys: ${Object.keys(reserves[0]).join(", ")}`);
        for (const r of reserves) {
          const token = r.reserve?.token ?? r.reserve ?? r;
          const mint = token.mint ?? token.tokenMint ?? r.liquidityTokenMint ?? "unknown";
          const symbol = token.symbol ?? token.name ?? "unknown";
          console.log(`  ${symbol} | ${mint} | supplyApy=${r.supplyApy ?? ""} | borrowApy=${r.borrowApy ?? ""} | totalSupply=${r.totalSupply ?? ""} | totalBorrow=${r.totalBorrow ?? ""}`);
        }
      } else {
        console.log(JSON.stringify(data, null, 2).substring(0, 2000));
      }
    } else {
      console.log(JSON.stringify(data).substring(0, 500));
    }
  }
}

main().catch(console.error);
