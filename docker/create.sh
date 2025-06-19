#!/bin/bash

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALMS_COUNT=100
USERS_PER_REALM=100

echo "🔐 REALMS_COUNT=$REALMS_COUNT USERS_PER_REALM=$USERS_PER_REALM"

# Authentication function
authenticate() {
  echo "🔐 Authenticating with Keycloak..."
  ACCESS_TOKEN=$(curl -s \
    -d "client_id=admin-cli" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" | jq -r .access_token)

  if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
    echo "❌ Failed to authenticate. Is Keycloak running at $KEYCLOAK_URL?"
    exit 1
  fi
  echo "✅ Authentication successful."
}

authenticate

i=1
while [[ $i -le $REALMS_COUNT ]]; do
  REALM_NAME="test-realm-$i"
  echo "🌍 Creating realm: $REALM_NAME"

  for attempt in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "$KEYCLOAK_URL/admin/realms" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"realm\": \"$REALM_NAME\",
        \"enabled\": true
      }")

    if [[ "$HTTP_CODE" -eq 201 ]]; then
      echo "✅ Realm $REALM_NAME created. Creating users..."
      break
    elif [[ "$HTTP_CODE" -eq 409 ]]; then
      echo "⚠️  Realm $REALM_NAME already exists. Skipping..."
      break
    elif [[ "$HTTP_CODE" -eq 401 ]]; then
      echo "🔄 Token expired. Re-authenticating..."
      authenticate
    else
      echo "⚠️  Attempt $attempt: Failed to create $REALM_NAME (HTTP $HTTP_CODE)"
    fi
    sleep 1
  done

  if [[ "$HTTP_CODE" -ne 201 && "$HTTP_CODE" -ne 409 ]]; then
    echo "❌ Skipping $REALM_NAME after 5 failed attempts."
    ((i++))
    continue
  fi

  # Only create users if realm was newly created
  if [[ "$HTTP_CODE" -eq 201 ]]; then
    for (( j=1; j<=$USERS_PER_REALM; j++ )); do
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
  fi

  ((i++))
done

echo "🎉 DONE: Created $REALMS_COUNT realms × $USERS_PER_REALM users."
