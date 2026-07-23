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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles('ADMIN', 'INVIGILATOR')
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.incidentsService.create(dto, userId);
  }

  @Get('session/:examSessionId')
  @Roles('ADMIN', 'INVIGILATOR', 'LECTURER')
  findBySession(@Param('examSessionId', ParseUUIDPipe) examSessionId: string) {
    return this.incidentsService.findBySession(examSessionId);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.incidentsService.findAll();
  }
}
