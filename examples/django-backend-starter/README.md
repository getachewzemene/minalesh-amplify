# Minalesh Django Backend Starter Kit

This is a reference implementation of a Django backend for the Minalesh e-commerce platform.

## ⚠️ Security Notice

**IMPORTANT:** This starter kit uses security-patched versions of all dependencies (January 2026):

- **Django 4.2.26** - Patched for SQL injection and DoS vulnerabilities
- **Gunicorn 22.0.0** - Patched for HTTP request smuggling
- **Pillow 10.3.0** - Patched for buffer overflow vulnerability

**Before deploying to production:**
1. Always check for the latest security patches: `pip list --outdated`
2. Run security audits: `pip install pip-audit && pip-audit`
3. Subscribe to [Django Security Mailing List](https://groups.google.com/g/django-announce)
4. Review [Django Security Releases](https://www.djangoproject.com/weblog/)

## Quick Start

```bash
# Navigate to this directory
cd examples/django-backend-starter

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## Features Included

- ✅ Product API with Ethiopian Birr (ETB) support
- ✅ Category management with Amharic names
- ✅ Vendor management with TIN validation
- ✅ Order processing
- ✅ JWT authentication
- ✅ Django Admin interface
- ✅ CORS configuration for Next.js
- ✅ Ethiopian tax (15% VAT) calculations
- ✅ API documentation (Swagger)

## API Endpoints

### Authentication
- `POST /api/token/` - Get JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product

### Categories
- `GET /api/categories/` - List categories
- `GET /api/categories/{slug}/` - Get category by slug

### Vendors
- `GET /api/vendors/` - List vendors
- `POST /api/vendors/` - Register vendor
- `GET /api/vendors/{id}/` - Get vendor details

## Environment Variables

Create a `.env` file:

```bash
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/minalesh
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
```

## Project Structure

```
django-backend-starter/
├── manage.py
├── requirements.txt
├── minalesh_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── products/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── admin.py
├── vendors/
│   ├── models.py
│   ├── serializers.py
│   └── views.py
└── orders/
    ├── models.py
    ├── serializers.py
    └── views.py
```

## Integration with Next.js

Update your Next.js `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Use the API client in Next.js:

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProducts() {
  const response = await fetch(`${API_URL}/products/`);
  return response.json();
}
```

## Admin Interface

Access the Django admin at: http://localhost:8000/admin

Use the superuser credentials you created.

## Testing

```bash
# Run tests
python manage.py test

# Run specific app tests
python manage.py test products
```

## Deployment

See [NEXTJS_DJANGO_INTEGRATION_GUIDE.md](../../NEXTJS_DJANGO_INTEGRATION_GUIDE.md) for deployment instructions.

## Ethiopian-Specific Features

### Currency (ETB)
All prices are stored and displayed in Ethiopian Birr.

### VAT Calculation
15% Ethiopian VAT is automatically calculated:

```python
product.price_with_vat  # Returns price + 15% VAT
```

### Regional Support
- Addis Ababa
- Dire Dawa
- Major cities
- Regional areas

### Vendor Verification
- TIN number validation
- Trade license verification
- Business document upload

## Support

For issues or questions, refer to:
- [Django Quick Start Guide](../../DJANGO_QUICKSTART.md)
- [Full Integration Guide](../../NEXTJS_DJANGO_INTEGRATION_GUIDE.md)
