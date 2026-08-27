import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.studentsService.getProfile(userId);
  }

  @Get('me/qrcode')
  async getMyQrCode(@CurrentUser('userId') userId: string, @Res() res: Response) {
    const student = await this.studentsService.getProfile(userId);
    const buffer = await this.studentsService.generateQrCode(student.id);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="my-qrcode.png"`);
    res.send(buffer);
  }

  @Get('me/exams')
  async getMyExams(@CurrentUser('userId') userId: string) {
    const student = await this.studentsService.getProfile(userId);
    return this.studentsService.getMyExams(student.id);
  }

  @Get('me/qrcode/bulk')
  async getBulkQrCodes(@CurrentUser('userId') userId: string, @Res() res: Response) {
    const student = await this.studentsService.getProfile(userId);
    await this.studentsService.generateBulkQrCodes(student.id, res);
  }

  @Post()
  @Roles('ADMIN')
  async createStudent(@Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      matricNumber: dto.matricNumber,
    });
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id/qrcode')
  @Roles('ADMIN')
  async getQrCode(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.studentsService.generateQrCode(id);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="student-${id}-qrcode.png"`);
    res.send(buffer);
  }
}