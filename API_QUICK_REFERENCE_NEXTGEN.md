# Next-Generation E-commerce Features - API Quick Reference

## 🚀 Quick Start

This guide provides quick access to all new API endpoints for the next-generation e-commerce features.

---

## 📊 AI-Powered Recommendations API

### 1. Get Personalized Recommendations
```http
GET /api/recommendations/personalized
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 12, max: 50)
- `algorithm` (optional): `collaborative` | `content_based` | `trending` | `hybrid` (default: `hybrid`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "price": 500.00,
      "recommendationScore": 0.85,
      "algorithm": "hybrid",
      "category": {...},
      ...
    }
  ],
  "metadata": {
    "count": 12,
    "algorithm": "hybrid",
    "userId": "uuid"
  }
}
```

**Algorithms:**
- `collaborative`: Based on similar users' purchases
- `content_based`: Based on your category preferences
- `trending`: Currently popular products
- `hybrid`: Combines all algorithms (recommended)

---

### 2. Get Similar Products
```http
GET /api/recommendations/similar/{productId}
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 8, max: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Similar Product",
      "price": 480.00,
      "similarityScore": 0.92,
      ...
    }
  ],
  "metadata": {
    "count": 8,
    "sourceProduct": {
      "id": "uuid",
      "name": "Original Product",
      "categoryId": "uuid"
    }
  }
}
```

---

### 3. Get Trending Products
```http
GET /api/recommendations/trending
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 20, max: 50)
- `days` (optional): Days to look back (default: 7)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Trending Product",
      "trendingScore": 450.5,
      "viewCount": 1200,
      "saleCount": 45,
      ...
    }
  ],
  "metadata": {
    "count": 20,
    "period": "7 days"
  }
}
```

---

## 👥 Social Commerce & Group Buying API

### 1. Create Group Purchase
```http
POST /api/social/group-purchase/create
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "uuid",
  "title": "Group Buy - Ethiopian Coffee",
  "description": "Let's buy together and save!",
  "requiredMembers": 5,
  "maxMembers": 10,
  "pricePerPerson": 400.00,
  "regularPrice": 500.00,
  "expiresInHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Group Buy - Ethiopian Coffee",
    "currentMembers": 1,
    "requiredMembers": 5,
    "pricePerPerson": 400.00,
    "discount": 20,
    "status": "active",
    "expiresAt": "2026-01-25T13:53:19.343Z",
    "product": {...},
    "initiator": {...}
  },
  "message": "Group purchase created successfully"
}
```

---

### 2. Join Group Purchase
```http
POST /api/social/group-purchase/{id}/join
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "uuid",
      "userId": "uuid",
      "isPaid": false,
      "joinedAt": "2026-01-24T14:00:00.000Z"
    },
    "groupPurchase": {
      "currentMembers": 3,
      "requiredMembers": 5,
      ...
    }
  },
  "message": "Successfully joined the group purchase!"
}
```

---

### 3. Get Group Purchase Details
```http
GET /api/social/group-purchase/{id}/join
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Group Buy - Ethiopian Coffee",
    "currentMembers": 3,
    "requiredMembers": 5,
    "timeRemaining": {
      "hours": 18,
      "minutes": 45,
      "milliseconds": 67500000
    },
    "spotsRemaining": 7,
    "isComplete": false,
    "members": [...]
  }
}
```

---

### 4. List Active Group Purchases
```http
GET /api/social/group-purchase/create
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 50)
- `productId` (optional): Filter by product ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Group Buy - Ethiopian Coffee",
      "currentMembers": 3,
      "requiredMembers": 5,
      "product": {...},
      "members": [...]
    }
  ],
  "metadata": {
    "count": 10
  }
}
```

---

## 💰 Price Tier Examples

### Group Buying Savings Example:

```
Product: Ethiopian Coffee (1kg)
Regular Price: 500 ETB

Group Purchase Tiers:
├─ 1 person:  500 ETB (0% off)
├─ 3 people:  450 ETB each (10% off)
├─ 5 people:  400 ETB each (20% off)
└─ 10 people: 350 ETB each (30% off)

Total Savings for 10 people:
10 × (500 - 350) = 1,500 ETB saved!
```

---

## 🔄 Typical User Flows

### Flow 1: Browse with AI Recommendations
```
1. User logs in
2. GET /api/recommendations/personalized
3. User sees personalized product feed
4. Clicks on product
5. GET /api/recommendations/similar/{productId}
6. User sees similar alternatives
```

### Flow 2: Create & Join Group Purchase
```
1. User finds product
2. POST /api/social/group-purchase/create
   {
     "productId": "...",
     "requiredMembers": 5,
     "pricePerPerson": 400
   }
3. Share link with friends
4. Friends: POST /api/social/group-purchase/{id}/join
5. When 5 members joined → Auto-complete
6. System creates orders for all members
```

### Flow 3: Discover Trending Products
```
1. User visits homepage
2. GET /api/recommendations/trending?days=7
3. User sees what's hot right now
4. Clicks trending product
5. GET /api/recommendations/similar/{productId}
6. User compares similar products
```

---

## 🎯 Recommendation Algorithm Details

### Collaborative Filtering
**How it works:**
1. Finds users who bought similar products
2. Recommends products those users also bought
3. High confidence score (0.8)

**Best for:**
- Users with purchase history
- Popular products
- Cross-selling

### Content-Based Filtering
**How it works:**
1. Analyzes your viewed/purchased categories
2. Finds products in same categories
3. Medium confidence score (0.6)

**Best for:**
- New users
- Category exploration
- Niche products

### Trending Algorithm
**How it works:**
1. Analyzes recent activity (7 days)
2. Weighs views (30%), sales (50%), reviews (20%)
3. Good confidence score (0.7)

**Best for:**
- Homepage discovery
- Flash sales
- New arrivals

### Hybrid (Recommended)
**How it works:**
1. Combines all three algorithms
2. Deduplicates and ranks by score
3. Best overall recommendations

**Best for:**
- General use
- Maximum conversion
- Balanced discovery

---

## 🚨 Error Codes

### Authentication Errors
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

### Validation Errors
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Already exists (e.g., already joined group)

### Server Errors
- `500 Internal Server Error`: Server error (check logs)

---

## 📈 Performance Tips

### 1. Caching Recommendations
```javascript
// Cache recommendations for 1 hour
const cacheKey = `recommendations:${userId}:${algorithm}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Generate fresh recommendations
const recommendations = await generateRecommendations();
await redis.setex(cacheKey, 3600, JSON.stringify(recommendations));
```

### 2. Pagination for Large Results
```javascript
// Use limit to control response size
GET /api/recommendations/personalized?limit=12

// Load more with offset (future enhancement)
GET /api/recommendations/personalized?limit=12&offset=12
```

### 3. Real-Time Group Purchase Updates
```javascript
// Poll for updates every 5 seconds
setInterval(async () => {
  const response = await fetch(`/api/social/group-purchase/${id}/join`);
  const data = await response.json();
  updateUI(data);
}, 5000);

// Or use WebSocket (future enhancement)
const ws = new WebSocket('wss://api.minalesh.et/group-purchase');
ws.on('update', (data) => updateUI(data));
```

---

## 🔐 Security Notes

### Rate Limiting
- Recommendations: 100 requests/minute per user
- Group Purchase Create: 10 requests/hour per user
- Group Purchase Join: 20 requests/hour per user

### Data Privacy
- Recommendation scores stored anonymously
- User activity aggregated for analytics
- No PII shared in group purchases (except name)

---

## 🧪 Testing Examples

### cURL Examples

**Get Personalized Recommendations:**
```bash
curl -X GET \
  'https://api.minalesh.et/api/recommendations/personalized?limit=5&algorithm=hybrid' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Create Group Purchase:**
```bash
curl -X POST \
  'https://api.minalesh.et/api/social/group-purchase/create' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": "uuid",
    "title": "Coffee Group Buy",
    "requiredMembers": 5,
    "pricePerPerson": 400,
    "regularPrice": 500
  }'
```

**Join Group Purchase:**
```bash
curl -X POST \
  'https://api.minalesh.et/api/social/group-purchase/{id}/join' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Get Trending Products:**
```bash
curl -X GET \
  'https://api.minalesh.et/api/recommendations/trending?limit=10&days=7'
```

---

## 📚 Additional Resources

- [Full Feature Documentation](./NEXT_GENERATION_FEATURES.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY_NEXTGEN_FEATURES.md)
- [Database Schema](./prisma/schema.prisma)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 🆘 Support

For issues or questions:
- GitHub Issues: [minalesh-amplify/issues](https://github.com/getachewzemene/minalesh-amplify/issues)
- Documentation: [docs/](./docs/)
- Email: support@minalesh.et

---

**Last Updated**: January 24, 2026
**API Version**: 1.0
**Status**: Beta (Testing Phase)
