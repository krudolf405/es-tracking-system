import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExamSessionsService } from './exam-sessions.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { UpdateRemarksDto } from './dto/update-remarks.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-sessions')
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateExamSessionDto) {
    return this.examSessionsService.create({
      ...dto,
      invigilatorIds: dto.invigilatorIds,
    });
  }

  @Get()
  async findAll() {
    return this.examSessionsService.findAll();
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateExamSessionDto) {
    return this.examSessionsService.update(id, {
      ...dto,
      invigilatorIds: dto.invigilatorIds,
    });
  }

  @Patch(':id/remarks')
  @Roles('ADMIN', 'INVIGILATOR')
  async updateRemarks(@Param('id') id: string, @Body() dto: UpdateRemarksDto) {
    return this.examSessionsService.updateRemarks(id, dto.remarks);
  }
}
