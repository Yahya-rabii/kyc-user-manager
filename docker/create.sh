#!/bin/bash

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALMS_COUNT=100
USERS_PER_REALM=100

echo "🔐 Authenticating with Keycloak..."
ACCESS_TOKEN=$(curl -s \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" \
  "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" | jq -r .access_token)

if [[ "$ACCESS_TOKEN" == "null" || -z "$ACCESS_TOKEN" ]]; then
  echo "❌ Failed to authenticate. Is Keycloak running at http://localhost:8080?"
  exit 1
fi

echo "✅ Authentication successful."

for (( i=1; i<=$REALMS_COUNT; i++ ))
do
  REALM_NAME="test-realm-$i"
  echo "🌍 Creating realm: $REALM_NAME"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$KEYCLOAK_URL/admin/realms" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"realm\": \"$REALM_NAME\",
      \"enabled\": true
    }")

  if [[ "$HTTP_CODE" -ne 201 ]]; then
    echo "⚠️  Failed to create realm $REALM_NAME (HTTP $HTTP_CODE)"
    continue
  fi

  echo "✅ Realm $REALM_NAME created. Creating users..."

  for (( j=1; j<=$USERS_PER_REALM; j++ ))
  do
    USERNAME="user$j"
    PASSWORD="password$j"

    curl -s -o /dev/null -w "%{http_code}" \
      -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"username\": \"$USERNAME\",
        \"enabled\": true,
        \"credentials\": [
          {
            \"type\": \"password\",
            \"value\": \"$PASSWORD\",
            \"temporary\": false
          }
        ]
      }" | grep -q "201"

    if (( j % 10 == 0 )); then
      echo "  → Created $j users in $REALM_NAME"
    fi
  done

  echo "✅ Finished $REALM_NAME"
done

echo "🎉 DONE: Created $REALMS_COUNT realms × $USERS_PER_REALM users."
