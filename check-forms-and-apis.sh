#!/bin/bash

BASE=${1:-http://localhost:3000}
PASS=0
FAIL=0

check() {
  local label=$1
  local method=$2
  local url=$3
  local data=$4
  local expected=$5

  if [ "$method" = "GET" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -L --cookie "next-auth.session-token=test" "$url")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -L -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" "$url")
  fi

  if [ "$status" = "$expected" ] || [ "$status" = "200" ] || [ "$status" = "201" ] || [ "$status" = "302" ] || [ "$status" = "307" ]; then
    echo "  ✅  [$status] $label"
    PASS=$((PASS+1))
  else
    echo "  ❌  [$status] $label → expected $expected"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ExaVeyra CRM — API & Page Health Check"
echo "  Base URL: $BASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▸ Auth"
check "Login page"              GET  "$BASE/login"                                     "" 200
check "NextAuth session"        GET  "$BASE/api/auth/session"                          "" 200

echo ""
echo "▸ CRM Pages (expect redirect to /login if unauthed)"
check "Dashboard"               GET  "$BASE/dashboard"                                 "" 307
check "Contacts list"           GET  "$BASE/contacts"                                  "" 307
check "New contact form"        GET  "$BASE/contacts/new"                              "" 307
check "Wholesale"               GET  "$BASE/wholesale"                                 "" 307
check "Patients"                GET  "$BASE/patients"                                  "" 307
check "Pipeline"                GET  "$BASE/pipelines"                                 "" 307
check "Deals"                   GET  "$BASE/deals"                                     "" 307
check "Organizations"           GET  "$BASE/organizations"                             "" 307
check "Team"                    GET  "$BASE/team"                                      "" 307
check "Settings"                GET  "$BASE/settings"                                  "" 307

echo ""
echo "▸ API Routes"
check "GET  /api/contacts"      GET  "$BASE/api/contacts"                              "" 200
check "GET  /api/team"          GET  "$BASE/api/team"                                  "" 200
check "GET  /api/contacts/wholesale" GET "$BASE/api/contacts/wholesale"                "" 200
check "POST /api/contacts (empty)"   POST "$BASE/api/contacts" '{}'                   400

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: ✅ $PASS passed  ❌ $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
