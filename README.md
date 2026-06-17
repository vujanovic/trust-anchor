# TrustAnchor PKI System

A comprehensive Public Key Infrastructure (PKI) solution for managing X.509 certificates.

## Table of Contents
- [Overview](#overview)
- [Backend (TrustAnchor)](#backend-trustanchor)
- [Frontend (TrustAnchor App)](#frontend-trustanchor-app)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview
TrustAnchor is a PKI system that manages the entire lifecycle of X.509 certificates, featuring:
- Hierarchical CA structure
- Secure key management
- Zero-knowledge identity verification
- Certificate generation, renewal, and revocation
- Multi-factor authentication (MFA)
- Role-based access control

## Backend (TrustAnchor)
The backend is a Spring Boot application that provides RESTful APIs for certificate management.

### Structure
- `src/main/java/inc/visor/trustanchor`: Main package
  - `authentication`: User authentication, registration, MFA, password reset, etc.
  - `certificate`: Certificate generation, signing, revocation, downloading, etc.
  - `organization`: Organization management
  - `user`: User management
  - `encryption`: Encryption services (e.g., for data at rest)
  - `config`: Security, CORS, application configuration
  - `exception`: Custom exceptions and global error handling

### Key Backend Features
- JWT-based authentication with refresh tokens
- Multi-factor authentication (Google Authenticator)
- Role-based access control (admin, user, etc.)
- Certificate lifecycle management (request, issue, renew, revoke)
- CSR (Certificate Signing Request) handling
- CRL (Certificate Revocation List) generation
- PKCS#12 certificate export
- Email notifications for certificate events
- Scheduled tasks (e.g., for certificate expiration checks)

## Frontend (TrustAnchor App)
The frontend is a React application built with Vite and TypeScript.

### Structure
- `src`: Source code
  - `components`: Reusable UI components
  - `pages`: Page components (login, dashboard, certificate management, etc.)
  - `services`: API service functions
  - `hooks`: Custom React hooks
  - `layouts`: Layout components (header, footer, etc.)
  - `types`: TypeScript types and interfaces
  - `config`: Configuration files
  - `assets`: Static assets (images, icons, etc.)

### Key Frontend Features
- Responsive design
- User authentication (login, registration, MFA)
- Dashboard for certificate overview
- Certificate request and management
- Organization and user administration (for admins)
- Certificate details view (including certificate chain and validity)
- Ability to download certificates in various formats (PEM, PKCS#12)
- Certificate revocation management
- Audit logs (if implemented)

## Key Features
- **Certificate Lifecycle Management**: From request to revocation.
- **Multi-Factor Authentication**: Using TOTP (Google Authenticator).
- **Role-Based Access Control**: Different permissions for admin and regular users.
- **Secure Key Management**: Private keys are handled securely.
- **Automated Renewal and Expiration Handling**: Scheduled checks for expiring certificates.
- **Interoperability**: Supports standard X.509 certificates and PKCS#12 format.
- **RESTful API**: Well-documented endpoints for integration.
- **Modern Frontend**: Built with React, TypeScript, and Vite for a smooth user experience.

## Technologies Used
### Backend
- Java 17+
- Spring Boot 3.x
- Spring Security (JWT, method-level security)
- Spring Data JPA
- Hibernate (ORM)
- PostgreSQL (configured in application.properties)
- Lombok (if used, but not seen in the snippet)
- Bouncy Castle (for certificate operations, inferred)
- Google Authenticator library (for MFA)
- Spring Vault (for secret management)
- Spring Mail (for email notifications)

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- React Router (for routing, inferred from structure)
- Axios or Fetch (for API calls)
- Tailwind CSS or similar (from the presence of `index.css` and `components.json`)
- Headless UI or similar (for accessible components)

## Getting Started
### Prerequisites
- Java JDK 17 or higher
- Node.js 18+ and npm/pnpm
- A relational database (e.g., PostgreSQL)

### Backend Setup
1. Clone the repository.
2. Navigate to the `trustanchor` directory.
3. Configure the application properties (database, email, etc.) in `src/main/resources/application.properties` or `application.yml`.
4. Run the application: `./mvnw spring-boot:run` (or use your IDE).

### Frontend Setup
1. Navigate to the `trustanchor-app` directory.
2. Install dependencies: `pnpm install` (or `npm install`).
3. Start the development server: `pnpm dev` (or `npm run dev`).
4. The frontend will be available at `http://localhost:5173`.

## API Documentation
The backend API is documented via Swagger/OpenAPI (if implemented) or can be found in the controller classes.
Key API endpoints include:
- `/api/v1/auth/*` (authentication, registration, MFA, password reset)
- `/api/v1/org/*` (organization management)
- `/api/v1/user/*` (user management)
- `/api/v1/certificate/*` (certificate operations)
- `/api/v1/encryption/*` (encryption services)
- `/api/v1/crl/*` (certificate revocation list)

For detailed request/response structures, refer to the DTO classes in each module.

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.