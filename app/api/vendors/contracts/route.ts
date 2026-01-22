import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { generateContractNumber, replaceContractVariables } from '@/lib/contract';
import { ContractType } from '@prisma/client';

/**
 * @swagger
 * /api/vendors/contracts:
 *   get:
 *     summary: List vendor contracts
 *     description: Get all contracts for the authenticated vendor
 *     tags: [Vendors, Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_signature, active, expired, terminated, renewed]
 *         description: Filter by contract status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of contracts
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new vendor contract
 *     description: Create a new contract from a template or custom content
 *     tags: [Vendors, Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractType
 *               - startDate
 *               - endDate
 *             properties:
 *               templateId:
 *                 type: string
 *                 description: ID of the contract template to use
 *               contractType:
 *                 type: string
 *                 enum: [standard, premium, enterprise, custom]
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Custom contract content (if not using template)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               autoRenew:
 *                 type: boolean
 *                 default: false
 *               renewalPeriodMonths:
 *                 type: integer
 *                 description: Number of months for renewal period
 *               commissionRate:
 *                 type: number
 *                 description: Commission rate (0-1)
 *               paymentTerms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contract created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

async function listContractsHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const skip = (page - 1) * perPage;

    const where: any = {
      vendorId: profile.id,
    };

    if (status) {
      where.status = status;
    }

    const [contracts, total] = await Promise.all([
      prisma.vendorContract.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              contractType: true,
            },
          },
          signatures: {
            select: {
              id: true,
              signerRole: true,
              status: true,
              signedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: perPage,
      }),
      prisma.vendorContract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error listing contracts:', error);
    throw error;
  }
}

async function createContractHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      contractType,
      title,
      content: customContent,
      startDate,
      endDate,
      autoRenew = false,
      renewalPeriodMonths,
      commissionRate,
      paymentTerms,
    } = body;

    // Validate required fields
    if (!contractType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Contract type, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate auto-renewal settings
    if (autoRenew && !renewalPeriodMonths) {
      return NextResponse.json(
        { error: 'Renewal period is required when auto-renew is enabled' },
        { status: 400 }
      );
    }

    let finalContent = customContent;
    let finalTitle = title || 'Vendor Agreement';

    // If using a template, load and process it
    if (templateId) {
      const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Contract template not found' },
          { status: 404 }
        );
      }

      if (!template.isActive) {
        return NextResponse.json(
          { error: 'Contract template is inactive' },
          { status: 400 }
        );
      }

      // Replace template variables
      const variables = {
        vendorName: profile.displayName || profile.firstName || 'Vendor',
        vendorEmail: user.email,
        tradeLicense: profile.tradeLicense || 'N/A',
        tinNumber: profile.tinNumber || 'N/A',
        startDate: start,
        endDate: end,
        commissionRate: commissionRate || profile.commissionRate?.toString() || '0.15',
        renewalPeriod: renewalPeriodMonths || 12,
        currentDate: new Date(),
      };

      finalContent = replaceContractVariables(template.content, variables);
      finalTitle = template.name;
    }

    if (!finalContent) {
      return NextResponse.json(
        { error: 'Contract content is required' },
        { status: 400 }
      );
    }

    // Generate contract number
    const contractNumber = await generateContractNumber();

    // Create the contract
    const contract = await prisma.vendorContract.create({
      data: {
        vendorId: profile.id,
        templateId: templateId || null,
        contractNumber,
        contractType: contractType as ContractType,
        status: 'draft',
        title: finalTitle,
        content: finalContent,
        startDate: start,
        endDate: end,
        autoRenew,
        renewalPeriodMonths: autoRenew ? renewalPeriodMonths : null,
        commissionRate: commissionRate || profile.commissionRate || 0.15,
        paymentTerms,
      },
      include: {
        template: true,
      },
    });

    // Create initial vendor signature record
    await prisma.contractSignature.create({
      data: {
        contractId: contract.id,
        signerId: user.userId,
        signerRole: 'vendor',
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        message: 'Contract created successfully',
        contract: {
          id: contract.id,
          contractNumber: contract.contractNumber,
          status: contract.status,
          title: contract.title,
          startDate: contract.startDate,
          endDate: contract.endDate,
          autoRenew: contract.autoRenew,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

export const GET = withApiLogger(
  withRoleCheck(listContractsHandler, ['vendor', 'admin'])
);
export const POST = withApiLogger(
  withRoleCheck(createContractHandler, ['vendor', 'admin'])
);
