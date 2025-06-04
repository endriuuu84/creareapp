# DNS Configuration for creareapp.it

## Records to add in your domain provider:

### Primary domain (creareapp.it):
```
Type: A
Name: @ (or leave empty)
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

### WWW subdomain:
```
Type: CNAME
Name: www
Value: [your-netlify-site].netlify.app
TTL: 3600 (or Auto)
```

## Alternative (if A record doesn't work):
```
Type: CNAME
Name: @
Value: [your-netlify-site].netlify.app
TTL: 3600
```

## Verification commands:
```bash
# Check A record
dig creareapp.it

# Check CNAME
dig www.creareapp.it

# Check propagation
nslookup creareapp.it
```

## Timeline:
- DNS propagation: 0-48 hours (usually 15-30 minutes)
- SSL certificate: automatic after DNS resolves
- Full setup: 30-60 minutes typically

## Troubleshooting:
1. If using Cloudflare: turn off proxy (orange cloud) initially
2. If using other providers: check if CNAME flattening is available
3. Some providers require different syntax for @ record