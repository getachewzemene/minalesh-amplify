import { generateCsrfTokenResponse } from '@/lib/csrf';

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     description: Generate and return a CSRF token for form submissions
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: CSRF token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 */
export async function GET() {
  return generateCsrfTokenResponse();
}
