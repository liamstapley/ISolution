set -euo pipefail

BASE=${BASE:-http://127.0.0.1:8000}
USER=${USER_NAME:-alice}
PASS=${USER_PASS:-secret}

need_jq() {
  command -v jq >/dev/null 2>&1 || {
    echo "Please: brew install jq (or set TOKEN manually)"; exit 1;
  }
}

echo ">> Health check"
curl -s "$BASE/api/health" | jq .

echo ">> Register (ok if already exists)"
curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"password\":\"$PASS\",\"name\":\"Alice\",\"interests\":[\"ai\",\"healthcare\",\"hackathons\"],\"location\":\"Newark, DE\",\"preferred_days\":[\"Fri\",\"Sat\"]}" \
  | jq . || true

echo ">> Login"
need_jq
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER\",\"password\":\"$PASS\"}" | jq -r .access_token)
[ -n "$TOKEN" ] || { echo "Login failed; empty TOKEN"; exit 1; }

echo ">> /api/me"
ME=$(curl -s "$BASE/api/me" -H "Authorization: Bearer $TOKEN")
echo "$ME" | jq .
USER_ID=$(echo "$ME" | jq -r .id)

echo ">> Create 3 events"
E1=$(curl -s -X POST "$BASE/api/events" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title":"Delaware Health Tech Meetup",
    "description":"Talks on AI in healthcare.",
    "apply_url":"https://example.com/healthtech",
    "starts_at":"2025-09-20T18:00:00-04:00",
    "ends_at":"2025-09-20T20:00:00-04:00",
    "venue":"Downtown Hub",
    "location":"Newark, DE",
    "latitude":39.6837,"longitude":-75.7497,
    "tags":["healthcare","ai","meetup"],
    "organizers":["CS Club"],
    "price_amount":0,
    "source":"cache",
    "evidence_urls":["https://example.com/healthtech"]
  }')
ID1=$(echo "$E1" | jq -r .id)

E2=$(curl -s -X POST "$BASE/api/events" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title":"Campus Hack Night",
    "description":"Casual hack night, open to all.",
    "apply_url":"https://example.com/hacknight",
    "starts_at":"2025-09-27T19:00:00-04:00",
    "venue":"Innovation Lab",
    "location":"Newark, DE",
    "latitude":39.68,"longitude":-75.75,
    "tags":["hackathon","coding"],
    "organizers":["HEN Hacks"],
    "price_amount":0,
    "source":"cache",
    "evidence_urls":["https://example.com/hacknight"]
  }')
ID2=$(echo "$E2" | jq -r .id)

E3=$(curl -s -X POST "$BASE/api/events" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "title":"Nonprofit Volunteering Fair",
    "description":"Local orgs recruiting tech volunteers.",
    "apply_url":"https://example.com/np-fair",
    "starts_at":"2025-10-05T13:00:00-04:00",
    "venue":"Community Center",
    "location":"Wilmington, DE",
    "latitude":39.7447,"longitude":-75.5484,
    "tags":["nonprofit","volunteering"],
    "organizers":["EPIC Delaware"],
    "price_amount":0,
    "source":"cache",
    "evidence_urls":["https://example.com/np-fair"]
  }')
ID3=$(echo "$E3" | jq -r .id)

echo "Created event IDs: $ID1, $ID2, $ID3"

echo ">> Seed dummy embeddings (same dimension for all)"
curl -s -X POST "$BASE/api/embeddings/events" -H "Content-Type: application/json" \
  -d "{\"event_id\":$ID1,\"vector\":[0.9,0.8,0.1,0.0,0.2,0.1,0.0,0.3],\"model_name\":\"test-embed\",\"task_type\":\"RETRIEVAL_DOCUMENT\"}" | jq .
curl -s -X POST "$BASE/api/embeddings/events" -H "Content-Type: application/json" \
  -d "{\"event_id\":$ID2,\"vector\":[0.85,0.75,0.05,0.1,0.1,0.05,0.0,0.2],\"model_name\":\"test-embed\",\"task_type\":\"RETRIEVAL_DOCUMENT\"}" | jq .
curl -s -X POST "$BASE/api/embeddings/events" -H "Content-Type: application/json" \
  -d "{\"event_id\":$ID3,\"vector\":[0.1,0.1,0.9,0.8,0.1,0.2,0.7,0.6],\"model_name\":\"test-embed\",\"task_type\":\"RETRIEVAL_DOCUMENT\"}" | jq .

echo ">> Seed user query embedding"
curl -s -X POST "$BASE/api/embeddings/user" -H "Content-Type: application/json" \
  -d "{\"user_id\":$USER_ID,\"vector\":[0.88,0.77,0.08,0.05,0.15,0.1,0.0,0.25],\"model_name\":\"test-embed\",\"task_type\":\"RETRIEVAL_QUERY\"}" | jq .

echo ">> Get recommendations"
curl -s "$BASE/api/recommendations/test?user_id=$USER_ID&top_k=10" | jq .
echo "✅ Done"
