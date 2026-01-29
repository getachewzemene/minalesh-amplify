import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { getOrSetCache } from '@/lib/cache';
import { withPublicApiSecurity } from '@/lib/security-middleware';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all active product categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
async function handler() {
  // Cache categories for 1 hour (they change infrequently)
  const categories = await getOrSetCache(
    'all-active',
    async () => {
      return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
        },
      });
    },
    {
      ttl: 3600, // 1 hour
      staleTime: 7200, // 2 hours stale-while-revalidate
      prefix: 'categories',
      tags: ['categories'],
    }
  );

  const response = NextResponse.json(categories);
  
  // Add aggressive caching headers since categories change infrequently
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=7200'
  );

  return response;
}

export const GET = withPublicApiSecurity(handler);
