import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { incidents, examSessions, students, users } from '../database/schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateIncidentDto, reportedById: string) {
    const sessions = await this.db
      .select()
      .from(examSessions)
      .where(eq(examSessions.id, dto.examSessionId))
      .limit(1);

    if (!sessions.length) {
      throw new NotFoundException('Exam session not found');
    }

    const [record] = await this.db
      .insert(incidents)
      .values({
        examSessionId: dto.examSessionId,
        studentId: dto.studentId || null,
        reportedById,
        type: dto.type as 'MALPRACTICE' | 'UNAUTHORIZED_ENTRY' | 'TECHNICAL_ISSUE' | 'OTHER',
        description: dto.description,
      })
      .returning();

    const reporter = await this.db
      .select()
      .from(users)
      .where(eq(users.id, reportedById))
      .limit(1);

    let studentName: string | undefined;
    if (dto.studentId) {
      const studentRecord = await this.db
        .select()
        .from(students)
        .where(eq(students.id, dto.studentId))
        .limit(1);
      studentName = studentRecord[0]?.fullName;
    }

    this.realtimeGateway.emitIncidentLogged({
      id: record!.id,
      examSessionId: dto.examSessionId,
      type: record!.type,
      description: dto.description,
      reportedBy: reporter[0]?.email || 'Unknown',
      studentName,
    });

    return { incident: record };
  }

  async findBySession(examSessionId: string) {
    const rows = await this.db
      .select({
        id: incidents.id,
        type: incidents.type,
        description: incidents.description,
        timestamp: incidents.timestamp,
        createdAt: incidents.createdAt,
        studentName: students.fullName,
        matricNumber: students.matricNumber,
        reportedByEmail: users.email,
      })
      .from(incidents)
      .leftJoin(students, eq(incidents.studentId, students.id))
      .innerJoin(users, eq(incidents.reportedById, users.id))
      .where(eq(incidents.examSessionId, examSessionId))
      .orderBy(incidents.timestamp);

    return rows;
  }

  async findAll() {
    const rows = await this.db
      .select({
        id: incidents.id,
        examSessionId: incidents.examSessionId,
        type: incidents.type,
        description: incidents.description,
        timestamp: incidents.timestamp,
        createdAt: incidents.createdAt,
        studentName: students.fullName,
        matricNumber: students.matricNumber,
        reportedByEmail: users.email,
        courseName: examSessions.courseName,
        courseCode: examSessions.courseCode,
      })
      .from(incidents)
      .leftJoin(students, eq(incidents.studentId, students.id))
      .innerJoin(users, eq(incidents.reportedById, users.id))
      .innerJoin(examSessions, eq(incidents.examSessionId, examSessions.id))
      .orderBy(incidents.timestamp);

    return rows;
  }
}
