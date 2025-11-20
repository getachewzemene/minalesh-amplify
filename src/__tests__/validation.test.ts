/**
 * Unit Tests: Validation Layer
 * 
 * Tests for Zod validation schemas and error formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  formatZodErrors,
  validateRequestBody,
  validateQueryParams,
  authSchemas,
  cartSchemas,
  productSchemas,
  orderSchemas,
  paymentSchemas,
  validationErrorResponse,
} from '@/lib/validation';
import { z } from 'zod';

describe('Validation Layer', () => {
  describe('Error Formatting', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 15 });
      } catch (error: any) {
        const formatted = formatZodErrors(error);
        
        expect(formatted).toBeInstanceOf(Array);
        expect(formatted.length).toBeGreaterThan(0);
        expect(formatted[0]).toHaveProperty('field');
        expect(formatted[0]).toHaveProperty('message');
      }
    });

    it('should handle nested field errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });

      try {
        schema.parse({ user: { name: '', email: 'invalid' } });
      } catch (error: any) {
        const formatted = formatZodErrors(error);
        
        const nameError = formatted.find(e => e.field === 'user.name');
        const emailError = formatted.find(e => e.field === 'user.email');
        
        expect(nameError).toBeDefined();
        expect(emailError).toBeDefined();
      }
    });
  });

  describe('Auth Validation', () => {
    describe('Login Schema', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = authSchemas.login.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'not-an-email',
          password: 'password123',
        };

        const result = authSchemas.login.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject missing password', () => {
        const invalidData = {
          email: 'test@example.com',
        };

        const result = authSchemas.login.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
        };

        const result = authSchemas.login.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('Register Schema', () => {
      it('should validate valid registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject short password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject missing first name', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Password123',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Cart Validation', () => {
    describe('Add Item Schema', () => {
      it('should validate valid cart item', () => {
        const validData = {
          productId: 'prod-123',
          quantity: 2,
        };

        const result = cartSchemas.addItem.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative quantity', () => {
        const invalidData = {
          productId: 'prod-123',
          quantity: -1,
        };

        const result = cartSchemas.addItem.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject zero quantity', () => {
        const invalidData = {
          productId: 'prod-123',
          quantity: 0,
        };

        const result = cartSchemas.addItem.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should default quantity to 1 if not provided', () => {
        const data = {
          productId: 'prod-123',
        };

        const result = cartSchemas.addItem.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.quantity).toBe(1);
        }
      });

      it('should accept optional variantId', () => {
        const validData = {
          productId: 'prod-123',
          variantId: 'var-456',
          quantity: 2,
        };

        const result = cartSchemas.addItem.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('Calculate Schema', () => {
      it('should validate valid calculate data', () => {
        const validData = {
          subtotal: 100.00,
          shippingAddress: {
            country: 'US',
            state: 'CA',
            city: 'Los Angeles',
          },
        };

        const result = cartSchemas.calculate.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative subtotal', () => {
        const invalidData = {
          subtotal: -100,
        };

        const result = cartSchemas.calculate.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept optional coupon code', () => {
        const validData = {
          subtotal: 100,
          couponCode: 'SAVE10',
        };

        const result = cartSchemas.calculate.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Product Validation', () => {
    describe('Create Product Schema', () => {
      it('should validate valid product data', () => {
        const validData = {
          name: 'Test Product',
          price: 99.99,
          stockQuantity: 100,
        };

        const result = productSchemas.create.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative price', () => {
        const invalidData = {
          name: 'Test Product',
          price: -50,
          stockQuantity: 100,
        };

        const result = productSchemas.create.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative stock quantity', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          stockQuantity: -10,
        };

        const result = productSchemas.create.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should accept optional fields', () => {
        const validData = {
          name: 'Test Product',
          price: 99.99,
          salePrice: 79.99,
          stockQuantity: 100,
          description: 'A great product',
          sku: 'TEST-001',
        };

        const result = productSchemas.create.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should validate product status enum', () => {
        const validData = {
          name: 'Test Product',
          price: 99.99,
          stockQuantity: 100,
          status: 'published',
        };

        const result = productSchemas.create.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid product status', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          stockQuantity: 100,
          status: 'invalid-status',
        };

        const result = productSchemas.create.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('List Products Schema', () => {
      it('should validate list parameters', () => {
        const validData = {
          page: '1',
          limit: '20',
          categoryId: 'cat-123',
        };

        const result = productSchemas.list.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should transform string page to number', () => {
        const data = {
          page: '5',
        };

        const result = productSchemas.list.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
          expect(typeof result.data.page).toBe('number');
        }
      });
    });
  });

  describe('Payment Validation', () => {
    describe('Create Payment Intent Schema', () => {
      it('should validate valid payment intent data', () => {
        const validData = {
          amount: 100.00,
          currency: 'usd',
        };

        const result = paymentSchemas.createIntent.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative amount', () => {
        const invalidData = {
          amount: -50,
          currency: 'usd',
        };

        const result = paymentSchemas.createIntent.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate currency code length', () => {
        const invalidData = {
          amount: 100,
          currency: 'dollar',
        };

        const result = paymentSchemas.createIntent.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('Webhook Schema', () => {
      it('should validate valid webhook data', () => {
        const validData = {
          provider: 'TeleBirr',
          status: 'completed',
          paymentReference: 'REF-12345',
        };

        const result = paymentSchemas.webhook.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject missing required fields', () => {
        const invalidData = {
          provider: 'TeleBirr',
        };

        const result = paymentSchemas.webhook.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Unified Error Response', () => {
    it('should create proper error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ];

      const response = validationErrorResponse(errors);
      
      expect(response.status).toBe(422);
    });

    it('should include custom error message', () => {
      const errors = [{ field: 'test', message: 'Test error' }];
      const response = validationErrorResponse(errors, 'Custom validation error');
      
      expect(response.status).toBe(422);
    });
  });

  describe('Request Body Validation', () => {
    it('should validate valid request body', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const mockRequest = {
        json: async () => ({ name: 'John', age: 25 }),
      } as Request;

      const result = await validateRequestBody(mockRequest, schema);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(25);
      }
    });

    it('should handle invalid JSON', async () => {
      const schema = z.object({ name: z.string() });

      const mockRequest = {
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      } as Request;

      const result = await validateRequestBody(mockRequest, schema);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(422);
      }
    });
  });

  describe('Query Parameters Validation', () => {
    it('should validate query parameters', () => {
      const schema = z.object({
        search: z.string().optional(),
        page: z.string().optional(),
      });

      const mockRequest = {
        url: 'http://localhost/api/test?search=test&page=1',
      } as Request;

      const result = validateQueryParams(mockRequest, schema);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('test');
        expect(result.data.page).toBe('1');
      }
    });

    it('should handle invalid query parameters', () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/),
      });

      const mockRequest = {
        url: 'http://localhost/api/test?page=invalid',
      } as Request;

      const result = validateQueryParams(mockRequest, schema);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate nested shipping address', () => {
      const validData = {
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'US',
          phone: '1234567890',
        },
      };

      const result = orderSchemas.create.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete shipping address', () => {
      const invalidData = {
        shippingAddress: {
          firstName: 'John',
          // Missing required fields
        },
      };

      const result = orderSchemas.create.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
