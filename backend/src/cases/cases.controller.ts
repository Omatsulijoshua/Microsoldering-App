import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('repair-cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.casesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.casesService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.casesService.delete(id);
  }

  @Post(':id/files')
  addFile(@Param('id') id: string, @Body() body: any) {
    return this.casesService.addFile(
      id,
      body.fileName,
      body.fileUrl,
      body.fileType,
      body.fileSize
    );
  }

  @Post(':id/measurements')
  addMeasurement(@Param('id') id: string, @Body() body: any) {
    return this.casesService.addMeasurement(
      id,
      body.railName,
      body.expectedValue,
      body.measuredValue,
      body.measurementType
    );
  }

  @Post(':id/generate-report')
  generateReport(@Param('id') id: string) {
    return this.casesService.generateReport(id);
  }
}
