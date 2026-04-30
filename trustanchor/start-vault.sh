#!/bin/bash
# start-vault.sh
# Run this every time you need to start Vault

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"

echo "=== Starting Vault ==="
echo ""

# Check for .env file
if [ ! -f "$ENV_FILE" ]; then
    echo "[ERROR] .env file not found!"
    echo "Run ./init-vault.sh first to set up Vault"
    exit 1
fi

# Load environment variables
echo "Loading environment variables..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "Starting Docker Compose..."
docker compose up -d

# Wait for Vault to be ready
echo "Waiting for Vault to start..."
sleep 3

# Check Vault status
echo "Checking Vault status..."
IS_SEALED=true

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$VAULT_ADDR/v1/sys/health" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    IS_SEALED=false
elif [ "$HTTP_CODE" = "503" ]; then
    IS_SEALED=true
else
    echo "[ERROR] Vault is not responding (HTTP $HTTP_CODE)"
    echo "   Is the Docker container running?"
    exit 1
fi

if [ "$IS_SEALED" = true ]; then
    echo "Unsealing Vault..."

    if [ -z "$VAULT_UNSEAL_KEY" ]; then
        echo "[ERROR] VAULT_UNSEAL_KEY is missing from .env"
        exit 1
    fi

    UNSEAL_BODY="{\"key\": \"$VAULT_UNSEAL_KEY\"}"
    UNSEAL_RESULT=$(curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" \
        -H "Content-Type: application/json" \
        -d "$UNSEAL_BODY")

    IS_STILL_SEALED=$(echo "$UNSEAL_RESULT" | grep -o '"sealed":true' || true)
    if [ -z "$IS_STILL_SEALED" ]; then
        echo "[OK] Vault unsealed successfully!"
    else
        echo "[ERROR] Vault is still sealed after unseal attempt"
        exit 1
    fi
else
    echo "[OK] Vault is already unsealed"
fi

echo ""
echo "Validating secrets..."

# Check for required variables
MISSING_VARS=""
if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS="$MISSING_VARS JWT_SECRET"
fi
if [ -z "$MASTER_ENCRYPTION_KEY" ]; then
    MISSING_VARS="$MISSING_VARS MASTER_ENCRYPTION_KEY"
fi
if [ -z "$VAULT_TOKEN" ]; then
    MISSING_VARS="$MISSING_VARS VAULT_TOKEN"
fi

if [ -n "$MISSING_VARS" ]; then
    echo "[ERROR] Missing or empty required variables in .env:$MISSING_VARS"
    echo "Add them to .env and re-run this script."
    exit 1
fi

echo "Syncing secrets to Vault..."

SECRET_BODY=$(cat << EOF
{
    "data": {
        "jwt.secret": "$JWT_SECRET",
        "master.encryption.key": "$ENCRYPTION_KEY"
    }
}
EOF
)

SYNC_RESULT=$(curl -s -X PATCH "$VAULT_ADDR/v1/secret/data/application" \
    -H "Content-Type: application/merge-patch+json" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d "$SECRET_BODY")

if echo "$SYNC_RESULT" | grep -q "error"; then
    if echo "$SYNC_RESULT" | grep -q "403"; then
        echo "[ERROR] Vault token is invalid or expired (403 Forbidden)"
        echo "   Re-run ./init-vault.sh to reinitialize Vault with a fresh token."
    else
        echo "[ERROR] Failed to sync secrets: $SYNC_RESULT"
    fi
    exit 1
fi

echo "[OK] Secrets synced to Vault"

# Refresh application-local.properties
cat > "$SCRIPT_DIR/application-local.properties" << EOF
VAULT_TOKEN=$VAULT_TOKEN
VAULT_ADDR=$VAULT_ADDR
EOF

echo "[OK] application-local.properties refreshed for Spring Boot"

echo ""
echo "=== Vault is ready! ==="
echo ""
echo "You can now start your Spring Boot application"
echo ""
