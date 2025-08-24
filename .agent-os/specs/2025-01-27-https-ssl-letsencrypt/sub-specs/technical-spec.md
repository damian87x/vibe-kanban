# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-27-https-ssl-letsencrypt/spec.md

> Created: 2025-01-27
> Version: 1.0.0

## Technical Requirements

- Automatic SSL certificate provisioning using Let's Encrypt
- Support for both standalone and webroot ACME challenges
- Nginx configuration with modern TLS settings (TLS 1.2+)
- Automatic renewal 30 days before expiration
- Multi-domain support (app domain + API domain)
- HTTP to HTTPS redirect with 301 status
- Security headers implementation (HSTS, X-Frame-Options, etc.)
- Certificate status monitoring and alerting
- Graceful fallback during renewal failures

## Approach Options

**Option A: Certbot with Nginx Plugin**
- Pros: 
  - Direct Nginx integration
  - Automatic configuration updates
  - Well-tested and widely used
  - Handles renewal automatically
- Cons: 
  - Requires Nginx plugin installation
  - May conflict with container-based deployments

**Option B: Standalone Certbot with Manual Nginx Config** (Selected)
- Pros:
  - More control over certificate placement
  - Works well with containerized environments
  - Can handle complex domain configurations
  - Better for Cloud Run/Docker deployments
- Cons:
  - Requires manual Nginx configuration
  - More setup steps initially

**Option C: Cloud Run Managed Certificates**
- Pros:
  - Zero configuration needed
  - Automatic renewal by Google
  - No additional containers needed
- Cons:
  - Limited to Cloud Run domains
  - Less control over certificate configuration
  - May not support all domain configurations

**Rationale:** Option B selected as it provides the flexibility needed for our containerized deployment while maintaining control over the SSL configuration. Cloud Run managed certificates can be used as a backup option.

## External Dependencies

- **certbot** - Let's Encrypt ACME client
  - **Justification:** Official Let's Encrypt client with proven reliability
  - **Version:** Latest stable (2.x)
  
- **nginx** - Web server with SSL termination
  - **Justification:** Already in use as reverse proxy
  - **Version:** 1.24+ (for modern TLS support)

## Implementation Details

### Certificate Management Flow
1. Initial provisioning via certbot standalone mode
2. Validation through HTTP-01 challenge
3. Certificate storage in persistent volume
4. Nginx configuration update with new certificates
5. Automatic renewal via cron/systemd timer
6. Post-renewal hook to reload Nginx

### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name app.taskpilot.ai;

    ssl_certificate /etc/letsencrypt/live/app.taskpilot.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.taskpilot.ai/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### Directory Structure
```
/etc/letsencrypt/
├── live/
│   └── app.taskpilot.ai/
│       ├── fullchain.pem
│       ├── privkey.pem
│       └── cert.pem
├── renewal/
│   └── app.taskpilot.ai.conf
└── renewal-hooks/
    └── deploy/
        └── 01-reload-nginx.sh
```

### Environment Variables
- `LETSENCRYPT_EMAIL` - Email for certificate notifications
- `LETSENCRYPT_DOMAINS` - Comma-separated list of domains
- `LETSENCRYPT_STAGING` - Use staging server for testing
- `NGINX_SSL_PROTOCOLS` - Override default SSL protocols
- `NGINX_SSL_CIPHERS` - Override default cipher suite