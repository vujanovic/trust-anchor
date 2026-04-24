# TrustAnchor

TrustAnchor is a Public Key Infrastructure (PKI) solution. The system manages the entire lifecycle of X.509 certificates, featuring a hierarchical CA structure, secure key management, and a zero-knowledge identity verification process.


## 1. Environment Installation
To ensure all cryptographic and secret management dependencies are met, execute the following commands using the Chocolatey package manager:

### Install HashiCorp Vault CLI and Service
```PowerShell
choco install vault
```
### Install OpenSSL for certificate and key management
```PowerShell
choco install openssl
```

## 2. Initial Provisioning
Before the first service execution, the environment must be provisioned. This script handles the initial storage configuration and security initialization.
Command:

```PowerShell
./trustanchor/init-vault.ps1
```

## 3. Operational Workflow
To maintain service integrity, follow this specific sequence for every development session:

Phase I: Vault Service Activation
The Vault instance must be active and unsealed before the application layer attempts to connect. Execute the startup script:

```PowerShell
./trustanchor/start-vault.ps1
```
Phase II: Application Deployment
Once the Vault service is confirmed to be in a "ready" state, proceed with launching the Spring Boot application and make sure to add .env in your configuration
