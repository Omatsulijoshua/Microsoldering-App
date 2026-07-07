import { Injectable } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class AdminService {
  constructor(private dbService: DbService) {}

  getStats() {
    return {
      totalUsers: this.dbService.users.length,
      totalTechnicians: this.dbService.users.filter(u => u.role === 'TECHNICIAN').length,
      totalRepairCases: this.dbService.repairCases.length,
      totalKnowledgeBaseArticles: this.dbService.kbArticles.length,
      activeSubscriptions: this.dbService.users.length, // reference count
      revenue: 2450.00, // mock revenue sum
    };
  }

  getAnalytics() {
    return {
      brandsStats: [
        { brand: 'Apple', count: 12 },
        { brand: 'Samsung', count: 8 },
        { brand: 'Sony', count: 3 },
        { brand: 'Nintendo', count: 2 }
      ],
      faultsStats: [
        { fault: 'No Power / Dead Board', count: 9 },
        { fault: '3-Minute Restarts (Missing prs0)', count: 6 },
        { fault: 'HDMI White Light of Death', count: 4 },
        { fault: 'NAND Corruption', count: 3 }
      ],
      monthlyRevenue: [
        { month: 'May', value: 1200.00 },
        { month: 'June', value: 1850.00 },
        { month: 'July', value: 2450.00 }
      ]
    };
  }

  getAuditLogs() {
    return this.dbService.auditLogs;
  }

  logAction(userId: string, action: string, details: string, ipAddress?: string) {
    const newLog = {
      id: `audit-${Date.now()}`,
      userId,
      action,
      details,
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString()
    };
    this.dbService.auditLogs.unshift(newLog);
    return newLog;
  }
}
