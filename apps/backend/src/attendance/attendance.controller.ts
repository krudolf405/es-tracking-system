import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles('ADMIN', 'INVIGILATOR')
  checkIn(@Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(dto);
  }

  @Post('check-out')
  @Roles('ADMIN', 'INVIGILATOR')
  checkOut(@Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(dto);
  }

  @Get('session/:examSessionId')
  getSessionAttendance(@Param('examSessionId', ParseUUIDPipe) examSessionId: string) {
    return this.attendanceService.getSessionAttendance(examSessionId);
  }

  @Get('active-stats')
  @Roles('ADMIN')
  getActiveSessionStats() {
    return this.attendanceService.getActiveSessionStats();
  }

  @Get('absent-students')
  @Roles('ADMIN')
  getAbsentStudents() {
    return this.attendanceService.getAbsentStudents();
  }

  @Get('present-students')
  @Roles('ADMIN')
  getPresentStudents() {
    return this.attendanceService.getPresentStudents();
  }
}
