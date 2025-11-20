import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Minalesh API Documentation',
    version: '1.0.0',
    description: 'API documentation for Minalesh - Ethiopia\'s Intelligent Marketplace',
    contact: {
      name: 'Minalesh Team',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from /api/auth/login',
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-session-id',
        description: 'Session ID for anonymous users',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          salePrice: { type: 'number', nullable: true },
          stockQuantity: { type: 'integer' },
          images: { type: 'array', items: { type: 'string' } },
          categoryId: { type: 'string' },
          vendorId: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          parentId: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          productId: { type: 'string' },
          variantId: { type: 'string', nullable: true },
          quantity: { type: 'integer' },
          product: { $ref: '#/components/schemas/Product' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          status: { 
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
          },
          total: { type: 'number' },
          subtotal: { type: 'number' },
          shippingAmount: { type: 'number' },
          taxAmount: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Products', description: 'Product management' },
    { name: 'Categories', description: 'Product categories' },
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Payments', description: 'Payment processing' },
    { name: 'Profile', description: 'User and vendor profiles' },
    { name: 'Media', description: 'Media upload and management' },
    { name: 'Reviews', description: 'Product reviews' },
    { name: 'Shipping', description: 'Shipping rates and zones' },
    { name: 'Coupons', description: 'Coupon validation' },
    { name: 'Promotions', description: 'Promotional campaigns' },
    { name: 'Analytics', description: 'Sales and performance analytics' },
    { name: 'Admin', description: 'Administrative operations' },
    { name: 'Vendors', description: 'Vendor operations' },
    { name: 'Search', description: 'Product search and filtering' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Refunds', description: 'Refund processing' },
    { name: 'Invoices', description: 'Invoice generation' },
    { name: 'Chat', description: 'Customer support chat' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./app/api/**/*.ts', './src/lib/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
