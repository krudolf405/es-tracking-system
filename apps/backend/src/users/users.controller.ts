import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegisterDto } from '../auth/dto/register.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('invigilators')
  @Roles('ADMIN', 'INVIGILATOR')
  async getInvigilators() {
    return this.usersService.findInvigilators();
  }

  @Post()
  @Roles('ADMIN')
  async createUser(@Body() dto: RegisterDto) {
    return this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: dto.role,
      fullName: dto.fullName,
      matricNumber: dto.matricNumber,
    });
  }
}