## 1. Environment Installation

### Linux

Install Docker and curl (required for Vault API calls):

```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install -y docker.io curl

# Fedora/RHEL
sudo dnf install -y docker curl
```

Ensure your user can run Docker commands:

```bash
sudo usermod -aG docker $USER && newgrp docker
```

### Windows

Install HashiCorp Vault CLI and OpenSSL using Chocolatey:

```PowerShell
choco install vault
choco install openssl
```

## 2. Initial Provisioning

Before the first service execution, the environment must be provisioned. This script handles the initial storage configuration and security initialization.

### Linux

```bash
./init-vault.sh
```

### Windows

```PowerShell
./trustanchor/init-vault.ps1
```

## 3. Operational Workflow

To maintain service integrity, follow this specific sequence for every development session:

### Phase I: Vault Service Activation

The Vault instance must be active and unsealed before the application layer attempts to connect.

**Linux:**
```bash
./start-vault.sh
```

**Windows:**
```PowerShell
./trustanchor/start-vault.ps1
```

### Phase II: Application Deployment

Once the Vault service is confirmed to be in a "ready" state, proceed with launching the Spring Boot application and make sure to add .env in your configuration.