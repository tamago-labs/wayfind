# Wayfind API Test Scripts

$API_URL = "https://o3qftki5dtnlhqlrtvswt336bq0mwdye.lambda-url.ap-southeast-1.on.aws"
$API_KEY = "e1ee8520-305a-49b5-a2de-3e1a7e6078c0"
$HEADERS = @{"x-api-key" = $API_KEY}

# ─── Test 1: No API key ──────────────────────────────────────────────────────
Write-Host "=== Test 1: No API key (expect 401) ==="
try {
  $r = Invoke-RestMethod -Uri "$API_URL/tokens" -ErrorAction Stop
  Write-Host "UNEXPECTED: $($r | ConvertTo-Json -Depth 2)"
} catch {
  Write-Host "OK: $($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
}

# ─── Test 2: Invalid API key ─────────────────────────────────────────────────
Write-Host "`n=== Test 2: Invalid API key (expect 401) ==="
try {
  $r = Invoke-RestMethod -Uri "$API_URL/tokens" -Headers @{"x-api-key"="invalid-key"} -ErrorAction Stop
  Write-Host "UNEXPECTED: $($r | ConvertTo-Json -Depth 2)"
} catch {
  Write-Host "OK: $($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
}

# ─── Test 3: Get all tokens ──────────────────────────────────────────────────
Write-Host "`n=== Test 3: GET /tokens ==="
$r = Invoke-RestMethod -Uri "$API_URL/tokens" -Headers $HEADERS
Write-Host "Token count: $($r.data.Count)"
Write-Host "First token: $($r.data[0].token_symbol) ($($r.data[0].symbol)) - $($r.data[0].price)"

# ─── Test 4: Get tokens by ticker ───────────────────────────────────────────
Write-Host "`n=== Test 4: GET /tokens/TSLA ==="
$r = Invoke-RestMethod -Uri "$API_URL/tokens/TSLA" -Headers $HEADERS
Write-Host "TSLA variants: $($r.data.Count)"
$r.data | ForEach-Object { Write-Host "  $($_.token_symbol) - $($_.issuer_name) - Solana: $($_.addresses.solana)" }

# ─── Test 5: Get risk profile ────────────────────────────────────────────────
Write-Host "`n=== Test 5: GET /risk-profile ==="
try {
  $r = Invoke-RestMethod -Uri "$API_URL/risk-profile" -Headers $HEADERS
  Write-Host "Score: $($r.data.overallScore)"
  Write-Host "Label: $($r.data.overallLabel)"
  Write-Host "Answers count: $($r.data.answers.Count)"
} catch {
  Write-Host "Error: $($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
}

# ─── Test 6: Get market overview ────────────────────────────────────────────
Write-Host "`n=== Test 6: GET /market-overview ==="
$r = Invoke-RestMethod -Uri "$API_URL/market-overview" -Headers $HEADERS
Write-Host "Total Market Cap: `$($r.data.totalMarketCap.ToString('N0'))"
Write-Host "Total Volume 24h: `$($r.data.totalVolume24h.ToString('N0'))"
Write-Host "Token Count: $($r.data.tokenCount)"
Write-Host "Top Gainer: $($r.data.gainers[0].token_symbol) ($($r.data.gainers[0].percent_24h)%)"

# ─── Test 7: Get pre-IPO markets ────────────────────────────────────────────
Write-Host "`n=== Test 7: GET /pre-ipo ==="
$r = Invoke-RestMethod -Uri "$API_URL/pre-ipo" -Headers $HEADERS
Write-Host "Pre-IPO markets: $($r.data.Count)"
if ($r.data.Count -gt 0) {
  Write-Host "First: $($r.data[0].symbol) - Token: $($r.data[0].tokenPrice) - Mark: $($r.data[0].markPrice)"
}

# ─── Test 8: Unknown endpoint ────────────────────────────────────────────────
Write-Host "`n=== Test 8: GET /unknown (expect 404) ==="
try {
  $r = Invoke-RestMethod -Uri "$API_URL/unknown" -Headers $HEADERS -ErrorAction Stop
  Write-Host "UNEXPECTED: $($r | ConvertTo-Json -Depth 2)"
} catch {
  Write-Host "OK: $($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
}

Write-Host "`n=== All tests complete ==="
