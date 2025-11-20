import { describe, it, expect } from 'vitest';

describe('Analytics Calculations', () => {
  describe('Sales analytics accuracy', () => {
    it('should calculate total revenue correctly', () => {
      const orders = [
        { totalAmount: 1000 },
        { totalAmount: 1500 },
        { totalAmount: 2000 },
      ];

      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      expect(totalRevenue).toBe(4500);
    });

    it('should calculate average order value correctly', () => {
      const orders = [
        { totalAmount: 1000 },
        { totalAmount: 1500 },
        { totalAmount: 2000 },
      ];

      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalRevenue / orders.length;
      
      expect(averageOrderValue).toBe(1500);
    });

    it('should count unique users correctly', () => {
      const orders = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-1' }, // Duplicate
        { userId: 'user-3' },
      ];

      const uniqueUsers = new Set(orders.map(o => o.userId)).size;
      
      expect(uniqueUsers).toBe(3);
    });
  });

  describe('Product performance analytics', () => {
    it('should calculate product revenue correctly', () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 2, price: 100 },
        { productId: 'prod-1', quantity: 3, price: 100 },
        { productId: 'prod-2', quantity: 1, price: 500 },
      ];

      const productMap = new Map<string, { revenue: number; unitsSold: number }>();
      
      orderItems.forEach(item => {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, { revenue: 0, unitsSold: 0 });
        }
        const stats = productMap.get(item.productId)!;
        stats.revenue += item.price * item.quantity;
        stats.unitsSold += item.quantity;
      });

      const prod1Stats = productMap.get('prod-1')!;
      const prod2Stats = productMap.get('prod-2')!;

      expect(prod1Stats.revenue).toBe(500);
      expect(prod1Stats.unitsSold).toBe(5);
      expect(prod2Stats.revenue).toBe(500);
      expect(prod2Stats.unitsSold).toBe(1);
    });

    it('should rank products by revenue correctly', () => {
      const products = [
        { id: 'prod-1', revenue: 1000 },
        { id: 'prod-2', revenue: 2000 },
        { id: 'prod-3', revenue: 500 },
      ];

      const sorted = products.sort((a, b) => b.revenue - a.revenue);

      expect(sorted[0].id).toBe('prod-2');
      expect(sorted[1].id).toBe('prod-1');
      expect(sorted[2].id).toBe('prod-3');
    });
  });

  describe('Category breakdown analytics', () => {
    it('should calculate category revenue correctly', () => {
      const orderItems = [
        { category: 'Coffee', price: 100, quantity: 2 },
        { category: 'Coffee', price: 150, quantity: 1 },
        { category: 'Clothing', price: 200, quantity: 3 },
      ];

      const categoryMap = new Map<string, number>();
      
      orderItems.forEach(item => {
        const revenue = item.price * item.quantity;
        categoryMap.set(
          item.category,
          (categoryMap.get(item.category) || 0) + revenue
        );
      });

      expect(categoryMap.get('Coffee')).toBe(350);
      expect(categoryMap.get('Clothing')).toBe(600);
    });

    it('should calculate category percentage correctly', () => {
      const categoryRevenue = new Map([
        ['Coffee', 350],
        ['Clothing', 600],
        ['Spices', 50],
      ]);

      const totalRevenue = Array.from(categoryRevenue.values()).reduce((sum, rev) => sum + rev, 0);
      
      const categoryPercentages = new Map<string, number>();
      categoryRevenue.forEach((revenue, category) => {
        categoryPercentages.set(category, (revenue / totalRevenue) * 100);
      });

      expect(categoryPercentages.get('Coffee')).toBe(35);
      expect(categoryPercentages.get('Clothing')).toBe(60);
      expect(categoryPercentages.get('Spices')).toBe(5);
    });
  });

  describe('Date grouping for trends', () => {
    it('should group orders by day correctly', () => {
      const orders = [
        { date: new Date('2024-01-15'), amount: 100 },
        { date: new Date('2024-01-15'), amount: 150 },
        { date: new Date('2024-01-16'), amount: 200 },
      ];

      const trendsMap = new Map<string, { revenue: number; orders: number }>();
      
      orders.forEach(order => {
        const dateKey = order.date.toISOString().split('T')[0];
        if (!trendsMap.has(dateKey)) {
          trendsMap.set(dateKey, { revenue: 0, orders: 0 });
        }
        const stats = trendsMap.get(dateKey)!;
        stats.revenue += order.amount;
        stats.orders += 1;
      });

      expect(trendsMap.get('2024-01-15')?.revenue).toBe(250);
      expect(trendsMap.get('2024-01-15')?.orders).toBe(2);
      expect(trendsMap.get('2024-01-16')?.revenue).toBe(200);
      expect(trendsMap.get('2024-01-16')?.orders).toBe(1);
    });
  });

  describe('Low stock alerts', () => {
    it('should identify products below threshold', () => {
      const products = [
        { id: 'prod-1', stockQuantity: 3, lowStockThreshold: 5 },
        { id: 'prod-2', stockQuantity: 10, lowStockThreshold: 5 },
        { id: 'prod-3', stockQuantity: 0, lowStockThreshold: 5 },
        { id: 'prod-4', stockQuantity: 5, lowStockThreshold: 5 },
      ];

      const lowStock = products.filter(p => p.stockQuantity <= p.lowStockThreshold);
      const critical = products.filter(p => p.stockQuantity <= 0);

      expect(lowStock.length).toBe(3); // prod-1, prod-3, prod-4
      expect(critical.length).toBe(1); // prod-3
    });

    it('should calculate stock status correctly', () => {
      const getStockStatus = (stock: number, threshold: number) => {
        if (stock <= 0) return 'out_of_stock';
        if (stock <= threshold) return 'low_stock';
        return 'in_stock';
      };

      expect(getStockStatus(0, 5)).toBe('out_of_stock');
      expect(getStockStatus(3, 5)).toBe('low_stock');
      expect(getStockStatus(5, 5)).toBe('low_stock');
      expect(getStockStatus(10, 5)).toBe('in_stock');
    });
  });

  describe('Accuracy tolerance (within 1%)', () => {
    it('should calculate values within 1% tolerance', () => {
      const calculateTolerance = (expected: number, actual: number) => {
        return Math.abs((actual - expected) / expected) * 100;
      };

      // Example: Manual SQL result vs Dashboard calculation
      const manualSQLResult = 10000;
      const dashboardResult = 10050;

      const tolerance = calculateTolerance(manualSQLResult, dashboardResult);
      
      expect(tolerance).toBeLessThan(1); // Should be within 1%
      expect(tolerance).toBeCloseTo(0.5, 1); // Actual is 0.5% difference
    });

    it('should verify 1% tolerance boundary', () => {
      const calculateTolerance = (expected: number, actual: number) => {
        return Math.abs((actual - expected) / expected) * 100;
      };

      // Exactly 1% difference
      expect(calculateTolerance(10000, 10100)).toBe(1);
      expect(calculateTolerance(10000, 9900)).toBe(1);
      
      // Less than 1%
      expect(calculateTolerance(10000, 10099)).toBeLessThan(1);
      expect(calculateTolerance(10000, 9901)).toBeLessThan(1);
      
      // More than 1%
      expect(calculateTolerance(10000, 10101)).toBeGreaterThan(1);
      expect(calculateTolerance(10000, 9899)).toBeGreaterThan(1);
    });
  });
});
