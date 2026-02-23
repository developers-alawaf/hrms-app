#!/bin/bash
# Test dashboard APIs locally
# Usage: ./test-dashboard-api.sh [BASE_URL]
# Default BASE_URL: http://localhost:5000

BASE_URL="${1:-http://localhost:5000}"

# Extract token from JSON without jq (works on servers without jq)
extract_token() {
  echo "$1" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"$//'
}

echo "=========================================="
echo "Testing Dashboard APIs at $BASE_URL"
echo "=========================================="

# 1. Login (try shamim first, then superadmin)
echo ""
echo "1. LOGIN"
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"shamim.khaled@alawaf.com.bd","password":"shamim"}')
HTTP_CODE=$(echo "$LOGIN_RESP" | tail -n1)
BODY=$(echo "$LOGIN_RESP" | sed '$d')
if [ "$HTTP_CODE" != "200" ]; then
  LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@example.com","password":"12345"}')
  HTTP_CODE=$(echo "$LOGIN_RESP" | tail -n1)
  BODY=$(echo "$LOGIN_RESP" | sed '$d')
fi
echo "   HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  TOKEN=$(extract_token "$BODY")
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "   OK - Token obtained"
  else
    echo "   FAIL - No token in response"
    exit 1
  fi
else
  echo "   FAIL - Login failed"
  exit 1
fi

# 2. GET /api/dashboard-all (primary - single request)
echo ""
echo "2. GET /api/dashboard-all (primary)"
ALL_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard-all")
ALL_CODE=$(echo "$ALL_RESP" | tail -n1)
echo "   HTTP: $ALL_CODE"
if [ "$ALL_CODE" = "200" ]; then
  echo "   OK"
else
  echo "   FAIL"
fi

# 3. GET /api/dashboard
echo ""
echo "3. GET /api/dashboard"
DASH_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard")
DASH_CODE=$(echo "$DASH_RESP" | tail -n1)
DASH_BODY=$(echo "$DASH_RESP" | sed '$d')
echo "   HTTP: $DASH_CODE"
if [ "$DASH_CODE" = "200" ]; then
  echo "   OK"
else
  echo "   FAIL - Response: $(echo "$DASH_BODY" | head -c 200)"
fi

# 4. GET /api/month-summary (top-level, no nesting)
echo ""
echo "4. GET /api/month-summary"
MONTH_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/month-summary")
MONTH_CODE=$(echo "$MONTH_RESP" | tail -n1)
echo "   HTTP: $MONTH_CODE"
if [ "$MONTH_CODE" = "200" ]; then
  echo "   OK"
else
  echo "   FAIL"
fi

echo ""
echo "5. GET /api/dashboard/month-summary"
NESTED_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard/month-summary")
NESTED_CODE=$(echo "$NESTED_RESP" | tail -n1)
echo "   HTTP: $NESTED_CODE"
if [ "$NESTED_CODE" = "200" ]; then echo "   OK"; else echo "   FAIL"; fi

echo ""
echo "6. GET /api/dashboard/dashboard-stats"
STATS_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/dashboard/dashboard-stats")
STATS_CODE=$(echo "$STATS_RESP" | tail -n1)
STATS_BODY=$(echo "$STATS_RESP" | sed '$d')
echo "   HTTP: $STATS_CODE"
if [ "$STATS_CODE" = "200" ]; then
  echo "   OK"
else
  echo "   Response: $(echo "$STATS_BODY" | head -c 200)"
fi

echo ""
echo "=========================================="
echo "Summary: dashboard-all=$ALL_CODE | dashboard=$DASH_CODE | month-summary=$MONTH_CODE"
echo "=========================================="
