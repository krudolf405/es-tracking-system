import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and } from 'drizzle-orm';
import { attendance, students, examSessions } from '../database/schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

const LATE_THRESHOLD_MINUTES = 15;

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async checkIn(dto: CheckInDto) {
    const studentsList = await this.db
      .select()
      .from(students)
      .where(eq(students.qrCodeHash, dto.qrCodeHash))
      .limit(1);

    if (!studentsList.length) {
      throw new NotFoundException('Student not found for the given QR code');
    }
    const student = studentsList[0]!;

    const sessions = await this.db
      .select()
      .from(examSessions)
      .where(eq(examSessions.id, dto.examSessionId))
      .limit(1);

    if (!sessions.length) {
      throw new NotFoundException('Exam session not found');
    }
    const session = sessions[0]!;

    const existing = await this.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.examSessionId, dto.examSessionId),
          eq(attendance.studentId, student.id),
        ),
      )
      .limit(1);

    if (existing.length) {
      throw new ConflictException('Student is already checked in for this session');
    }

    const now = new Date();
    const status = this.determineStatus(session, now);

    const [record] = await this.db
      .insert(attendance)
      .values({
        examSessionId: dto.examSessionId,
        studentId: student.id,
        signInTime: now,
        status,
      })
      .returning();

    const stats = await this.getSessionStats(dto.examSessionId);

    this.realtimeGateway.emitAttendanceUpdated({
      examSessionId: dto.examSessionId,
      attendance: {
        id: record!.id,
        studentId: student.id,
        studentName: student.fullName,
        matricNumber: student.matricNumber,
        status: record!.status,
        signInTime: record!.signInTime.toISOString(),
      },
      stats,
    });

    this.logger.log(
      `Student ${student.fullName} (${student.matricNumber}) checked in as ${status}`,
    );

    return {
      attendance: record,
      student,
      status,
    };
  }

  async checkOut(dto: CheckOutDto) {
    const records = await this.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.examSessionId, dto.examSessionId),
          eq(attendance.studentId, dto.studentId),
        ),
      )
      .limit(1);

    if (!records.length) {
      throw new NotFoundException('Attendance record not found');
    }

    const [updated] = await this.db
      .update(attendance)
      .set({ signOutTime: new Date() })
      .where(eq(attendance.id, records[0]!.id))
      .returning();

    return updated;
  }

  async getSessionAttendance(examSessionId: string) {
    const records = await this.db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        signInTime: attendance.signInTime,
        signOutTime: attendance.signOutTime,
        status: attendance.status,
        createdAt: attendance.createdAt,
        studentName: students.fullName,
        matricNumber: students.matricNumber,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(attendance.examSessionId, examSessionId))
      .orderBy(attendance.signInTime);

    return records;
  }

  async getSessionStats(examSessionId: string) {
    const result = await this.db
      .select({
        totalPresent: sql<number>`COUNT(*) FILTER (WHERE ${attendance.status} = 'PRESENT')`,
        totalLate: sql<number>`COUNT(*) FILTER (WHERE ${attendance.status} = 'LATE')`,
        totalAbsent: sql<number>`COUNT(*) FILTER (WHERE ${attendance.status} = 'ABSENT')`,
      })
      .from(attendance)
      .where(eq(attendance.examSessionId, examSessionId));

    const row = result[0];
    return {
      totalPresent: Number(row?.totalPresent ?? 0),
      totalLate: Number(row?.totalLate ?? 0),
      totalAbsent: Number(row?.totalAbsent ?? 0),
      totalExpected:
        Number(row?.totalPresent ?? 0) +
        Number(row?.totalLate ?? 0) +
        Number(row?.totalAbsent ?? 0),
    };
  }

  async getActiveSessionStats() {
    const sessions = await this.db
      .select()
      .from(examSessions)
      .where(eq(examSessions.status, 'ACTIVE'));

    const result: Array<{
      id: string;
      courseName: string;
      courseCode: string;
      totalPresent: number;
      totalLate: number;
      totalAbsent: number;
      totalExpected: number;
    }> = [];
    for (const session of sessions) {
      const stats = await this.getSessionStats(session.id);
      result.push({
        id: session.id,
        courseName: session.courseName,
        courseCode: session.courseCode,
        ...stats,
      });
    }
    return result;
  }

  private determineStatus(
    session: typeof examSessions.$inferSelect,
    signInTime: Date,
  ): 'PRESENT' | 'LATE' {
    const parts = session.startTime.split(':');
    const hours = Number(parts[0]) || 0;
    const minutes = Number(parts[1]) || 0;
    const sessionStart = new Date(signInTime);
    sessionStart.setHours(hours, minutes, 0, 0);
    const threshold = new Date(sessionStart.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
    return signInTime > threshold ? 'LATE' : 'PRESENT';
  }
}
