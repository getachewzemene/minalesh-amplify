/**
 * Demo Product Seed Data
 * 
 * This script seeds the database with demo products including:
 * - Smart Phones
 * - CCTV Cameras
 * - Door Alarms
 * - Portable Flash Disks (above 512GB)
 * - Dash Cams
 * - Routers
 * - Wireless WiFi devices
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting demo product seeding...');

  // Create a demo vendor user and profile
  const vendorPassword = await hash('DemoVendor123!', 10);
  
  const vendor = await prisma.user.upsert({
    where: { email: 'demo.vendor@minalesh.com' },
    update: {},
    create: {
      email: 'demo.vendor@minalesh.com',
      password: vendorPassword,
      role: 'vendor',
      emailVerified: new Date(),
      profile: {
        create: {
          displayName: 'Tech Solutions Ethiopia',
          firstName: 'Demo',
          lastName: 'Vendor',
          phone: '+251911234567',
          address: 'Bole, Addis Ababa',
          city: 'Addis Ababa',
          country: 'Ethiopia',
          isVendor: true,
          vendorStatus: 'approved',
          tradeLicense: 'TL-12345678',
          tinNumber: '1234567890',
          commissionRate: 0.15,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  console.log('✅ Demo vendor created');

  // Create categories
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      isActive: true,
      sortOrder: 1,
    },
  });

  const securityCategory = await prisma.category.upsert({
    where: { slug: 'security-systems' },
    update: {},
    create: {
      name: 'Security Systems',
      slug: 'security-systems',
      description: 'Home and business security solutions',
      isActive: true,
      sortOrder: 2,
    },
  });

  const storageCategory = await prisma.category.upsert({
    where: { slug: 'storage-devices' },
    update: {},
    create: {
      name: 'Storage Devices',
      slug: 'storage-devices',
      description: 'External storage and data storage solutions',
      isActive: true,
      sortOrder: 3,
    },
  });

  const networkingCategory = await prisma.category.upsert({
    where: { slug: 'networking' },
    update: {},
    create: {
      name: 'Networking',
      slug: 'networking',
      description: 'Routers, WiFi, and networking equipment',
      isActive: true,
      sortOrder: 4,
    },
  });

  console.log('✅ Categories created');

  const vendorId = vendor.profile!.id;

  // Smart Phones
  const smartphones = [
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      brand: 'Samsung',
      description: 'Premium flagship smartphone with 200MP camera, S Pen, and AI features. Features a stunning 6.8" Dynamic AMOLED display with 120Hz refresh rate, Snapdragon 8 Gen 3 processor, and all-day battery life.',
      shortDescription: 'Premium flagship with 200MP camera and S Pen',
      price: 89999.00,
      salePrice: 84999.00,
      sku: 'SAMS24U-256-BLK',
      stockQuantity: 25,
      weight: 0.233,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/phones/samsung-s24-ultra.jpg',
        '/uploads/phones/samsung-s24-ultra-back.jpg',
      ]),
      features: JSON.stringify([
        '6.8" QHD+ Dynamic AMOLED Display',
        '200MP Main Camera with AI',
        'S Pen Included',
        '12GB RAM, 256GB Storage',
        '5000mAh Battery',
        '5G Connectivity',
      ]),
      specifications: JSON.stringify({
        'Display': '6.8" QHD+ (3088 x 1440)',
        'Processor': 'Snapdragon 8 Gen 3',
        'RAM': '12GB',
        'Storage': '256GB',
        'Camera': '200MP + 50MP + 12MP + 10MP',
        'Battery': '5000mAh',
        'OS': 'Android 14 with One UI 6',
      }),
      isFeatured: true,
      ratingAverage: 4.8,
      ratingCount: 142,
    },
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      brand: 'Apple',
      description: 'Apple\'s most powerful iPhone featuring A17 Pro chip, titanium design, and advanced camera system. Includes USB-C port, Action button, and exceptional performance for all your needs.',
      shortDescription: 'Titanium design with A17 Pro chip',
      price: 95999.00,
      salePrice: 92999.00,
      sku: 'IPH15PM-256-NAT',
      stockQuantity: 18,
      weight: 0.221,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/phones/iphone-15-pro-max.jpg',
        '/uploads/phones/iphone-15-pro-max-camera.jpg',
      ]),
      features: JSON.stringify([
        '6.7" Super Retina XDR Display',
        'A17 Pro Chip',
        'Titanium Design',
        'Pro Camera System 48MP',
        'Action Button',
        'USB-C Connectivity',
      ]),
      specifications: JSON.stringify({
        'Display': '6.7" Super Retina XDR',
        'Processor': 'A17 Pro',
        'Storage': '256GB',
        'Camera': '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
        'Battery': 'Up to 29 hours video playback',
        'OS': 'iOS 17',
      }),
      isFeatured: true,
      ratingAverage: 4.9,
      ratingCount: 203,
    },
    {
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      brand: 'Google',
      description: 'Google\'s flagship with advanced AI features, exceptional camera capabilities, and pure Android experience. Features Google Tensor G3 chip and seven years of OS updates.',
      shortDescription: 'AI-powered flagship with exceptional camera',
      price: 74999.00,
      salePrice: 69999.00,
      sku: 'GGLPX8P-256-BAY',
      stockQuantity: 30,
      weight: 0.213,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/phones/pixel-8-pro.jpg',
      ]),
      features: JSON.stringify([
        '6.7" LTPO OLED Display',
        'Google Tensor G3',
        'Advanced AI Features',
        '50MP Triple Camera System',
        'Temperature Sensor',
        '7 Years of Updates',
      ]),
      specifications: JSON.stringify({
        'Display': '6.7" LTPO OLED (2992 x 1344)',
        'Processor': 'Google Tensor G3',
        'RAM': '12GB',
        'Storage': '256GB',
        'Camera': '50MP + 48MP + 48MP',
        'Battery': '5050mAh',
        'OS': 'Android 14',
      }),
      ratingAverage: 4.7,
      ratingCount: 89,
    },
  ];

  // CCTV Cameras
  const cctvCameras = [
    {
      name: 'Hikvision 4K Ultra HD IP Camera',
      slug: 'hikvision-4k-ip-camera',
      brand: 'Hikvision',
      description: '8MP 4K Ultra HD IP network camera with advanced night vision up to 30m. Features smart motion detection, weatherproof design (IP67), and mobile app monitoring. Perfect for both indoor and outdoor security.',
      shortDescription: '8MP 4K camera with 30m night vision',
      price: 12999.00,
      salePrice: 11499.00,
      sku: 'HIK-4K-IP-001',
      stockQuantity: 45,
      weight: 0.85,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/cctv/hikvision-4k.jpg',
      ]),
      features: JSON.stringify([
        '4K Ultra HD (3840×2160)',
        '30m Infrared Night Vision',
        'IP67 Weatherproof',
        'Smart Motion Detection',
        'Mobile App Support',
        'PoE (Power over Ethernet)',
      ]),
      specifications: JSON.stringify({
        'Resolution': '8MP (3840×2160)',
        'Lens': '2.8mm Fixed',
        'Night Vision': '30m',
        'Storage': 'microSD up to 256GB',
        'Connectivity': 'Ethernet, WiFi',
        'Power': 'PoE / 12V DC',
      }),
      isFeatured: true,
      ratingAverage: 4.6,
      ratingCount: 67,
    },
    {
      name: 'Dahua 2MP Dome Camera',
      slug: 'dahua-2mp-dome-camera',
      brand: 'Dahua',
      description: 'Professional dome camera with 2MP resolution and excellent low-light performance. Features vandal-proof design, wide dynamic range, and built-in audio. Ideal for offices and retail spaces.',
      shortDescription: '2MP vandal-proof dome camera',
      price: 5999.00,
      sku: 'DAH-2MP-DOME-01',
      stockQuantity: 60,
      weight: 0.55,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/cctv/dahua-dome.jpg',
      ]),
      features: JSON.stringify([
        '1080p Full HD',
        'Vandal-Proof Design',
        'Wide Dynamic Range',
        'Built-in Microphone',
        '20m IR Distance',
        'Smart H.265+ Compression',
      ]),
      specifications: JSON.stringify({
        'Resolution': '2MP (1920×1080)',
        'Lens': '3.6mm Fixed',
        'Night Vision': '20m',
        'Audio': 'Built-in Microphone',
        'Mounting': 'Ceiling/Wall',
        'Power': '12V DC',
      }),
      ratingAverage: 4.5,
      ratingCount: 43,
    },
    {
      name: 'TP-Link Tapo 360° Pan/Tilt Camera',
      slug: 'tplink-tapo-360-camera',
      brand: 'TP-Link',
      description: 'Smart home security camera with 360° horizontal and 114° vertical rotation. Features 1080p video, two-way audio, and advanced AI detection for persons, pets, and motion.',
      shortDescription: '360° smart home camera with AI detection',
      price: 4499.00,
      salePrice: 3999.00,
      sku: 'TPL-TAPO-C200',
      stockQuantity: 75,
      weight: 0.35,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/cctv/tplink-tapo.jpg',
      ]),
      features: JSON.stringify([
        '1080p Full HD Video',
        '360° Horizontal Rotation',
        'Two-Way Audio',
        'AI Person/Pet Detection',
        'Night Vision up to 9m',
        'Cloud & SD Card Storage',
      ]),
      specifications: JSON.stringify({
        'Resolution': '1080p',
        'Rotation': '360° horizontal, 114° vertical',
        'Night Vision': '9m',
        'Storage': 'Cloud & microSD up to 128GB',
        'Audio': 'Two-way',
        'Connectivity': 'WiFi 2.4GHz',
      }),
      ratingAverage: 4.4,
      ratingCount: 156,
    },
  ];

  // Door Alarms
  const doorAlarms = [
    {
      name: 'Ring Alarm Door/Window Sensor',
      slug: 'ring-alarm-door-sensor',
      brand: 'Ring',
      description: 'Professional-grade wireless door and window sensor that instantly alerts you when doors or windows open. Easy DIY installation, long battery life, and seamless integration with Ring security system.',
      shortDescription: 'Wireless door/window sensor with instant alerts',
      price: 2499.00,
      salePrice: 1999.00,
      sku: 'RING-DW-SENSOR-01',
      stockQuantity: 120,
      weight: 0.15,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/alarms/ring-door-sensor.jpg',
      ]),
      features: JSON.stringify([
        'Wireless Installation',
        'Instant Mobile Alerts',
        '3-Year Battery Life',
        'Z-Wave Plus Technology',
        'Works with Ring System',
        'Compact Design',
      ]),
      specifications: JSON.stringify({
        'Type': 'Door/Window Sensor',
        'Connectivity': 'Z-Wave Plus',
        'Battery': '3V CR123A',
        'Battery Life': 'Up to 3 years',
        'Range': 'Up to 75m',
        'Dimensions': '6.1 x 2.5 x 1.3 cm',
      }),
      ratingAverage: 4.7,
      ratingCount: 234,
    },
    {
      name: 'SimpliSafe Smart Door Lock with Alarm',
      slug: 'simplisafe-smart-door-lock',
      brand: 'SimpliSafe',
      description: 'Advanced smart lock with built-in alarm and keyless entry. Features remote access, auto-lock, and multiple entry methods including PIN, app, and physical key. Receive alerts when someone enters.',
      shortDescription: 'Smart lock with built-in alarm and keyless entry',
      price: 18999.00,
      salePrice: 16999.00,
      sku: 'SMPL-LOCK-ALM-01',
      stockQuantity: 35,
      weight: 1.2,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/alarms/simplisafe-lock.jpg',
      ]),
      features: JSON.stringify([
        'Keyless Entry',
        'Built-in Alarm (95dB)',
        'Remote Access via App',
        'Auto-Lock Feature',
        'PIN Code Entry',
        'Battery Backup',
      ]),
      specifications: JSON.stringify({
        'Type': 'Smart Lock with Alarm',
        'Connectivity': 'WiFi, Bluetooth',
        'Alarm Volume': '95dB',
        'Battery': '4x AA',
        'Battery Life': 'Up to 8 months',
        'Compatible': 'Standard Deadbolts',
      }),
      isFeatured: true,
      ratingAverage: 4.6,
      ratingCount: 89,
    },
    {
      name: 'Yale Wireless Door/Window Alarm Kit',
      slug: 'yale-wireless-alarm-kit',
      brand: 'Yale',
      description: 'Complete wireless alarm kit with 4 door/window sensors and loud 90dB siren. Easy to install with no wiring required. Perfect for renters and homeowners alike.',
      shortDescription: 'Complete wireless kit with 4 sensors and siren',
      price: 8999.00,
      sku: 'YALE-ALARM-KIT-4S',
      stockQuantity: 50,
      weight: 0.8,
      categoryId: securityCategory.id,
      images: JSON.stringify([
        '/uploads/alarms/yale-kit.jpg',
      ]),
      features: JSON.stringify([
        '4 Door/Window Sensors',
        '90dB Siren',
        'No Wiring Required',
        'Easy DIY Installation',
        'Expandable System',
        'Low Battery Indicator',
      ]),
      specifications: JSON.stringify({
        'Components': '1 Siren + 4 Sensors',
        'Siren Volume': '90dB',
        'Range': 'Up to 30m',
        'Battery': 'AAA (included)',
        'Expandable': 'Yes, up to 20 devices',
        'Installation': 'Adhesive Mount',
      }),
      ratingAverage: 4.3,
      ratingCount: 72,
    },
  ];

  // Portable Flash Disks (above 512GB)
  const flashDisks = [
    {
      name: 'SanDisk Extreme PRO 1TB USB 3.2',
      slug: 'sandisk-extreme-pro-1tb',
      brand: 'SanDisk',
      description: 'Ultra-fast portable USB flash drive with 1TB capacity and read speeds up to 420MB/s. Durable aluminum body with password protection and 256-bit AES hardware encryption. Perfect for large file transfers.',
      shortDescription: 'Ultra-fast 1TB flash drive with 420MB/s read speed',
      price: 28999.00,
      salePrice: 26499.00,
      sku: 'SDSK-EXT-1TB-001',
      stockQuantity: 40,
      weight: 0.08,
      categoryId: storageCategory.id,
      images: JSON.stringify([
        '/uploads/storage/sandisk-extreme-1tb.jpg',
      ]),
      features: JSON.stringify([
        '1TB Storage Capacity',
        '420MB/s Read Speed',
        'USB 3.2 Gen 1',
        '256-bit AES Encryption',
        'Password Protection',
        'Durable Aluminum Chassis',
      ]),
      specifications: JSON.stringify({
        'Capacity': '1TB',
        'Interface': 'USB 3.2 Gen 1 / USB 3.0',
        'Read Speed': 'Up to 420MB/s',
        'Write Speed': 'Up to 380MB/s',
        'Encryption': '256-bit AES Hardware',
        'Dimensions': '7.1 x 2.1 x 1.0 cm',
      }),
      isFeatured: true,
      ratingAverage: 4.8,
      ratingCount: 312,
    },
    {
      name: 'Samsung BAR Plus 512GB USB 3.1',
      slug: 'samsung-bar-plus-512gb',
      brand: 'Samsung',
      description: 'Reliable and speedy 512GB flash drive with metallic design. Features up to 400MB/s transfer speeds, water-resistant, shock-proof, and comes with 5-year warranty.',
      shortDescription: '512GB metallic flash drive with 400MB/s speed',
      price: 15999.00,
      salePrice: 14499.00,
      sku: 'SAMS-BAR-512GB',
      stockQuantity: 65,
      weight: 0.03,
      categoryId: storageCategory.id,
      images: JSON.stringify([
        '/uploads/storage/samsung-bar-512gb.jpg',
      ]),
      features: JSON.stringify([
        '512GB Capacity',
        '400MB/s Transfer Speed',
        'USB 3.1 Gen 1',
        'Water-Resistant',
        'Shock-Proof',
        '5-Year Warranty',
      ]),
      specifications: JSON.stringify({
        'Capacity': '512GB',
        'Interface': 'USB 3.1 Gen 1',
        'Read Speed': 'Up to 400MB/s',
        'Durability': 'Water, shock, temperature proof',
        'Warranty': '5 Years',
        'Dimensions': '3.9 x 1.2 x 0.8 cm',
      }),
      ratingAverage: 4.7,
      ratingCount: 198,
    },
    {
      name: 'Kingston DataTraveler Max 1TB USB-C',
      slug: 'kingston-datatraveler-max-1tb',
      brand: 'Kingston',
      description: 'High-performance USB-C flash drive with 1TB capacity and blazing fast USB 3.2 Gen 2 speeds. Dual connectors (USB-C and USB-A) for maximum compatibility.',
      shortDescription: '1TB dual-connector USB-C flash drive',
      price: 32999.00,
      sku: 'KING-DTMAX-1TB',
      stockQuantity: 28,
      weight: 0.11,
      categoryId: storageCategory.id,
      images: JSON.stringify([
        '/uploads/storage/kingston-max-1tb.jpg',
      ]),
      features: JSON.stringify([
        '1TB Storage',
        'USB 3.2 Gen 2',
        'USB-C and USB-A',
        '1000MB/s Read Speed',
        '900MB/s Write Speed',
        'Sliding Dual Connector',
      ]),
      specifications: JSON.stringify({
        'Capacity': '1TB',
        'Interface': 'USB 3.2 Gen 2 (USB-C & USB-A)',
        'Read Speed': 'Up to 1000MB/s',
        'Write Speed': 'Up to 900MB/s',
        'Warranty': '5 Years',
        'Dimensions': '7.7 x 2.6 x 1.1 cm',
      }),
      isFeatured: true,
      ratingAverage: 4.9,
      ratingCount: 145,
    },
  ];

  // Dash Cams
  const dashCams = [
    {
      name: 'Garmin Dash Cam 67W',
      slug: 'garmin-dash-cam-67w',
      brand: 'Garmin',
      description: 'Premium dash camera with ultra-wide 180° field of view and 1440p video quality. Features voice control, GPS, driver assistance alerts, and automatic incident detection. Compact design with crisp night vision.',
      shortDescription: '1440p dash cam with 180° view and GPS',
      price: 19999.00,
      salePrice: 17999.00,
      sku: 'GARM-DC67W-001',
      stockQuantity: 32,
      weight: 0.12,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/dashcam/garmin-67w.jpg',
      ]),
      features: JSON.stringify([
        '1440p Video Quality',
        '180° Wide-Angle View',
        'Built-in GPS',
        'Voice Control',
        'Driver Assistance Alerts',
        'Automatic Incident Detection',
      ]),
      specifications: JSON.stringify({
        'Resolution': '1440p (2560x1440)',
        'Field of View': '180°',
        'GPS': 'Built-in',
        'Screen': '2" LCD',
        'Storage': 'microSD up to 512GB',
        'Mounting': 'Adhesive',
      }),
      isFeatured: true,
      ratingAverage: 4.7,
      ratingCount: 189,
    },
    {
      name: 'Viofo A129 Plus Duo',
      slug: 'viofo-a129-plus-duo',
      brand: 'Viofo',
      description: 'Dual channel dash camera system recording front (4K) and rear (1080p) simultaneously. Features Sony sensors, excellent night vision, parking mode, and GPS. Comes with hardwire kit for 24/7 protection.',
      shortDescription: 'Dual 4K front & 1080p rear dash cam',
      price: 24999.00,
      salePrice: 22999.00,
      sku: 'VIOF-A129-DUO',
      stockQuantity: 25,
      weight: 0.35,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/dashcam/viofo-a129.jpg',
      ]),
      features: JSON.stringify([
        '4K Front Camera',
        '1080p Rear Camera',
        'Sony Sensors',
        '24/7 Parking Mode',
        'Built-in GPS',
        'Super Night Vision',
      ]),
      specifications: JSON.stringify({
        'Front Resolution': '4K (3840x2160)',
        'Rear Resolution': '1080p',
        'Field of View': '140° Front, 140° Rear',
        'GPS': 'Built-in',
        'Storage': 'microSD up to 256GB',
        'Power': 'Hardwire Kit Included',
      }),
      isFeatured: true,
      ratingAverage: 4.8,
      ratingCount: 267,
    },
    {
      name: 'NextBase 622GW 4K Dash Cam',
      slug: 'nextbase-622gw-4k',
      brand: 'Nextbase',
      description: 'Feature-rich 4K dash cam with 3" touchscreen, WiFi, and Alexa integration. Includes Emergency SOS, intelligent parking mode, and what3words location technology for precise incident reporting.',
      shortDescription: '4K dash cam with Alexa and Emergency SOS',
      price: 27999.00,
      sku: 'NEXT-622GW-4K',
      stockQuantity: 20,
      weight: 0.25,
      categoryId: electronicsCategory.id,
      images: JSON.stringify([
        '/uploads/dashcam/nextbase-622gw.jpg',
      ]),
      features: JSON.stringify([
        '4K Ultra HD Recording',
        '3" Touchscreen',
        'WiFi Connectivity',
        'Alexa Built-in',
        'Emergency SOS',
        'Intelligent Parking Mode',
      ]),
      specifications: JSON.stringify({
        'Resolution': '4K (3840x2160) @ 30fps',
        'Field of View': '140°',
        'Screen': '3" IPS Touch',
        'GPS': 'Built-in',
        'Storage': 'microSD up to 256GB',
        'Special Features': 'Alexa, Emergency SOS',
      }),
      ratingAverage: 4.6,
      ratingCount: 134,
    },
  ];

  // Routers
  const routers = [
    {
      name: 'TP-Link Archer AX73 WiFi 6 Router',
      slug: 'tplink-archer-ax73-wifi6',
      brand: 'TP-Link',
      description: 'High-performance WiFi 6 router with speeds up to 5400Mbps. Features OFDMA, 1024-QAM, and 6 high-gain antennas for whole-home coverage. Perfect for gaming, streaming, and smart home devices.',
      shortDescription: 'WiFi 6 router with 5400Mbps speed',
      price: 14999.00,
      salePrice: 12999.00,
      sku: 'TPL-AX73-WF6',
      stockQuantity: 42,
      weight: 0.72,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/routers/tplink-ax73.jpg',
      ]),
      features: JSON.stringify([
        'WiFi 6 (802.11ax)',
        '5400Mbps Total Speed',
        '6 High-Gain Antennas',
        'OFDMA & MU-MIMO',
        'Gigabit Ports',
        'Easy Setup with App',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6 (802.11ax)',
        'Speed': '5400Mbps (4804Mbps @ 5GHz + 574Mbps @ 2.4GHz)',
        'Processor': '1.5GHz Quad-Core',
        'Ports': '1x Gigabit WAN + 4x Gigabit LAN',
        'Coverage': 'Up to 3000 sq ft',
        'Devices': '200+ devices',
      }),
      isFeatured: true,
      ratingAverage: 4.7,
      ratingCount: 423,
    },
    {
      name: 'ASUS RT-AX86U Pro Gaming Router',
      slug: 'asus-rt-ax86u-pro',
      brand: 'ASUS',
      description: 'Professional gaming router with Mobile Game Mode and dedicated gaming port. Features AiProtection Pro security, VPN Fusion, and powerful dual-core processor for lag-free gaming.',
      shortDescription: 'Gaming router with Mobile Game Mode',
      price: 22999.00,
      salePrice: 20999.00,
      sku: 'ASUS-AX86U-PRO',
      stockQuantity: 28,
      weight: 0.81,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/routers/asus-ax86u.jpg',
      ]),
      features: JSON.stringify([
        'WiFi 6 Gaming Router',
        'Mobile Game Mode',
        'Dedicated Gaming Port',
        'AiProtection Pro',
        '2.5G WAN Port',
        'VPN Fusion',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6 (802.11ax)',
        'Speed': '5700Mbps (4804Mbps @ 5GHz + 861Mbps @ 2.4GHz)',
        'Processor': '2.0GHz Quad-Core',
        'Ports': '1x 2.5G WAN + 4x Gigabit LAN + 1x USB 3.2',
        'Security': 'AiProtection Pro powered by Trend Micro',
        'Special': 'Mobile Game Mode, Gaming Port',
      }),
      isFeatured: true,
      ratingAverage: 4.9,
      ratingCount: 312,
    },
    {
      name: 'Netgear Nighthawk AX12 (AX6000)',
      slug: 'netgear-nighthawk-ax12',
      brand: 'Netgear',
      description: 'Extreme-performance 12-stream WiFi 6 router with powerful 1.8GHz quad-core processor. Features 8 high-performance antennas, multi-gig internet support, and advanced cybersecurity.',
      shortDescription: '12-stream WiFi 6 router with AX6000 speed',
      price: 29999.00,
      sku: 'NTGR-AX12-6000',
      stockQuantity: 18,
      weight: 1.2,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/routers/netgear-ax12.jpg',
      ]),
      features: JSON.stringify([
        '12-Stream WiFi 6',
        '6Gbps Total Speed',
        '8 High-Performance Antennas',
        'Multi-Gig Support (5G/2.5G)',
        'NETGEAR Armor Security',
        '1.8GHz Quad-Core Processor',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6 (802.11ax)',
        'Speed': '6000Mbps (4800Mbps @ 5GHz + 1200Mbps @ 2.4GHz)',
        'Processor': '1.8GHz Quad-Core',
        'Ports': '1x 5G/2.5G WAN + 4x Gigabit LAN + 2x USB 3.0',
        'Coverage': 'Up to 3500 sq ft',
        'Security': 'NETGEAR Armor',
      }),
      ratingAverage: 4.6,
      ratingCount: 187,
    },
  ];

  // Wireless WiFi Devices
  const wifiDevices = [
    {
      name: 'TP-Link Deco X60 Mesh WiFi 6 System (3-Pack)',
      slug: 'tplink-deco-x60-mesh-3pack',
      brand: 'TP-Link',
      description: 'Whole-home mesh WiFi 6 system covering up to 7000 sq ft. Easy setup with app, seamless roaming, and works with Alexa. Eliminates dead zones and provides consistent high-speed coverage throughout your home.',
      shortDescription: 'Mesh WiFi 6 system covering 7000 sq ft',
      price: 32999.00,
      salePrice: 29999.00,
      sku: 'TPL-DECO-X60-3PK',
      stockQuantity: 35,
      weight: 1.8,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/wifi/tplink-deco-x60.jpg',
      ]),
      features: JSON.stringify([
        'WiFi 6 Mesh System',
        '3-Pack (7000 sq ft)',
        'AX3000 Speed',
        'Seamless Roaming',
        'Easy App Setup',
        'Works with Alexa',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6 (802.11ax)',
        'Speed': '3000Mbps (2402Mbps @ 5GHz + 574Mbps @ 2.4GHz)',
        'Coverage': 'Up to 7000 sq ft (3-pack)',
        'Units': '3 Deco X60 units',
        'Ports': '3x Gigabit per unit',
        'Devices': '150+ devices',
      }),
      isFeatured: true,
      ratingAverage: 4.8,
      ratingCount: 567,
    },
    {
      name: 'Google Nest WiFi Pro 6E (3-Pack)',
      slug: 'google-nest-wifi-pro-6e-3pack',
      brand: 'Google',
      description: 'Next-generation mesh WiFi 6E system with tri-band technology. Features automatic updates, easy Google Home app management, and covers up to 6600 sq ft. Includes built-in Thread border router for smart home.',
      shortDescription: 'WiFi 6E mesh with tri-band technology',
      price: 39999.00,
      salePrice: 36999.00,
      sku: 'GOOG-NEST-6E-3PK',
      stockQuantity: 24,
      weight: 2.1,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/wifi/google-nest-pro.jpg',
      ]),
      features: JSON.stringify([
        'WiFi 6E with 6GHz Band',
        'Tri-Band Technology',
        '3-Pack (6600 sq ft)',
        'Thread Border Router',
        'Google Home Integration',
        'Automatic Updates',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6E (802.11ax)',
        'Speed': '5400Mbps (tri-band)',
        'Coverage': 'Up to 6600 sq ft (3-pack)',
        'Units': '3 Nest WiFi Pro units',
        'Ports': '2x Gigabit Ethernet per unit',
        'Special': 'Thread border router built-in',
      }),
      isFeatured: true,
      ratingAverage: 4.7,
      ratingCount: 389,
    },
    {
      name: 'Netgear Orbi WiFi 6 Mesh System (RBK753)',
      slug: 'netgear-orbi-wifi6-rbk753',
      brand: 'Netgear',
      description: 'Premium tri-band mesh WiFi 6 system with dedicated backhaul. Covers up to 7500 sq ft with fast, reliable connections. Features NETGEAR Armor security and supports 100+ devices.',
      shortDescription: 'Tri-band mesh with dedicated backhaul',
      price: 44999.00,
      sku: 'NTGR-ORBI-753',
      stockQuantity: 16,
      weight: 2.5,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/wifi/netgear-orbi.jpg',
      ]),
      features: JSON.stringify([
        'Tri-Band WiFi 6',
        'Dedicated Backhaul',
        '7500 sq ft Coverage',
        'AX4200 Speed',
        'NETGEAR Armor',
        '100+ Devices',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6 (802.11ax)',
        'Speed': '4200Mbps (2402Mbps + 1201Mbps + 600Mbps)',
        'Coverage': 'Up to 7500 sq ft',
        'Units': '1 Router + 2 Satellites',
        'Ports': '4x Gigabit per router, 4x per satellite',
        'Security': 'NETGEAR Armor (1-year included)',
      }),
      ratingAverage: 4.6,
      ratingCount: 234,
    },
    {
      name: 'TP-Link RE815XE WiFi 6E Range Extender',
      slug: 'tplink-re815xe-extender',
      brand: 'TP-Link',
      description: 'Powerful WiFi 6E range extender with tri-band technology and Gigabit Ethernet port. Extends coverage up to 2500 sq ft and supports speeds up to 6000Mbps. Easy one-touch setup.',
      shortDescription: 'WiFi 6E extender with 6000Mbps speed',
      price: 12999.00,
      salePrice: 11499.00,
      sku: 'TPL-RE815XE-EXT',
      stockQuantity: 48,
      weight: 0.45,
      categoryId: networkingCategory.id,
      images: JSON.stringify([
        '/uploads/wifi/tplink-extender.jpg',
      ]),
      features: JSON.stringify([
        'WiFi 6E Tri-Band',
        '6000Mbps Speed',
        '2500 sq ft Coverage',
        'OneMesh Compatible',
        'Gigabit Ethernet Port',
        'One-Touch Setup',
      ]),
      specifications: JSON.stringify({
        'WiFi Standard': 'WiFi 6E (802.11ax)',
        'Speed': '6000Mbps (2402Mbps @ 6GHz + 2402Mbps @ 5GHz + 574Mbps @ 2.4GHz)',
        'Coverage': 'Up to 2500 sq ft',
        'Ports': '1x Gigabit Ethernet',
        'Compatible': 'Works with any WiFi router',
        'Setup': 'WPS, One-Touch, App',
      }),
      ratingAverage: 4.5,
      ratingCount: 176,
    },
  ];

  // Combine all products
  const allProducts = [
    ...smartphones,
    ...cctvCameras,
    ...doorAlarms,
    ...flashDisks,
    ...dashCams,
    ...routers,
    ...wifiDevices,
  ];

  // Create all products
  for (const productData of allProducts) {
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        vendorId,
      },
    });
    console.log(`✅ Created product: ${productData.name}`);
  }

  console.log('\n🎉 Demo product seeding completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Smart Phones: ${smartphones.length}`);
  console.log(`   - CCTV Cameras: ${cctvCameras.length}`);
  console.log(`   - Door Alarms: ${doorAlarms.length}`);
  console.log(`   - Flash Disks (>512GB): ${flashDisks.length}`);
  console.log(`   - Dash Cams: ${dashCams.length}`);
  console.log(`   - Routers: ${routers.length}`);
  console.log(`   - Wireless WiFi Devices: ${wifiDevices.length}`);
  console.log(`   - Total Products: ${allProducts.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
