import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class CasesService {
  constructor(private dbService: DbService) {}

  findAll() {
    return this.dbService.repairCases;
  }

  findOne(id: string) {
    const ticket = this.dbService.repairCases.find(c => c.id === id);
    if (!ticket) throw new NotFoundException(`Repair Case ${id} not found`);
    return ticket;
  }

  create(caseData: any) {
    const newCase = {
      id: `case-${Date.now()}`,
      caseNumber: `MC-2026-000${this.dbService.repairCases.length + 1}`,
      userId: caseData.userId || 'u-tech',
      customerName: caseData.customerName,
      customerContact: caseData.customerContact || '',
      brandId: caseData.brandId || '',
      categoryId: caseData.categoryId || '',
      modelId: caseData.modelId || '',
      reportedFault: caseData.reportedFault,
      physicalCondition: caseData.physicalCondition || '',
      waterDamage: caseData.waterDamage || false,
      previousRepair: caseData.previousRepair || false,
      diagnosisSummary: caseData.diagnosisSummary || '',
      status: caseData.status || 'RECEIVED',
      estimatedCost: caseData.estimatedCost || 0.00,
      finalCost: caseData.finalCost || 0.00,
      notes: caseData.notes || '',
      partsRequired: caseData.partsRequired || [],
      partsUsed: caseData.partsUsed || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dbService.repairCases.unshift(newCase);
    return newCase;
  }

  update(id: string, updateData: any) {
    const ticket = this.findOne(id);
    
    if (updateData.customerName) ticket.customerName = updateData.customerName;
    if (updateData.reportedFault) ticket.reportedFault = updateData.reportedFault;
    if (updateData.status) ticket.status = updateData.status;
    if (updateData.estimatedCost !== undefined) ticket.estimatedCost = updateData.estimatedCost;
    if (updateData.finalCost !== undefined) ticket.finalCost = updateData.finalCost;
    if (updateData.notes) ticket.notes = updateData.notes;
    
    ticket.updatedAt = new Date().toISOString();
    return ticket;
  }

  delete(id: string) {
    const idx = this.dbService.repairCases.findIndex(c => c.id === id);
    if (idx === -1) throw new NotFoundException(`Repair Case ${id} not found`);
    const removed = this.dbService.repairCases[idx];
    this.dbService.repairCases.splice(idx, 1);
    return removed;
  }

  addFile(id: string, fileName: string, fileUrl: string, fileType: string, fileSize: number) {
    const ticket = this.findOne(id);
    const newFile = {
      id: `file-${Date.now()}`,
      repairCaseId: id,
      fileName,
      fileUrl,
      fileType,
      fileSize
    };
    if (!ticket.files) ticket.files = [];
    ticket.files.push(newFile);
    return newFile;
  }

  addMeasurement(id: string, railName: string, expectedValue: string, measuredValue: string, measurementType: string) {
    const ticket = this.findOne(id);
    const newMeasurement = {
      id: `meas-${Date.now()}`,
      repairCaseId: id,
      railName,
      expectedValue,
      measuredValue,
      measurementType,
      status: expectedValue === measuredValue ? 'NORMAL' : 'FAILED',
      createdAt: new Date().toISOString()
    };
    if (!ticket.measurements) ticket.measurements = [];
    ticket.measurements.push(newMeasurement);
    return newMeasurement;
  }

  generateReport(id: string) {
    const ticket = this.findOne(id);
    return {
      title: `Repair Diagnostics Report: ${ticket.caseNumber}`,
      generatedAt: new Date().toISOString(),
      technician: "Microsolder AI Diagnostics",
      summary: ticket.diagnosisSummary || "Investigation in progress.",
      ticketDetails: ticket
    };
  }
}
