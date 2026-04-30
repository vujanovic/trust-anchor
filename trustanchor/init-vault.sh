#!/bin/bash
# init-vault.sh
# Run this ONCE when setting up Vault for the first time

set -e

VAULT_ADDR="http://127.0.0.1:8200"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Vault Initial Setup ==="
echo ""

# Start Docker
echo "Starting Docker Compose..."
docker compose up -d
sleep 5

# Initialize Vault via REST API
echo ""
echo "Initializing Vault..."
INIT_BODY='{"secret_shares": 1, "secret_threshold": 1}'

INIT_RESULT=$(curl -s -X POST "$VAULT_ADDR/v1/sys/init" \
    -H "Content-Type: application/json" \
    -d "$INIT_BODY")

if echo "$INIT_RESULT" | grep -q "error"; then
    echo "[ERROR] Failed to initialize Vault: $INIT_RESULT"
    echo "   Is the Docker container running?"
    exit 1
fi

UNSEAL_KEY=$(echo "$INIT_RESULT" | grep -o '"keys_base64":\["[^"]*"' | cut -d'"' -f4)
ROOT_TOKEN=$(echo "$INIT_RESULT" | grep -o '"root_token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "=== SAVE THESE VALUES ==="
echo "Unseal Key: $UNSEAL_KEY"
echo "Root Token: $ROOT_TOKEN"
echo ""

# Write .env file
cat > "$SCRIPT_DIR/.env" << EOF
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=$ROOT_TOKEN
VAULT_UNSEAL_KEY=$UNSEAL_KEY
EOF

echo "[OK] .env file created at: $SCRIPT_DIR/.env"

# Write application-local.properties for Spring Boot
cat > "$SCRIPT_DIR/application-local.properties" << EOF
VAULT_TOKEN=$ROOT_TOKEN
VAULT_ADDR=http://localhost:8200
EOF

echo "[OK] application-local.properties written for Spring Boot"
echo ""

# Unseal Vault
echo "Unsealing Vault..."
UNSEAL_BODY="{\"key\": \"$UNSEAL_KEY\"}"

UNSEAL_RESULT=$(curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" \
    -H "Content-Type: application/json" \
    -d "$UNSEAL_BODY")

IS_SEALED=$(echo "$UNSEAL_RESULT" | grep -o '"sealed":true' || true)
if [ -z "$IS_SEALED" ]; then
    echo "[OK] Vault unsealed successfully!"
else
    echo "[ERROR] Vault is still sealed"
    exit 1
fi

# Enable KV v2 secrets engine
echo ""
echo "Enabling KV v2 secrets engine..."
KV_BODY='{"type": "kv", "options": {"version": "2"}}'

ENABLE_RESULT=$(curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/secret" \
    -H "Content-Type: application/json" \
    -H "X-Vault-Token: $ROOT_TOKEN" \
    -d "$KV_BODY")

if echo "$ENABLE_RESULT" | grep -q "already enabled"; then
    echo "[INFO] KV v2 already enabled at secret/ (skipping)"
else
    echo "[OK] KV v2 enabled at secret/"
fi

# Generate secrets using /dev/urandom
echo ""
echo "Generating secrets..."

# JWT secret: 32 random bytes encoded as Base64
JWT_SECRET=$(head -c 32 /dev/urandom | base64)

# Master encryption key: 32 random bytes encoded as lowercase hex
ENCRYPTION_KEY=$(head -c 32 /dev/urandom | xxd -p | tr -d '\n')

# Store secrets in Vault
echo "Storing secrets in Vault..."
SECRET_BODY=$(cat << EOF
{
    "data": {
        "jwt.secret": "$JWT_SECRET",
        "master.encryption.key": "$ENCRYPTION_KEY"
    }
}
EOF
)

STORE_RESULT=$(curl -s -X POST "$VAULT_ADDR/v1/secret/data/application" \
    -H "Content-Type: application/json" \
    -H "X-Vault-Token: $ROOT_TOKEN" \
    -d "$SECRET_BODY")

if echo "$STORE_RESULT" | grep -q "error"; then
    echo "[ERROR] Failed to store secrets: $STORE_RESULT"
    exit 1
fi

echo "[OK] Secrets stored in Vault"

# Append secrets to .env
cat >> "$SCRIPT_DIR/.env" << EOF
JWT_SECRET=$JWT_SECRET
MASTER_ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF

# Create placeholder paths Spring looks for
PLACEHOLDER_BODY='{"data": {"placeholder": "true"}}'
for path in "secret/data/trustanchor/dev" "secret/data/trustanchor" "secret/data/application/dev"; do
    curl -s -X POST "$VAULT_ADDR/v1/$path" \
        -H "Content-Type: application/json" \
        -H "X-Vault-Token: $ROOT_TOKEN" \
        -d "$PLACEHOLDER_BODY" > /dev/null 2>&1 || true
done

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "[OK] Vault initialized and unsealed"
echo "[OK] KV v2 secrets engine enabled"
echo "[OK] JWT secret generated and stored"
echo "[OK] Encryption key generated and stored"
echo "[OK] .env file created"
echo ""
echo "[WARNING] Save the unseal key and root token somewhere safe!"
echo ""
echo "Next steps:"
echo "  1. Save the unseal key and root token somewhere safe"
echo "  2. Use ./start-vault.sh for daily startup"
echo "  3. Start your Spring Boot app from IntelliJ"
echo ""
