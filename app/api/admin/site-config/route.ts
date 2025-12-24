import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/site-config
 * Get site configuration settings
 */
export const GET = withAdmin(async (req: NextRequest) => {
  try {
    // Get all site settings
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      settings: settings || getDefaultSettings(),
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site configuration' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/site-config
 * Update site configuration settings
 */
export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      maintenanceMode,
      maintenanceMessage,
      featuredProducts,
      homepageBanners,
      announcementBar,
      allowNewVendors,
      allowNewCustomers,
      minOrderAmount,
      maxOrderAmount,
      defaultCurrency,
      taxRate,
      shippingEnabled,
      emailNotifications,
      smsNotifications,
    } = body;

    // Check if settings exist
    const existingSettings = await prisma.siteSettings.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.siteSettings.update({
        where: { id: existingSettings.id },
        data: {
          maintenanceMode,
          maintenanceMessage,
          featuredProducts,
          homepageBanners,
          announcementBar,
          allowNewVendors,
          allowNewCustomers,
          minOrderAmount,
          maxOrderAmount,
          defaultCurrency,
          taxRate,
          shippingEnabled,
          emailNotifications,
          smsNotifications,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      settings = await prisma.siteSettings.create({
        data: {
          maintenanceMode: maintenanceMode ?? false,
          maintenanceMessage: maintenanceMessage ?? 'Site is under maintenance',
          featuredProducts: featuredProducts ?? {},
          homepageBanners: homepageBanners ?? {},
          announcementBar: announcementBar ?? {},
          allowNewVendors: allowNewVendors ?? true,
          allowNewCustomers: allowNewCustomers ?? true,
          minOrderAmount: minOrderAmount ?? 0,
          maxOrderAmount: maxOrderAmount ?? 1000000,
          defaultCurrency: defaultCurrency ?? 'ETB',
          taxRate: taxRate ?? 0.15,
          shippingEnabled: shippingEnabled ?? true,
          emailNotifications: emailNotifications ?? true,
          smsNotifications: smsNotifications ?? false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
});

function getDefaultSettings() {
  return {
    maintenanceMode: false,
    maintenanceMessage: 'Site is under maintenance. We\'ll be back soon!',
    featuredProducts: {},
    homepageBanners: {},
    announcementBar: {
      enabled: false,
      message: '',
      type: 'info',
    },
    allowNewVendors: true,
    allowNewCustomers: true,
    minOrderAmount: 0,
    maxOrderAmount: 1000000,
    defaultCurrency: 'ETB',
    taxRate: 0.15,
    shippingEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
  };
}
