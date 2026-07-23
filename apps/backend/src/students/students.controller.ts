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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('ADMIN', 'LECTURER')
  async createStudent(@Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      matricNumber: dto.matricNumber,
    });
  }

  @Get()
  @Roles('ADMIN', 'LECTURER')
  async findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id/qrcode')
  @Roles('ADMIN', 'LECTURER')
  async getQrCode(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.studentsService.generateQrCode(id);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="student-${id}-qrcode.png"`);
    res.send(buffer);
  }
}
