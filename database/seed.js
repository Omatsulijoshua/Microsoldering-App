const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Pre-hashed password for "Password123!" using bcrypt (10 rounds)
const DEV_PASSWORD_HASH = "$2b$10$L1Qh9iHwBw7C5/3l/iJ/Re6i/p9R5T2sFh7vR59S3oU8eDqP8B3z2";

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing records (Optional, in order of dependencies)
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.measurement.deleteMany({});
  await prisma.diagnosisResult.deleteMany({});
  await prisma.repairCaseFile.deleteMany({});
  await prisma.repairCase.deleteMany({});
  await prisma.knowledgeBaseArticle.deleteMany({});
  await prisma.deviceModel.deleteMany({});
  await prisma.deviceCategory.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.shop.deleteMany({});

  // 2. Create Dev Shop
  const shop = await prisma.shop.create({
    data: {
      name: "Microsolder AI Reference Lab",
      address: "100 Logic Gate Boulevard, Silicon Valley",
      phone: "+1-555-0199",
      email: "lab@microsolder.ai"
    }
  });
  console.log("Created reference repair shop.");

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      name: "System Super Admin",
      email: "superadmin@microsolder.ai",
      passwordHash: DEV_PASSWORD_HASH,
      role: "SUPER_ADMIN",
      shopId: shop.id,
      emailVerified: true
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: "Content Administrator",
      email: "admin@microsolder.ai",
      passwordHash: DEV_PASSWORD_HASH,
      role: "ADMIN",
      shopId: shop.id,
      emailVerified: true
    }
  });

  const technician = await prisma.user.create({
    data: {
      name: "Workbench Technician",
      email: "tech@microsolder.ai",
      passwordHash: DEV_PASSWORD_HASH,
      role: "TECHNICIAN",
      shopId: shop.id,
      emailVerified: true
    }
  });
  console.log("Created test roles: superadmin, admin, tech.");

  // 4. Create Subscription Plans
  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: "Free Diagnostics Tier",
      code: "FREE",
      description: "Basic symptom diagnosis and up to 5 cases.",
      price: 0.00,
      features: ["Symptom Diagnosis", "Max 5 Repair Tickets", "No Log Uploads"]
    }
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: "Pro Technician Plan",
      code: "PRO",
      description: "Full AI diagnostic parser suite, log analyzers, and reports.",
      price: 49.99,
      features: ["Unlimited AI Diagnostics", "Panic Log Analyzer", "Android Log Analyzer", "Microscope AI", "PDF Invoicing"]
    }
  });

  const shopPlan = await prisma.subscriptionPlan.create({
    data: {
      name: "Shop Portal License",
      code: "SHOP",
      description: "Multi-technician workbench collaboration dashboard.",
      price: 149.99,
      features: ["Up to 10 Technicians", "Shared Repair Dashboard", "Customer CRM Integration", "Shop Stats & Audit Logs"]
    }
  });
  console.log("Created subscription plans: FREE, PRO, SHOP.");

  // 5. Create Brands, Categories, and Models
  // Apple
  const apple = await prisma.brand.create({
    data: { name: "Apple", description: "iPhone, iPad, MacBooks, Apple Watches" }
  });

  const iphoneCat = await prisma.deviceCategory.create({
    data: { brandId: apple.id, name: "iPhone", description: "Apple smartphones" }
  });
  const macbookCat = await prisma.deviceCategory.create({
    data: { brandId: apple.id, name: "MacBook", description: "Apple laptops" }
  });

  await prisma.deviceModel.createMany({
    data: [
      { brandId: apple.id, categoryId: iphoneCat.id, name: "iPhone 13 Pro Max", modelNumber: "A2643", year: 2021, notes: "Main rails: PP_VDD_MAIN, PP_VDD_BOOST. Watchdog checks prs0 and mic2." },
      { brandId: apple.id, categoryId: iphoneCat.id, name: "iPhone 12", modelNumber: "A2403", year: 2020, notes: "Watchdog checks prs0 on charge port and mic1." },
      { brandId: apple.id, categoryId: macbookCat.id, name: "MacBook Pro A2338", modelNumber: "A2338", year: 2020, notes: "M1 processor logic board. PPBUS_G3H sits at 12.0V." }
    ]
  });

  // Samsung
  const samsung = await prisma.brand.create({
    data: { name: "Samsung", description: "Galaxy Series phones and tabs" }
  });

  const galaxySCat = await prisma.deviceCategory.create({
    data: { brandId: samsung.id, name: "Galaxy S", description: "Premium smartphones" }
  });

  await prisma.deviceModel.createMany({
    data: [
      { brandId: samsung.id, categoryId: galaxySCat.id, name: "Galaxy S21 Ultra", modelNumber: "SM-G998B", year: 2021, notes: "Exynos/Snapdragon configurations. PMIC: S2MPS21." }
    ]
  });

  // Sony
  const sony = await prisma.brand.create({
    data: { name: "Sony", description: "PlayStation Home Consoles" }
  });

  const playstationCat = await prisma.deviceCategory.create({
    data: { brandId: sony.id, name: "PlayStation", description: "Home consoles" }
  });

  await prisma.deviceModel.createMany({
    data: [
      { brandId: sony.id, categoryId: playstationCat.id, name: "PlayStation 5", modelNumber: "CFI-1000", year: 2020, notes: "Liquid metal thermal interface. Watch for HDMI port strain and safe mode errors." }
    ]
  });

  // Nintendo
  const nintendo = await prisma.brand.create({
    data: { name: "Nintendo", description: "Handheld hybrid consoles" }
  });

  const switchCat = await prisma.deviceCategory.create({
    data: { brandId: nintendo.id, name: "Nintendo Switch", description: "Switch family" }
  });

  await prisma.deviceModel.createMany({
    data: [
      { brandId: nintendo.id, categoryId: switchCat.id, name: "Switch OLED", modelNumber: "HEG-001", year: 2021, notes: "Uses M92T36 and BQ24193 charging management chips." }
    ]
  });
  console.log("Created brands, categories, and models.");

  // 6. Create initial KB Article
  const modelM1 = await prisma.deviceModel.findFirst({
    where: { name: "MacBook Pro A2338" }
  });

  await prisma.knowledgeBaseArticle.create({
    data: {
      title: "MacBook Pro M1 (A2338) draws only 5V - Power Rail Check",
      content: `### Symptom
When connected to a USB-C ammeter, the device draws 5.08V and 0.00A or 0.05A. The screen is black, fan does not spin.

### Diagnosis Steps
1. Measure **PPBUS_G3H** voltage. It should sit around 12.0V on M1 series. If it is 0V or < 1V, measure resistance to ground.
2. If resistance on PPBUS_G3H is < 10 Ohms, you have a short circuit.
3. Common cause: Blown decoupling capacitor on CPU power lines or shorted CD3217 USB-C controller chips.
4. If resistance is high (> 100k Ohms), inspect CD3217 inputs and LDO lines.

### Solution
- Check for heat signature under 1.5V short injection.
- Replace the shorted MLCC capacitor.`,
      modelId: modelM1 ? modelM1.id : null,
      faultType: "Charging/Power",
      symptoms: ["Drawn 5V", "No power", "Dead board"],
      cause: "Shorted capacitor on PPBUS_G3H",
      solution: "Replace capacitor",
      difficulty: "MEDIUM",
      visibility: "PUBLIC",
      createdBy: admin.id
    }
  });
  console.log("Seeded reference knowledge base guides.");

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
