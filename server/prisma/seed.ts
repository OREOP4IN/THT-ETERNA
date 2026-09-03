import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or update Demo User
  const demoEmail = 'demo@stockflow.dev';
  const rawPassword = 'Password123!';
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash,
      name: 'Demo Manager',
    },
    create: {
      email: demoEmail,
      passwordHash,
      name: 'Demo Manager',
    },
  });

  console.log(`👤 Demo User ready: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Sample Products
  const sampleProducts = [
    {
      sku: 'SKU-SCAN-01',
      name: 'Wireless Barcode Scanner',
      description: 'Handheld 2D Bluetooth industrial barcode scanner',
      unitPrice: 8500, // $85.00 in cents
      quantityOnHand: 25,
    },
    {
      sku: 'SKU-PRN-02',
      name: 'Thermal Receipt Printer',
      description: 'High-speed 80mm USB & Ethernet POS receipt printer',
      unitPrice: 14900, // $149.00 in cents
      quantityOnHand: 12,
    },
    {
      sku: 'SKU-LBL-03',
      name: 'Thermal Shipping Labels (6-Pack)',
      description: '4x6 inch direct thermal roll labels for packing',
      unitPrice: 2450, // $24.50 in cents
      quantityOnHand: 50,
    },
    {
      sku: 'SKU-WRP-04',
      name: 'Industrial Pallet Stretch Film (4 Rolls)',
      description: 'Heavy duty 80-gauge clear pallet shrink wrap',
      unitPrice: 5999, // $59.99 in cents
      quantityOnHand: 8,
    },
    {
      sku: 'SKU-TPE-05',
      name: 'Ergonomic Packing Tape Dispenser',
      description: 'Heavy duty 2-inch pistol-grip carton tape sealer',
      unitPrice: 1500, // $15.00 in cents
      quantityOnHand: 30,
    },
  ];

  for (const prod of sampleProducts) {
    const product = await prisma.product.upsert({
      where: {
        userId_sku: {
          userId: demoUser.id,
          sku: prod.sku,
        },
      },
      update: {
        name: prod.name,
        description: prod.description,
        unitPrice: prod.unitPrice,
        quantityOnHand: prod.quantityOnHand,
      },
      create: {
        userId: demoUser.id,
        sku: prod.sku,
        name: prod.name,
        description: prod.description,
        unitPrice: prod.unitPrice,
        quantityOnHand: prod.quantityOnHand,
      },
    });

    // Record initial stock movement audit log if not present
    const existingMovement = await prisma.stockMovement.findFirst({
      where: {
        productId: product.id,
        reason: 'INITIAL',
      },
    });

    if (!existingMovement) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChange: product.quantityOnHand,
          reason: 'INITIAL',
        },
      });
    }

    console.log(
      `📦 Seeded Product: [${product.sku}] ${product.name} — Stock: ${product.quantityOnHand}, Price: $${(product.unitPrice / 100).toFixed(2)}`
    );
  }

  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
