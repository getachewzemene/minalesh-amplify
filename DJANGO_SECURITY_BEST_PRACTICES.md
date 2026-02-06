# Django Security Best Practices for Minalesh

## Critical Security Updates (January 2026)

This document addresses security vulnerabilities found in the initial Django backend examples and provides ongoing security guidance.

## Vulnerability Summary & Fixes

### 1. Django Vulnerabilities (4.2.7 → 4.2.26)

**Critical vulnerabilities patched:**

#### SQL Injection Vulnerabilities
- **CVE Details**: SQL injection in column aliases, HasKey() on Oracle, _connector keyword
- **Affected Versions**: Django < 4.2.26
- **Patched Version**: Django 4.2.26
- **Impact**: HIGH - Could allow attackers to execute arbitrary SQL queries
- **Fix Applied**: ✅ Updated to Django 4.2.26 in requirements.txt

#### Denial of Service (DoS) Vulnerabilities
- **CVE Details**: DoS in HttpResponseRedirect/HttpResponsePermanentRedirect on Windows, intcomma template filter
- **Affected Versions**: Django < 4.2.26
- **Patched Version**: Django 4.2.26
- **Impact**: MEDIUM - Could cause application downtime
- **Fix Applied**: ✅ Updated to Django 4.2.26 in requirements.txt

### 2. Gunicorn Vulnerabilities (21.2.0 → 22.0.0)

**HTTP Request/Response Smuggling**
- **CVE Details**: Request smuggling leading to endpoint restriction bypass
- **Affected Versions**: Gunicorn < 22.0.0
- **Patched Version**: Gunicorn 22.0.0
- **Impact**: HIGH - Could bypass security controls
- **Fix Applied**: ✅ Updated to Gunicorn 22.0.0 in requirements.txt

### 3. Pillow Vulnerabilities (10.1.0 → 10.3.0)

**Buffer Overflow Vulnerability**
- **CVE Details**: Buffer overflow in image processing
- **Affected Versions**: Pillow < 10.3.0
- **Patched Version**: Pillow 10.3.0
- **Impact**: HIGH - Could lead to code execution
- **Fix Applied**: ✅ Updated to Pillow 10.3.0 in requirements.txt

## Updated Requirements File

```txt
# Django Backend Dependencies
# Security: All versions updated to address known vulnerabilities (Jan 2026)

# Core Django - Updated to 4.2.26 to fix SQL injection and DoS vulnerabilities
Django==4.2.26
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0

# CORS and Filters
django-cors-headers==4.3.1
django-filter==23.5

# Database
psycopg2-binary==2.9.9
python-decouple==3.8

# Background Tasks
celery==5.3.4
redis==5.0.1
django-redis==5.4.0

# Image Processing - Updated to 10.3.0 to fix buffer overflow vulnerability
pillow==10.3.0

# Storage
django-storages==1.14.2
boto3==1.34.0

# API Documentation
drf-spectacular==0.27.0

# Production Server - Updated to 22.0.0 to fix request smuggling vulnerabilities
gunicorn==22.0.0

# Static Files
whitenoise==6.6.0
```

## Ongoing Security Practices

### 1. Dependency Management

**Automated Security Scanning**

```bash
# Install security audit tools
pip install pip-audit safety

# Run security audit
pip-audit

# Alternative: Safety check
safety check

# Keep dependencies up to date
pip list --outdated
```

**Add to CI/CD Pipeline:**

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pip-audit
      - name: Run security audit
        run: pip-audit
```

### 2. Django Security Settings

**Production settings.py:**

```python
# Security Settings for Production
DEBUG = False
SECRET_KEY = config('SECRET_KEY')  # Never use default!
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# HTTPS Settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", 'data:', 'https:')

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Database Connection Security
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
        'OPTIONS': {
            'sslmode': 'require',  # Enforce SSL
        },
        'CONN_MAX_AGE': 600,
    }
}

# Rate Limiting
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
```

### 3. Input Validation & Sanitization

**Always validate user input:**

```python
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework import serializers

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        if value > 999999999:
            raise serializers.ValidationError("Price exceeds maximum value")
        return value
    
    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative")
        return value
```

### 4. SQL Injection Prevention

**Use Django ORM (automatically prevents SQL injection):**

```python
# ✅ SAFE - Uses parameterized queries
products = Product.objects.filter(name__icontains=search_term)

# ❌ DANGEROUS - Never use raw SQL with user input
# products = Product.objects.raw(f"SELECT * FROM products WHERE name LIKE '%{search_term}%'")

# ✅ SAFE - If you must use raw SQL, use parameters
products = Product.objects.raw(
    "SELECT * FROM products WHERE name LIKE %s", 
    [f'%{search_term}%']
)
```

### 5. Authentication & Authorization

**Use Django REST Framework permissions:**

```python
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import permission_classes

@permission_classes([IsAuthenticated])
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
```

### 6. File Upload Security

**Validate uploaded files:**

```python
from django.core.exceptions import ValidationError

def validate_image(image):
    # Check file size
    if image.size > 5 * 1024 * 1024:  # 5MB
        raise ValidationError("Image file too large (max 5MB)")
    
    # Check file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if image.content_type not in allowed_types:
        raise ValidationError("Invalid file type")
    
    return image

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(validators=[validate_image])
```

### 7. Environment Variables

**Never commit secrets to version control:**

```bash
# .env (never commit this file!)
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/db
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
STRIPE_SECRET_KEY=sk_live_...
```

**.gitignore:**
```
.env
.env.local
*.pyc
__pycache__/
db.sqlite3
/media/
/staticfiles/
```

### 8. Logging & Monitoring

**Set up security logging:**

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'security': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/security.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['security'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
```

### 9. Regular Security Audits

**Monthly Security Checklist:**

- [ ] Run `pip-audit` to check for vulnerable dependencies
- [ ] Review Django security releases
- [ ] Update all dependencies to latest patched versions
- [ ] Review access logs for suspicious activity
- [ ] Test backup and recovery procedures
- [ ] Review and rotate API keys/secrets
- [ ] Audit user permissions and access controls
- [ ] Review CORS settings
- [ ] Check for exposed sensitive data in logs
- [ ] Verify SSL/TLS certificates are valid

### 10. Ethiopian Market-Specific Security

**TIN Number Validation:**

```python
import re

def validate_ethiopian_tin(tin):
    """
    Validate Ethiopian TIN format
    TIN should be 10 digits
    """
    if not re.match(r'^\d{10}$', tin):
        raise ValidationError("Invalid TIN format. Must be 10 digits.")
    return tin

class VendorSerializer(serializers.ModelSerializer):
    tin_number = serializers.CharField(validators=[validate_ethiopian_tin])
```

**Payment Gateway Security:**

```python
# Telebirr integration security
import hmac
import hashlib

def verify_telebirr_signature(payload, signature, secret_key):
    """Verify Telebirr webhook signature"""
    expected_signature = hmac.new(
        secret_key.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)
```

## Security Resources

### Django Security
- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [Django Security Policy](https://docs.djangoproject.com/en/stable/internals/security/)
- [OWASP Django Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Django_Security_Cheat_Sheet.html)

### Mailing Lists
- [Django Security Announcements](https://groups.google.com/g/django-announce)
- [Django Developers](https://groups.google.com/g/django-developers)

### Tools
- [pip-audit](https://pypi.org/project/pip-audit/) - Scan for vulnerable packages
- [Safety](https://pypi.org/project/safety/) - Check dependencies for known vulnerabilities
- [Bandit](https://bandit.readthedocs.io/) - Security linter for Python
- [Django Security Check](https://django-security-check.readthedocs.io/) - Django-specific security checks

## Summary

### Immediate Actions Required

1. ✅ **Update requirements.txt** with patched versions:
   - Django 4.2.26
   - Gunicorn 22.0.0
   - Pillow 10.3.0

2. ✅ **Add security scanning** to CI/CD pipeline

3. ✅ **Review production settings** for security hardening

4. ✅ **Set up monitoring** for security events

5. ✅ **Subscribe** to Django security mailing list

### Long-term Security Strategy

- **Weekly**: Run automated security scans
- **Monthly**: Review and update dependencies
- **Quarterly**: Conduct security audits
- **Yearly**: Penetration testing

---

**Last Updated**: January 2026  
**Next Review**: February 2026

For questions or concerns, refer to the Django security documentation or consult with a security professional.
