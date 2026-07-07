import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DbService implements OnModuleInit {
  // In-memory tables mimicking Prisma Client
  public users: any[] = [];
  public shops: any[] = [];
  public brands: any[] = [];
  public categories: any[] = [];
  public models: any[] = [];
  public repairCases: any[] = [];
  public diagnosisResults: any[] = [];
  public measurements: any[] = [];
  public kbArticles: any[] = [];
  public subscriptionPlans: any[] = [];
  public subscriptions: any[] = [];
  public payments: any[] = [];
  public auditLogs: any[] = [];
  public aiSettings: any[] = [];

  onModuleInit() {
    this.seedInMemoryDb();
  }

  private seedInMemoryDb() {
    // 1. Seed Reference Shop
    this.shops.push({
      id: 'shop-1',
      name: 'Microsolder AI Reference Lab',
      address: '100 Logic Gate Boulevard, Silicon Valley',
      phone: '+1-555-0199',
      email: 'lab@microsolder.ai'
    });

    // 2. Seed Test Users (Password: Password123!)
    const DEV_PASSWORD_HASH = "$2b$10$L1Qh9iHwBw7C5/3l/iJ/Re6i/p9R5T2sFh7vR59S3oU8eDqP8B3z2";
    
    this.users.push(
      {
        id: 'u-superadmin',
        name: 'System Super Admin',
        email: 'superadmin@microsolder.ai',
        passwordHash: DEV_PASSWORD_HASH,
        role: 'SUPER_ADMIN',
        shopId: 'shop-1',
        status: 'ACTIVE',
        emailVerified: true
      },
      {
        id: 'u-admin',
        name: 'Content Administrator',
        email: 'admin@microsolder.ai',
        passwordHash: DEV_PASSWORD_HASH,
        role: 'ADMIN',
        shopId: 'shop-1',
        status: 'ACTIVE',
        emailVerified: true
      },
      {
        id: 'u-tech',
        name: 'Workbench Technician',
        email: 'tech@microsolder.ai',
        passwordHash: DEV_PASSWORD_HASH,
        role: 'TECHNICIAN',
        shopId: 'shop-1',
        status: 'ACTIVE',
        emailVerified: true
      }
    );

    // 3. Seed Subscription Plans
    this.subscriptionPlans.push(
      {
        id: 'p-free',
        name: 'Free Diagnostics Tier',
        code: 'FREE',
        price: 0,
        features: ['Symptom Diagnosis', 'Max 5 Repair Tickets']
      },
      {
        id: 'p-pro',
        name: 'Pro Technician Plan',
        code: 'PRO',
        price: 49.99,
        features: ['Unlimited AI Diagnostics', 'Panic Log Analyzer', 'Android Log Analyzer']
      },
      {
        id: 'p-shop',
        name: 'Shop Portal License',
        code: 'SHOP',
        price: 149.99,
        features: ['Up to 10 Technicians', 'Shared Repair Dashboard', 'Customer CRM']
      }
    );

    // 4. Seed Brands, Categories, and Models
    this.brands.push(
      { id: 'b-apple', name: 'Apple', description: 'iPhones, iPads, and MacBooks' },
      { id: 'b-samsung', name: 'Samsung', description: 'Galaxy Phones and Tabs' },
      { id: 'b-sony', name: 'Sony', description: 'PlayStation Consoles' },
      { id: 'b-nintendo', name: 'Nintendo', description: 'Switch Hybrid Systems' }
    );

    this.categories.push(
      { id: 'c-iphone', brandId: 'b-apple', name: 'iPhone', description: 'Apple Smartphones' },
      { id: 'c-macbook', brandId: 'b-apple', name: 'MacBook', description: 'Apple Laptops' },
      { id: 'c-galaxy', brandId: 'b-samsung', name: 'Galaxy S', description: 'Premium Smartphones' },
      { id: 'c-playstation', brandId: 'b-sony', name: 'PlayStation', description: 'Gaming Consoles' }
    );

    this.models.push(
      {
        id: 'm-iphone13',
        brandId: 'b-apple',
        categoryId: 'c-iphone',
        name: 'iPhone 13 Pro Max',
        modelNumber: 'A2643',
        year: 2021,
        notes: 'Rails: PP_VDD_MAIN. Watchdog checks prs0.'
      },
      {
        id: 'm-iphone12',
        brandId: 'b-apple',
        categoryId: 'c-iphone',
        name: 'iPhone 12',
        modelNumber: 'A2403',
        year: 2020,
        notes: 'Watchdog checks prs0 on charge port.'
      },
      {
        id: 'm-macbooka2338',
        brandId: 'b-apple',
        categoryId: 'c-macbook',
        name: 'MacBook Pro A2338',
        modelNumber: 'A2338',
        year: 2020,
        notes: 'M1 Logic Board. PPBUS_G3H sits at 12.0V.'
      },
      {
        id: 'm-s21ultra',
        brandId: 'b-samsung',
        categoryId: 'c-galaxy',
        name: 'Galaxy S21 Ultra',
        modelNumber: 'SM-G998B',
        year: 2021,
        notes: 'PMIC: S2MPS21.'
      },
      {
        id: 'm-ps5',
        brandId: 'b-sony',
        categoryId: 'c-playstation',
        name: 'PlayStation 5',
        modelNumber: 'CFI-1000',
        year: 2020,
        notes: 'HDMI Port repairs and WLOD diagnosis.'
      }
    );

    // 5. Seed initial Repair Cases
    this.repairCases.push(
      {
        id: 'case-1',
        caseNumber: 'MC-2026-0001',
        userId: 'u-tech',
        customerName: 'Alex Rivera',
        customerContact: 'alex@example.com',
        brandId: 'b-apple',
        categoryId: 'c-iphone',
        modelId: 'm-iphone12',
        reportedFault: 'Auto restarts every 3 minutes. Started after screen replacement.',
        diagnosisSummary: 'Watchdog timeout due to missing pressure sensor prs0.',
        status: 'IN_REPAIR',
        estimatedCost: 120.00,
        finalCost: 0.00,
        notes: 'Torn charging port barometer flex. Needs replacement charging dock assembly.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'case-2',
        caseNumber: 'MC-2026-0002',
        userId: 'u-tech',
        customerName: 'Sarah Chen',
        customerContact: 'sarah@example.com',
        brandId: 'b-apple',
        categoryId: 'c-macbook',
        modelId: 'm-macbooka2338',
        reportedFault: 'Dead, no power, draws 5V 0.05A from charger.',
        diagnosisSummary: 'Short to ground on main board line PPBUS_G3H.',
        status: 'RECEIVED',
        estimatedCost: 250.00,
        finalCost: 0.00,
        notes: 'Resistance on PPBUS_G3H is 0.2 Ohms. shorted decoupling cap suspected.',
        createdAt: new Date().toISOString()
      }
    );

    // 6. Seed initial KB Article
    this.kbArticles.push({
      id: 'kb-1',
      title: 'iPhone 12 3-Minute Restarts (Missing prs0/mic1)',
      content: `### Symptom\nDevice restarts exactly every 3 minutes.\n\n### Diagnosis\nVerify panic log displays 'Missing sensor(s): prs0'.\n\n### Fix\nCheck charging dock FPC pins or replace charging port flex.`,
      brandId: 'b-apple',
      categoryId: 'c-iphone',
      modelId: 'm-iphone12',
      difficulty: 'EASY',
      visibility: 'PUBLIC',
      createdBy: 'u-admin',
      createdAt: new Date().toISOString()
    });

    console.log("In-Memory Mock Database successfully seeded.");
  }
}
