import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance/:examSessionId/excel')
  @Roles('ADMIN', 'LECTURER')
  async getAttendanceExcel(
    @Param('examSessionId', ParseUUIDPipe) examSessionId: string,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.reportsService.getAttendanceExcel(examSessionId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  @Get('attendance/:examSessionId/pdf')
  @Roles('ADMIN', 'LECTURER')
  async getAttendancePdf(
    @Param('examSessionId', ParseUUIDPipe) examSessionId: string,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.reportsService.getAttendancePdf(examSessionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  @Get('incidents/:examSessionId/pdf')
  @Roles('ADMIN', 'LECTURER')
  async getIncidentsPdf(
    @Param('examSessionId', ParseUUIDPipe) examSessionId: string,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.reportsService.getIncidentsPdf(examSessionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }
}
