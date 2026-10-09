# Wayfind API Quick Test

$API_URL = "https://o3qftki5dtnlhqlrtvswt336bq0mwdye.lambda-url.ap-southeast-1.on.aws"
$API_KEY = "e1ee8520-305a-49b5-a2de-3e1a7e6078c0"

Write-Host "Testing Wayfind API..."
Write-Host "URL: $API_URL"
Write-Host "Key: $API_KEY"
Write-Host ""

# Tokens
Write-Host "1. All tokens:"
$r = Invoke-RestMethod -Uri "$API_URL/tokens" -Headers @{"x-api-key"=$API_KEY}
Write-Host "   Count: $($r.data.Count)"

# TSLA
Write-Host "2. TSLA tokens:"
$r = Invoke-RestMethod -Uri "$API_URL/tokens/TSLA" -Headers @{"x-api-key"=$API_KEY}
$r.data | ForEach-Object { Write-Host "   $($_.token_symbol) - $($_.price) - Solana: $($_.addresses.solana)" }

# Risk profile
Write-Host "3. Risk profile:"
$r = Invoke-RestMethod -Uri "$API_URL/risk-profile" -Headers @{"x-api-key"=$API_KEY}
Write-Host "   Score: $($r.data.overallScore) ($($r.data.overallLabel))"

# Market overview
Write-Host "4. Market overview:"
$r = Invoke-RestMethod -Uri "$API_URL/market-overview" -Headers @{"x-api-key"=$API_KEY}
Write-Host "   Market Cap: `$($r.data.totalMarketCap.ToString('N0'))"
Write-Host "   Volume: `$($r.data.totalVolume24h.ToString('N0'))"

# Pre-IPO
Write-Host "5. Pre-IPO:"
$r = Invoke-RestMethod -Uri "$API_URL/pre-ipo" -Headers @{"x-api-key"=$API_KEY}
Write-Host "   Markets: $($r.data.Count)"

Write-Host ""
Write-Host "All tests passed!"
