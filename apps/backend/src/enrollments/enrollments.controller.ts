import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EnrollmentsService } from './enrollments.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles('ADMIN')
  async enroll(@Body() dto: EnrollStudentDto) {
    if (dto.studentIds?.length) {
      return this.enrollmentsService.enrollBulk(dto.studentIds, dto.courseCode);
    }
    return this.enrollmentsService.enroll(dto.studentId!, dto.courseCode);
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.enrollmentsService.findAll();
  }

  @Get('course/:courseCode')
  @Roles('ADMIN')
  async getCourseStudents(@Param('courseCode') courseCode: string) {
    return this.enrollmentsService.getCourseStudents(courseCode);
  }

  @Get('student/:studentId')
  @Roles('ADMIN')
  async getStudentCourses(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.enrollmentsService.getStudentCourses(studentId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async removeEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.removeEnrollment(id);
  }
}
