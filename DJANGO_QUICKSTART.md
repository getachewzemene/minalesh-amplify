# Django Backend Quick Start Guide

## TL;DR - Should We Use Django?

**YES** - Django is an excellent choice for Minalesh e-commerce backend. Here's a 30-minute quickstart.

## Quick Decision Matrix

| Need | Next.js API Routes | Django |
|------|-------------------|--------|
| E-commerce features | ⚠️ Build from scratch | ✅ Built-in |
| Admin interface | ⚠️ Custom build | ✅ Auto-generated |
| Background tasks | ⚠️ Limited | ✅ Celery |
| Ethiopian payments | 🔧 Custom | ✅ Easy integration |
| Scalability | ⚠️ Limited | ✅ Proven at scale |
| Team expertise | ✅ JavaScript | ⚠️ Requires Python |

## 30-Minute Proof of Concept

### Step 1: Install Django (5 minutes)

```bash
# Create project directory
mkdir minalesh-django-poc
cd minalesh-django-poc

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Django
pip install django djangorestframework django-cors-headers
```

### Step 2: Create Project (5 minutes)

```bash
# Create Django project
django-admin startproject backend .

# Create products app
python manage.py startapp products

# Run migrations
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser
```

### Step 3: Quick Product API (10 minutes)

```python
# products/models.py
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    stock = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
```

```python
# products/serializers.py
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
```

```python
# products/views.py
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
```

```python
# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views import ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
```

```python
# backend/settings.py (add these)
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework',
    'corsheaders',
    'products',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... existing middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### Step 4: Test API (5 minutes)

```bash
# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Run server
python manage.py runserver
```

Now visit:
- Admin: http://localhost:8000/admin
- API: http://localhost:8000/api/products/
- API Docs: http://localhost:8000/api/

### Step 5: Connect to Next.js (5 minutes)

```typescript
// Next.js - lib/api.ts
const API_URL = 'http://localhost:8000/api';

export async function getProducts() {
  const response = await fetch(`${API_URL}/products/`);
  return response.json();
}
```

## Ethiopian-Specific Features

### ETB Currency Handling

```python
# products/models.py
class Product(models.Model):
    price_etb = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Price in Ethiopian Birr"
    )
    
    @property
    def price_with_vat(self):
        """Ethiopian VAT is 15%"""
        return self.price_etb * Decimal('1.15')
```

### Ethiopian Vendor Verification

```python
# vendors/models.py
class Vendor(models.Model):
    tin_number = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Ethiopian TIN Number"
    )
    trade_license = models.CharField(max_length=50)
    
    ETHIOPIAN_REGIONS = [
        ('AA', 'Addis Ababa'),
        ('DD', 'Dire Dawa'),
        ('OR', 'Oromia'),
        ('AM', 'Amhara'),
        ('TG', 'Tigray'),
        # ... more regions
    ]
    region = models.CharField(max_length=2, choices=ETHIOPIAN_REGIONS)
```

### Amharic/Tigrinya Support

```python
# settings.py
LANGUAGES = [
    ('en', 'English'),
    ('am', 'አማርኛ'),
    ('ti', 'ትግርኛ'),
    ('om', 'Oromiffa'),
]

USE_I18N = True
TIME_ZONE = 'Africa/Addis_Ababa'
```

```python
# products/models.py
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    name_am = models.CharField(max_length=255, blank=True)  # Amharic
    name_ti = models.CharField(max_length=255, blank=True)  # Tigrinya
```

## Real-World Examples

### 1. Telebirr Payment Integration

```python
# payments/telebirr.py
import requests

def process_telebirr_payment(amount, phone_number):
    """
    Integrate with Telebirr API
    """
    response = requests.post(
        'https://api.ethiotelecom.et/telebirr/payment',
        json={
            'amount': str(amount),
            'phone': phone_number,
            'currency': 'ETB',
        },
        headers={'Authorization': f'Bearer {TELEBIRR_API_KEY}'}
    )
    return response.json()
```

### 2. Ethiopian Tax Report

```python
# reports/views.py
from rest_framework.decorators import api_view
from django.http import HttpResponse
import csv

@api_view(['GET'])
def ethiopian_tax_report(request, year, month):
    """
    Generate Ethiopian tax compliance report
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="tax_report_{year}_{month}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['TIN', 'Business Name', 'Total Sales (ETB)', 'VAT Collected (ETB)'])
    
    # Get vendor sales data
    # Calculate VAT (15%)
    # Write to CSV
    
    return response
```

### 3. Auto-generated Admin Panel

```python
# products/admin.py
from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_etb', 'stock', 'created_at']
    list_filter = ['created_at', 'category']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
```

Visit http://localhost:8000/admin and get a full admin interface for FREE!

## Common Questions

### Q: Can I keep my existing PostgreSQL database?
**A:** Yes! Django can connect to your existing Prisma database. Just configure the connection string.

### Q: How long does migration take?
**A:** For Minalesh, estimated 8-12 weeks for gradual migration.

### Q: Can I run both Next.js API routes AND Django?
**A:** Yes! Use hybrid approach - migrate gradually, route by route.

### Q: What about deployment?
**A:** 
- Django: DigitalOcean ($12/month) or AWS ($20-50/month)
- Next.js: Keep on Vercel (free tier)

### Q: Performance?
**A:** Django can handle 10,000+ requests/second with proper setup. Instagram uses Django!

### Q: Background jobs (emails, reports)?
**A:** Celery + Redis = robust task queue. Much better than cron jobs.

## Cost Breakdown

### Option 1: Next.js Only (Current)
- Vercel: $0-20/month
- Database: $15-25/month
- **Total: $15-45/month**

### Option 2: Next.js + Django
- Vercel (Next.js): $0-20/month
- DigitalOcean (Django): $12/month (starter)
- Database: $15/month
- Redis: $15/month
- **Total: $42-62/month**

**ROI:** Extra $30/month gets you:
- Auto-generated admin interface (saves 100+ dev hours)
- Better background task processing
- Easier Ethiopian payment integrations
- Scalability to 100,000+ users
- Python ecosystem for AI/ML features

## Decision Framework

### Choose Django if you answer YES to 3+ of these:

- [ ] Need robust admin interface
- [ ] Plan to scale beyond 10,000 products
- [ ] Need background task processing (emails, reports, inventory)
- [ ] Want to integrate Ethiopian payment gateways (Telebirr, CBE Birr)
- [ ] Need advanced tax/compliance reporting
- [ ] Planning AI features (recommendations, fraud detection)
- [ ] Team willing to learn Python
- [ ] Budget allows $50-100/month hosting

### Stick with Next.js API Routes if:

- [ ] MVP/testing phase
- [ ] Team is JavaScript-only
- [ ] Budget constrained (<$50/month)
- [ ] Simple CRUD operations only
- [ ] No background tasks needed

## Next Steps - Choose Your Path

### Path A: Try Django (Recommended)
1. Follow this 30-minute quickstart
2. Build product API
3. Test with Next.js frontend
4. Review [Full Integration Guide](NEXTJS_DJANGO_INTEGRATION_GUIDE.md)
5. Make decision

### Path B: Stick with Next.js
1. Document current limitations
2. Plan workarounds for background tasks
3. Budget for custom admin development
4. Monitor as you scale

## Resources

- 📚 [Full Integration Guide](NEXTJS_DJANGO_INTEGRATION_GUIDE.md)
- 🌐 [Django Documentation](https://docs.djangoproject.com/)
- 🔌 [Django REST Framework](https://www.django-rest-framework.org/)
- 💬 Ethiopian Developer Communities:
  - Telegram: @EthiopianPythonDevs
  - Discord: Ethiopian Tech Hub

## Sample Project Structure

```
minalesh/
├── minalesh-backend/          # Django Backend
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── products/
│   ├── vendors/
│   ├── orders/
│   └── requirements.txt
│
└── minalesh-frontend/         # Next.js Frontend
    ├── app/
    ├── components/
    ├── lib/
    │   └── django-api.ts      # Django API client
    └── package.json
```

## Deployment Architecture

```
┌─────────────────┐
│  Next.js        │ ← Vercel (Frontend)
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTPS API Calls
         │
┌────────▼────────┐
│  Django         │ ← DigitalOcean (Backend)
│  (Backend)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    │         │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐
│ PostgreSQL│ Redis│ │   S3    │
└─────────┘ └─────┘ └─────────┘
```

## Conclusion

**For Minalesh:** Django is the right choice for long-term scalability and Ethiopian market features.

**Timeline:** Start now with proof-of-concept, plan 3-month gradual migration.

**Investment:** ~$30/month additional hosting + 1-2 Python developers.

**ROI:** Better admin tools, scalability, Ethiopian integrations, AI capabilities.

---

**Ready to start?** Run the 30-minute POC above and experience Django's power firsthand!
