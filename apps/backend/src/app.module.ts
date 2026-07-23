import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { ExamSessionsModule } from './exam-sessions/exam-sessions.module';
import { RoomsModule } from './rooms/rooms.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AttendanceModule } from './attendance/attendance.module';
import { IncidentsModule } from './incidents/incidents.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    ExamSessionsModule,
    RoomsModule,
    RealtimeModule,
    AttendanceModule,
    IncidentsModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
