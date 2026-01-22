import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { ContractType } from '@prisma/client';

/**
 * @swagger
 * /api/admin/contract-templates:
 *   get:
 *     summary: List contract templates
 *     description: Get all contract templates (admin only)
 *     tags: [Admin, Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [standard, premium, enterprise, custom]
 *         description: Filter by contract type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of templates
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create contract template
 *     description: Create a new contract template (admin only)
 *     tags: [Admin, Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contractType
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               contractType:
 *                 type: string
 *                 enum: [standard, premium, enterprise, custom]
 *               version:
 *                 type: string
 *                 default: "1.0"
 *               content:
 *                 type: string
 *                 description: HTML/Markdown template content
 *               variables:
 *                 type: object
 *                 description: Available variables for the template
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

async function listTemplatesHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractType = searchParams.get('contractType');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (contractType) {
      where.contractType = contractType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.contractTemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        contractType: true,
        version: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    throw error;
  }
}

async function createTemplateHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      contractType,
      version = '1.0',
      content,
      variables,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !contractType || !content) {
      return NextResponse.json(
        { error: 'Name, contract type, and content are required' },
        { status: 400 }
      );
    }

    // Create the template
    const template = await prisma.contractTemplate.create({
      data: {
        name,
        contractType: contractType as ContractType,
        version,
        content,
        variables: variables || null,
        isActive,
        createdBy: user.userId,
      },
    });

    return NextResponse.json(
      {
        message: 'Contract template created successfully',
        template: {
          id: template.id,
          name: template.name,
          contractType: template.contractType,
          version: template.version,
          isActive: template.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(listTemplatesHandler, ['admin'])
);
export const POST = withApiLogger(
  withRoleCheck(createTemplateHandler, ['admin'])
);
