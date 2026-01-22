import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isContractDueForRenewal, calculateRenewalEndDate, generateContractNumber } from '@/lib/contract';

/**
 * GET /api/cron/process-contract-renewals
 * 
 * Background job to process automatic contract renewals
 * Should be called daily via cron or scheduler
 * 
 * This job will:
 * 1. Find contracts due for renewal (within 30 days of expiry)
 * 2. Create renewed contract versions
 * 3. Send notification emails to vendors and admins
 * 
 * Authentication: Requires CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // In development, log warning but allow execution
      console.warn(
        'CRON_SECRET not set - cron endpoint is unprotected in production!'
      );
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find contracts due for renewal
    const contractsDueForRenewal = await prisma.vendorContract.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        renewalPeriodMonths: {
          not: null,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            displayName: true,
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    const renewedContracts = [];
    const errors = [];

    for (const contract of contractsDueForRenewal) {
      try {
        // Check if already renewed
        const existingRenewal = await prisma.vendorContract.findFirst({
          where: {
            parentContractId: contract.id,
          },
        });

        if (existingRenewal) {
          // Already renewed, skip
          continue;
        }

        // Calculate new dates
        const newStartDate = new Date(contract.endDate);
        newStartDate.setDate(newStartDate.getDate() + 1);
        
        const newEndDate = calculateRenewalEndDate(
          contract.endDate,
          contract.renewalPeriodMonths!
        );

        // Generate new contract number
        const newContractNumber = await generateContractNumber();

        // Create renewed contract
        const renewedContract = await prisma.vendorContract.create({
          data: {
            vendorId: contract.vendorId,
            templateId: contract.templateId,
            contractNumber: newContractNumber,
            contractType: contract.contractType,
            status: 'pending_signature',
            version: contract.version + 1,
            parentContractId: contract.id,
            title: contract.title,
            content: contract.content,
            startDate: newStartDate,
            endDate: newEndDate,
            autoRenew: contract.autoRenew,
            renewalPeriodMonths: contract.renewalPeriodMonths,
            commissionRate: contract.commissionRate,
            paymentTerms: contract.paymentTerms,
          },
        });

        // Update old contract status
        await prisma.vendorContract.update({
          where: { id: contract.id },
          data: {
            status: 'renewed',
          },
        });

        // Create signature records
        await prisma.contractSignature.create({
          data: {
            contractId: renewedContract.id,
            signerId: contract.vendor.userId,
            signerRole: 'vendor',
            status: 'pending',
          },
        });

        renewedContracts.push({
          oldContractId: contract.id,
          newContractId: renewedContract.id,
          contractNumber: renewedContract.contractNumber,
          vendorId: contract.vendorId,
          vendorEmail: contract.vendor.user?.email,
        });

        // TODO: Send notification email to vendor about contract renewal
        console.log(`Contract ${contract.contractNumber} renewed for vendor ${contract.vendorId}`);
      } catch (error) {
        console.error(`Error renewing contract ${contract.id}:`, error);
        errors.push({
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: contractsDueForRenewal.length,
      renewed: renewedContracts.length,
      errorCount: errors.length,
      renewedContracts,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in process-contract-renewals cron:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during contract renewal processing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
