import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { verifyToken } from '@/lib/auth';

/**
 * @swagger
 * /api/products/{id}/questions:
 *   get:
 *     summary: Get product questions
 *     description: Retrieve customer questions and answers for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of questions and answers
 *   post:
 *     summary: Ask a product question
 *     description: Submit a question about a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question submitted successfully
 */
async function getHandler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  try {
    // For now, return mock data since we need to create the database schema
    // In production, this would query a ProductQuestions table
    const mockQuestions = [
      {
        id: '1',
        question: 'What is the warranty period for this product?',
        answer: 'This product comes with a 1-year manufacturer warranty covering defects.',
        userName: 'Customer',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        answeredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        helpfulCount: 5,
        isHelpful: false
      }
    ];

    return NextResponse.json({
      success: true,
      questions: mockQuestions
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

async function postHandler(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;

  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // TODO: Store question in database when schema is created
    // For now, just return success
    console.log(`Question submitted for product ${productId}:`, question);

    return NextResponse.json(
      {
        success: true,
        message: 'Question submitted successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error submitting question:', error);
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(getHandler);
export const POST = withApiLogger(postHandler);
