import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class ExamSessionsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: {
    courseName: string;
    courseCode: string;
    date: string;
    startTime: string;
    endTime: string;
    roomId: string;
    invigilatorIds?: string[];
  }) {
    const [room] = await this.db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.id, data.roomId))
      .limit(1);

    if (!room) {
      throw new BadRequestException('Room not found');
    }

    if (data.invigilatorIds?.length) {
      const invigilators = await this.db
        .select()
        .from(schema.users)
        .where(inArray(schema.users.id, data.invigilatorIds));

      if (invigilators.length !== data.invigilatorIds.length) {
        throw new BadRequestException('One or more invigilator IDs are invalid');
      }
    }

    const [session] = await this.db
      .insert(schema.examSessions)
      .values({
        courseName: data.courseName,
        courseCode: data.courseCode,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        roomId: data.roomId,
      })
      .returning();

    if (data.invigilatorIds?.length) {
      await this.db.insert(schema.examSessionInvigilators).values(
        data.invigilatorIds.map((userId) => ({
          examSessionId: session!.id,
          userId,
        })),
      );
    }

    return this.findById(session!.id);
  }

  async findAll() {
    const sessions = await this.db
      .select()
      .from(schema.examSessions)
      .orderBy(schema.examSessions.date);

    const result = [];
    for (const session of sessions) {
      const room = await this.db
        .select()
        .from(schema.examRooms)
        .where(eq(schema.examRooms.id, session.roomId))
        .limit(1)
        .then((r) => r[0]);

      const invigilatorLinks = await this.db
        .select()
        .from(schema.examSessionInvigilators)
        .where(eq(schema.examSessionInvigilators.examSessionId, session.id));

      const invigilators = invigilatorLinks.length
        ? await this.db
            .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
            .from(schema.users)
            .where(inArray(schema.users.id, invigilatorLinks.map((l) => l.userId)))
        : [];

      result.push({
        ...session,
        room,
        invigilators,
      });
    }

    return result;
  }

  async findById(id: string) {
    const [session] = await this.db
      .select()
      .from(schema.examSessions)
      .where(eq(schema.examSessions.id, id))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    const [room] = await this.db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.id, session.roomId))
      .limit(1);

    const invigilatorLinks = await this.db
      .select()
      .from(schema.examSessionInvigilators)
      .where(eq(schema.examSessionInvigilators.examSessionId, session.id));

    const invigilators = invigilatorLinks.length
      ? await this.db
          .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
          .from(schema.users)
          .where(inArray(schema.users.id, invigilatorLinks.map((l) => l.userId)))
      : [];

    return {
      ...session,
      room: room || null,
      invigilators,
    };
  }

  async update(id: string, data: Partial<{
    courseName: string;
    courseCode: string;
    date: string;
    startTime: string;
    endTime: string;
    roomId: string;
    status: string;
    invigilatorIds?: string[];
  }>) {
    const [existing] = await this.db
      .select()
      .from(schema.examSessions)
      .where(eq(schema.examSessions.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Exam session not found');
    }

    if (data.roomId) {
      const [room] = await this.db
        .select()
        .from(schema.examRooms)
        .where(eq(schema.examRooms.id, data.roomId))
        .limit(1);
      if (!room) {
        throw new BadRequestException('Room not found');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.courseName) updateData.courseName = data.courseName;
    if (data.courseCode) updateData.courseCode = data.courseCode;
    if (data.date) updateData.date = data.date;
    if (data.startTime) updateData.startTime = data.startTime;
    if (data.endTime) updateData.endTime = data.endTime;
    if (data.roomId) updateData.roomId = data.roomId;
    if (data.status) updateData.status = data.status;

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(schema.examSessions)
        .set(updateData)
        .where(eq(schema.examSessions.id, id));
    }

    if (data.invigilatorIds) {
      await this.db
        .delete(schema.examSessionInvigilators)
        .where(eq(schema.examSessionInvigilators.examSessionId, id));

      if (data.invigilatorIds.length > 0) {
        await this.db.insert(schema.examSessionInvigilators).values(
          data.invigilatorIds.map((userId) => ({
            examSessionId: id,
            userId,
          })),
        );
      }
    }

    return this.findById(id);
  }
}
