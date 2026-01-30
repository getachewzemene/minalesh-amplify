# Dashboard Features Quick Reference

## 🎯 How to Access New Features

### Admin Dashboard
Navigate to `/admin/dashboard` and click these tabs:

#### 1. **Live Stats** Tab
```
Real-time platform monitoring
└── Auto-refresh every 30 seconds
└── Today's metrics: Orders, Revenue, Users, Vendors
└── Alerts: Pending orders, Low stock, Verifications
└── Recent activity feed (last 10 orders)
```

**Use Case**: Monitor platform health in real-time

#### 2. **Product Performance** Tab
```
Product analytics and optimization
└── Total views, conversions, revenue, ROI
└── Performance trends chart
└── Revenue by product chart
└── Detailed product table (sortable)
    ├── Views & CTR
    ├── Orders & CVR
    ├── Revenue & ROI
    └── Ratings & trends
```

**Use Case**: Identify top/bottom performers, optimize catalog

#### 3. **Customers** Tab
```
Customer behavior and value
└── Total customers & repeat rate
└── Average CLV & VIP count
└── Acquisition & retention chart
└── Customer segmentation pie chart
└── Top customers table
└── Segment value analysis
    ├── VIP (>5 orders)
    ├── Loyal (3-5 orders)
    ├── Regular (2-3 orders)
    └── One-time
```

**Use Case**: Improve retention, target high-value customers

---

### Vendor Dashboard
Navigate to `/vendor/dashboard` and click:

#### 1. **Live Stats** Tab
```
Real-time vendor performance
└── Auto-refresh every 60 seconds
└── Metrics: Views, Conversions, Revenue, Products
└── Traffic sources analysis
    ├── Organic Search
    ├── Direct
    ├── Social Media
    └── Referral
└── Traffic sources charts
└── Top products table
└── Traffic insights panel
```

**Use Case**: Track performance, optimize marketing

---

## 📊 Key Metrics Explained

### CTR (Click-Through Rate)
```
CTR = (Clicks / Views) × 100
```
Measures how many people click on a product after seeing it.
- **Good**: > 20%
- **Average**: 10-20%
- **Needs improvement**: < 10%

### CVR (Conversion Rate)
```
CVR = (Orders / Clicks) × 100
```
Measures how many clicks result in orders.
- **Good**: > 5%
- **Average**: 2-5%
- **Needs improvement**: < 2%

### ROI (Return on Investment)
```
ROI = ((Revenue - Cost) / Cost) × 100
```
Measures profitability of products.
- **Good**: > 200%
- **Average**: 100-200%
- **Needs improvement**: < 100%

### CLV (Customer Lifetime Value)
```
CLV = Average Order Value × Average Purchase Frequency × Average Customer Lifespan
```
Predicts total revenue from a customer relationship.
- **VIP**: > 15M ETB
- **Loyal**: 5-15M ETB
- **Regular**: 2-5M ETB
- **One-time**: < 2M ETB

---

## 🎨 Visual Guide

### Color Coding

**Metric Cards**:
- 🔵 **Blue** - Orders/Transactions
- 🟢 **Green** - Revenue/Money
- 🟣 **Purple** - Users/Customers
- 🟠 **Orange** - Activity/Vendors

**Alerts**:
- 🟡 **Yellow** - Warning (pending items)
- 🔴 **Red** - Critical (low stock)
- 🔵 **Blue** - Info (verifications)

**Trends**:
- 🔼 **Up Arrow** - Positive trend
- 🔽 **Down Arrow** - Negative trend
- ➖ **Minus** - No change

---

## 🚀 Quick Actions

### As Admin:

1. **Check daily performance**:
   - Go to Live Stats
   - Review today's numbers
   - Check alerts

2. **Optimize product catalog**:
   - Go to Product Performance
   - Sort by ROI (lowest first)
   - Identify underperformers
   - Take action (repricing, promotion, removal)

3. **Improve customer retention**:
   - Go to Customers tab
   - Check repeat rate
   - View VIP customers
   - Plan targeted campaigns

### As Vendor:

1. **Monitor sales**:
   - Go to Live Stats
   - Enable auto-refresh
   - Watch conversions increase

2. **Optimize marketing**:
   - Check Traffic Sources chart
   - Focus on high-CVR sources
   - Reduce spend on low-CVR sources

3. **Improve products**:
   - Review Top Products table
   - Check ratings
   - Optimize low-performing items

---

## ⚡ Auto-Refresh Settings

### Admin Live Stats
- **Interval**: 30 seconds
- **Toggle**: Top-right button
- **Use when**: Monitoring critical events, launches, sales

### Vendor Live Stats
- **Interval**: 60 seconds
- **Toggle**: Top-right button
- **Use when**: Tracking campaigns, product launches

**Tip**: Disable auto-refresh to save bandwidth when not actively monitoring.

---

## 📱 Mobile Responsive

All dashboards are fully responsive:
- **Desktop**: Full features, multi-column layout
- **Tablet**: Adapted layout, scrollable tables
- **Mobile**: Stacked layout, optimized cards

---

## 🔍 Search & Filter

### Product Performance
- Click badges to sort:
  - **By Revenue** - Find top earners
  - **By Orders** - Find popular products
  - **By ROI** - Find most profitable

### Customer Analytics
- Segments auto-filter in pie chart
- Click segment for details

---

## 💡 Pro Tips

1. **Best time to check Live Stats**: 
   - Morning (8-10 AM) - Overnight activity
   - Evening (6-8 PM) - Daily summary
   - During campaigns - Real-time monitoring

2. **Use Product Performance to**:
   - Plan inventory (high CVR = stock up)
   - Set promotions (low CVR = discount)
   - Remove items (low ROI + low views)

3. **Use Customer Analytics to**:
   - Identify VIPs for loyalty programs
   - Target one-time buyers with win-back campaigns
   - Calculate customer acquisition cost vs. CLV

4. **Use Vendor Live Stats to**:
   - Track which traffic sources convert best
   - Optimize product descriptions (low CTR = poor title/image)
   - Time marketing campaigns (check when CVR is highest)

---

## 🆘 Troubleshooting

**Live stats not updating?**
1. Check internet connection
2. Toggle auto-refresh off and on
3. Click manual refresh button
4. Check API status at `/api/admin/dashboard/live-stats`

**Charts not displaying?**
1. Refresh page
2. Check browser console for errors
3. Try different browser
4. Clear browser cache

**Performance slow?**
1. Disable auto-refresh
2. Close other tabs
3. Check internet speed
4. Contact support if persistent

---

## 📞 Support

- **Documentation**: `/DASHBOARD_ENHANCEMENTS.md`
- **Technical Details**: `/IMPLEMENTATION_SUMMARY_DASHBOARDS.md`
- **Issues**: GitHub Issues
- **Email**: support@minalesh.com

---

**Version**: 1.0.0  
**Last Updated**: January 2026
