# Next.js + Django Integration Guide

## Executive Summary

**Question:** Should we use Django as a backend for our Next.js e-commerce marketplace?

**Short Answer:** Yes, Django is an excellent choice for your Next.js backend, especially for the Ethiopian marketplace (Minalesh). Here's why:

✅ **Recommended:** Django + Next.js is a proven, powerful combination for e-commerce platforms.

## ⚠️ Security Notice (January 2026)

**IMPORTANT:** Always use the latest patched versions of Django and dependencies. The example requirements in this guide use:

- **Django 4.2.26** (patched for SQL injection and DoS vulnerabilities)
- **Gunicorn 22.0.0** (patched for request smuggling vulnerabilities)
- **Pillow 10.3.0** (patched for buffer overflow vulnerability)

**Before deployment, always:**
1. Check for the latest security patches: `pip list --outdated`
2. Review Django security releases: https://www.djangoproject.com/weblog/
3. Run security audits: `pip-audit` or `safety check`
4. Subscribe to Django security mailing list

See [Django Security Policy](https://docs.djangoproject.com/en/stable/internals/security/) for more information.

## Why Django is a Good Choice for Minalesh

### 1. **E-commerce Ready Features**
Django provides battle-tested solutions that align perfectly with your current needs:

- **Django ORM** - Powerful database abstraction (similar to Prisma but more mature)
- **Django Admin** - Auto-generated admin interface (you're already building custom admin panels)
- **Django REST Framework (DRF)** - Industry-standard API development
- **Authentication & Authorization** - Built-in user management and permissions
- **Security** - Protection against SQL injection, XSS, CSRF, clickjacking
- **Internationalization** - Perfect for Ethiopian languages (Amharic, Tigrinya, Oromo)

### 2. **Ethiopian Market Advantages**

Django excels for the Ethiopian market context:

```python
# Easy to handle Ethiopian Birr (ETB) currency
from decimal import Decimal

class Product(models.Model):
    price_etb = models.DecimalField(max_digits=10, decimal_places=2)
    
# Built-in localization for Ethiopian context
from django.utils.translation import gettext as _

welcome_message = _("እንኳን ደህና መጡ")  # Welcome in Amharic
```

### 3. **Comparison: Django vs Current Next.js API Routes**

| Feature | Current (Next.js API Routes) | Django Backend |
|---------|----------------------------|----------------|
| **Performance** | Good for light workloads | Better for heavy computation |
| **Scalability** | Limited by serverless constraints | Highly scalable with proper setup |
| **Database ORM** | Prisma (good) | Django ORM (more mature, 17+ years) |
| **Admin Interface** | Custom built (requires maintenance) | Auto-generated (saves development time) |
| **Background Tasks** | Limited (cron jobs) | Celery (robust task queue) |
| **Payment Processing** | Stripe integration | Stripe + local Ethiopian payment gateways |
| **Testing** | Vitest | Django Test Framework (comprehensive) |
| **File/Media Handling** | Next.js + AWS S3 | Django + S3 (better control) |
| **API Documentation** | Swagger (custom setup) | DRF auto-documentation |
| **Real-time Features** | Requires additional setup | Django Channels (WebSockets) |
| **Ethiopian Tax/Compliance** | Custom implementation | Can leverage Ethiopian tax libraries |

## Recommended Architecture

### Option 1: Hybrid Architecture (Recommended for Migration)

```
┌─────────────────────────────────────────────────┐
│  Frontend (Next.js 14 - Vercel/Netlify)        │
│  • Server-side rendering (SSR)                  │
│  • Static generation (SSG)                      │
│  • Client-side routing                          │
│  • UI components (Tailwind, shadcn/ui)         │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTPS/REST API
                   │
┌──────────────────▼──────────────────────────────┐
│  Backend (Django - AWS/DigitalOcean)           │
│  • Django REST Framework (DRF)                  │
│  • Authentication (JWT)                         │
│  • Business logic                               │
│  • Database ORM                                 │
│  • Background tasks (Celery)                    │
│  • Admin dashboard                              │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴──────────┬─────────────┐
         │                    │             │
    ┌────▼────┐         ┌────▼────┐   ┌────▼────┐
    │PostgreSQL│         │  Redis  │   │   S3    │
    └─────────┘         └─────────┘   └─────────┘
```

### Option 2: Full Backend Migration

Replace all Next.js API routes with Django backend while keeping Next.js for frontend only.

```
Next.js (Frontend Only) ←→ Django (Full Backend) ←→ PostgreSQL
```

## Step-by-Step Integration Guide

### Phase 1: Setup Django Backend (2-3 weeks)

#### Step 1: Initialize Django Project

```bash
# Create Django project directory
mkdir minalesh-backend
cd minalesh-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Django and essential packages
pip install django djangorestframework django-cors-headers
pip install psycopg2-binary  # PostgreSQL adapter
pip install djangorestframework-simplejwt  # JWT authentication
pip install celery redis  # Background tasks
pip install pillow  # Image processing
pip install django-storages boto3  # S3 integration

# Create Django project
django-admin startproject minalesh_backend .

# Create core apps
python manage.py startapp products
python manage.py startapp users
python manage.py startapp orders
python manage.py startapp vendors
python manage.py startapp payments
```

#### Step 2: Configure Settings

```python
# minalesh_backend/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'storages',
    
    # Local apps
    'products',
    'users',
    'orders',
    'vendors',
    'payments',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration for Next.js
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev
    "https://yourdomain.com",  # Production
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 30,
}

# Database - PostgreSQL (same as current Prisma setup)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'minalesh_db',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# AWS S3 Configuration (same as current setup)
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = 'us-east-1'
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Ethiopian locale support
LANGUAGE_CODE = 'en-us'
LANGUAGES = [
    ('en', 'English'),
    ('am', 'Amharic'),
    ('ti', 'Tigrinya'),
    ('om', 'Oromo'),
]
USE_I18N = True
USE_L10N = True
TIME_ZONE = 'Africa/Addis_Ababa'
USE_TZ = True

# Currency
CURRENCY_CODE = 'ETB'
CURRENCY_SYMBOL = 'ብር'
```

#### Step 3: Create Django Models (Migrate from Prisma)

```python
# products/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=255)
    name_am = models.CharField(max_length=255, blank=True)  # Amharic
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Product(models.Model):
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price in ETB")
    stock = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    images = models.JSONField(default=list)  # Store array of image URLs
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ethiopian specific fields
    requires_trade_license = models.BooleanField(default=False)
    vat_exempt = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['vendor', '-created_at']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def price_with_vat(self):
        """Calculate price including 15% Ethiopian VAT"""
        if self.vat_exempt:
            return self.price
        return self.price * Decimal('1.15')
```

```python
# vendors/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    business_name = models.CharField(max_length=255)
    trade_license_number = models.CharField(max_length=50, unique=True)
    tin_number = models.CharField(max_length=20, unique=True, help_text="Ethiopian TIN")
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    verification_documents = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ethiopian business regions
    REGIONS = [
        ('AA', 'Addis Ababa'),
        ('DD', 'Dire Dawa'),
        ('OR', 'Oromia'),
        ('AM', 'Amhara'),
        ('TG', 'Tigray'),
        ('SO', 'Somali'),
        ('AF', 'Afar'),
        ('SN', 'Southern Nations'),
        ('BG', 'Benishangul-Gumuz'),
        ('GA', 'Gambela'),
        ('HR', 'Harari'),
        ('SW', 'Sidama'),
    ]
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.business_name
```

#### Step 4: Create Django REST Framework API

```python
# products/serializers.py

from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_am', 'slug', 'description', 'parent', 'image_url']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    price_with_vat = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'price_with_vat',
            'stock', 'category', 'category_id', 'images', 'is_active',
            'vendor', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vendor']
```

```python
# products/views.py

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products
    GET /api/products/ - List all products
    POST /api/products/ - Create new product (vendors only)
    GET /api/products/{id}/ - Get product details
    PUT /api/products/{id}/ - Update product (owner only)
    DELETE /api/products/{id}/ - Delete product (owner only)
    """
    queryset = Product.objects.select_related('category', 'vendor').filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'vendor', 'price']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'stock']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories
    GET /api/categories/ - List all categories
    GET /api/categories/{id}/ - Get category details
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
```

```python
# minalesh_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from products.views import ProductViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api-auth/', include('rest_framework.urls')),  # Browsable API
]
```

### Phase 2: Integrate with Next.js Frontend (1-2 weeks)

#### Step 1: Update Next.js Environment Variables

```bash
# .env.local

# Django Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
API_URL=http://localhost:8000/api

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d
```

#### Step 2: Create API Client for Next.js

```typescript
// src/lib/django-api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

export class DjangoAPI {
  private baseURL: string;
  
  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }
  
  private async request<T>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }
    
    return response.json();
  }
  
  // Products
  async getProducts(params?: Record<string, string>) {
    const query = new URLSearchParams(params);
    return this.request(`/products/?${query}`);
  }
  
  async getProduct(id: string) {
    return this.request(`/products/${id}/`);
  }
  
  async createProduct(data: any, token: string) {
    return this.request('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }
  
  // Categories
  async getCategories() {
    return this.request('/categories/');
  }
  
  // Authentication
  async login(email: string, password: string) {
    return this.request('/token/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
  
  async refreshToken(refreshToken: string) {
    return this.request('/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }
}

export const djangoAPI = new DjangoAPI();
```

#### Step 3: Update Next.js Pages to Use Django API

```typescript
// app/products/page.tsx

import { djangoAPI } from '@/lib/django-api';

export default async function ProductsPage() {
  const products = await djangoAPI.getProducts({
    page: '1',
    ordering: '-created_at',
  });
  
  return (
    <div>
      <h1>Products from Django Backend</h1>
      {/* Render products */}
    </div>
  );
}
```

### Phase 3: Background Tasks with Celery (1 week)

```python
# minalesh_backend/celery.py

from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'minalesh_backend.settings')

app = Celery('minalesh_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

```python
# products/tasks.py

from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_order_confirmation(order_id):
    """Send order confirmation email"""
    # Implementation
    pass

@shared_task
def process_inventory_update(product_id, quantity):
    """Update inventory in background"""
    # Implementation
    pass

@shared_task
def generate_ethiopian_tax_report(vendor_id, year, month):
    """Generate Ethiopian tax compliance report"""
    # Implementation
    pass
```

## Migration Strategy

### Gradual Migration Approach (Recommended)

**Week 1-2:** Setup Django backend with core models
**Week 3-4:** Migrate products and categories APIs
**Week 5-6:** Migrate authentication and user management
**Week 7-8:** Migrate orders and payments
**Week 9-10:** Migrate vendor management
**Week 11-12:** Testing and optimization

### Migration Checklist

- [ ] Setup Django project structure
- [ ] Configure PostgreSQL database (can share with Prisma initially)
- [ ] Create Django models matching Prisma schema
- [ ] Implement DRF serializers and views
- [ ] Setup JWT authentication
- [ ] Configure CORS for Next.js
- [ ] Update Next.js to call Django APIs
- [ ] Setup Celery for background tasks
- [ ] Migrate admin functionalities
- [ ] Setup CI/CD for Django backend
- [ ] Deploy Django backend (AWS/DigitalOcean)
- [ ] Update production environment variables
- [ ] Monitor and optimize performance

## Deployment Architecture

### Django Backend Deployment Options

#### Option 1: AWS Elastic Beanstalk (Easiest)
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p python-3.11 minalesh-backend

# Create environment
eb create minalesh-backend-prod

# Deploy
eb deploy
```

#### Option 2: DigitalOcean App Platform (Ethiopian Friendly)
- DigitalOcean has data centers closer to Ethiopia
- Simple deployment process
- Cost-effective for startups
- Good for MVP and scaling

#### Option 3: Traditional VPS (Most Control)
```bash
# Ubuntu 22.04 Server Setup
sudo apt update
sudo apt install python3-pip python3-venv nginx postgresql

# Setup Gunicorn + Nginx
pip install gunicorn
gunicorn minalesh_backend.wsgi:application --bind 0.0.0.0:8000
```

### Next.js Frontend Deployment
- Keep on Vercel (optimal for Next.js)
- Update `NEXT_PUBLIC_API_URL` to Django production URL

## Performance Considerations

### Django Optimization
```python
# settings.py

# Caching with Redis
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Enable query optimization
DEBUG = False
ALLOWED_HOSTS = ['api.minalesh.com']
```

### API Response Caching
```python
from django.views.decorators.cache import cache_page

class ProductViewSet(viewsets.ModelViewSet):
    @cache_page(60 * 15)  # Cache for 15 minutes
    def list(self, request):
        return super().list(request)
```

## Cost Comparison

### Current Setup (Next.js + Prisma + Vercel)
- Vercel: Free tier or $20/month
- Database (Supabase/Neon): Free tier or $25/month
- Total: $0-45/month

### With Django Backend
- Next.js Frontend (Vercel): $0-20/month
- Django Backend (DigitalOcean): $12-25/month (2GB RAM droplet)
- PostgreSQL (DigitalOcean): $15/month (managed DB)
- Redis (DigitalOcean): $15/month
- Total: $42-75/month

**Note:** Costs scale with traffic. Django backend gives you more control and potentially better cost efficiency at scale.

## Pros and Cons Summary

### ✅ Pros of Django

1. **Mature Ecosystem** - 17+ years, used by Instagram, Pinterest, Mozilla
2. **Admin Interface** - Free, auto-generated admin panel
3. **ORM** - More powerful than Prisma for complex queries
4. **Background Tasks** - Celery for emails, reports, scheduled tasks
5. **Security** - Built-in protection against common vulnerabilities
6. **Ethiopian Context** - Easy to integrate Ethiopian payment gateways, tax systems
7. **Python** - Great for data processing, AI/ML features (recommendations)
8. **Scalability** - Proven to scale to millions of users
9. **Testing** - Comprehensive test framework
10. **Documentation** - Excellent documentation and community

### ⚠️ Cons of Django

1. **Learning Curve** - Need to learn Python and Django
2. **Deployment** - More complex than serverless Next.js
3. **Separate Codebases** - Frontend and backend in different repos
4. **Hosting Costs** - Need dedicated server (vs serverless)
5. **Maintenance** - Additional infrastructure to maintain

## Recommendations

### ✅ Use Django If:

- You need complex business logic
- You want a powerful admin interface without custom development
- You plan to add AI/ML features (product recommendations, fraud detection)
- You need robust background task processing
- You want to integrate Ethiopian-specific payment gateways (CBE Birr, Telebirr, etc.)
- You're planning for significant scale (10,000+ products, 1,000+ vendors)
- You need advanced tax and compliance reporting

### ⚠️ Stick with Next.js API Routes If:

- Your team is exclusively JavaScript/TypeScript
- You want to keep everything serverless
- Your application is relatively simple
- You prefer infrastructure simplicity over features
- You're MVP testing and need to iterate quickly

## For Minalesh Marketplace: Our Verdict

**Recommendation: Adopt Django Gradually**

Given that Minalesh is:
- ✅ An e-commerce marketplace (Django's strength)
- ✅ Targeting Ethiopian market (Django's i18n and custom logic helps)
- ✅ Needs vendor management, tax compliance, payment processing
- ✅ Will benefit from admin interface for managing vendors, products, orders
- ✅ May need AI recommendations, inventory forecasting (Python ecosystem)

**Start with:** Migrate core business logic to Django while keeping Next.js for frontend
**Timeline:** 12-week gradual migration
**Team:** Consider hiring 1-2 Django/Python developers

## Getting Help

### Resources
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Django + Next.js Tutorial](https://testdriven.io/blog/django-nextjs/)

### Ethiopian Developer Community
- Join Ethiopian Python Developers on Telegram
- Django Ethiopia Facebook Group
- Stack Overflow (tag: django, ethiopian-developers)

## Next Steps

1. **Review this document** with your team
2. **Prototype** a small Django API (products only)
3. **Test integration** with Next.js frontend
4. **Evaluate** performance and developer experience
5. **Make decision** on full migration or hybrid approach

---

**Questions?** Feel free to reach out for clarification or additional guidance on the integration process.
