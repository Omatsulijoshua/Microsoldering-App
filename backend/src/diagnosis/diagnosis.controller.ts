import { Controller, Post, Body, UseGuards, Query, Get } from '@nestjs/common';
import { DiagnosisService, AiDiagnosticResponse } from './diagnosis.service';
import { AuthGuard } from '../auth/auth.guard';
import { getSimulatedDevices, detectUsbDevice } from '../services/usbDiagnostics';

@Controller()
export class DiagnosisController {
  constructor(private diagnosisService: DiagnosisService) {}

  @Post('diagnosis/symptom')
  async diagnoseSymptom(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseSymptom(body.symptom, body.modelName);
  }

  @Post('diagnosis/panic-log')
  async diagnosePanicLog(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnosePanicLog(body.logContent);
  }

  @Post('diagnosis/android-log')
  async diagnoseAndroidLog(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseAndroidLog(body.logContent);
  }

  @Post('diagnosis/windows-log')
  async diagnoseWindowsLog(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseWindowsLog(body.logContent);
  }

  @Post('diagnosis/macos-log')
  async diagnoseMacOsLog(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseMacOsLog(body.logContent);
  }

  @Post('diagnosis/measurement')
  async diagnoseBoardMeasurements(@Body() body: any): Promise<any> {
    return this.diagnosisService.diagnoseBoardMeasurements(body.measurements);
  }

  @Post('diagnosis/image')
  async diagnoseMicroscopeImage(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseImageAnalysis('microscope', body.fileName);
  }

  @Post('diagnosis/thermal')
  async diagnoseThermalImage(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnoseImageAnalysis('thermal', body.fileName);
  }

  // USB scan routes
  @Get('usb/device-info')
  async getUsbDeviceInfo(@Query('simulate') simulate: string, @Query('index') index: string): Promise<any> {
    if (simulate === 'true') {
      const mocks = getSimulatedDevices();
      const idx = parseInt(index);
      return !isNaN(idx) && idx >= 0 && idx < mocks.length ? mocks[idx] : mocks[0];
    }
    return detectUsbDevice();
  }

  @Post('usb/logs/analyze')
  async analyzeUsbLogs(@Body() body: any): Promise<AiDiagnosticResponse> {
    return this.diagnosisService.diagnosePanicLog(body.logContent);
  }
}
