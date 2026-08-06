import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    const rows = await this.db
      .select({
        id: schema.examRooms.id,
        name: schema.examRooms.name,
        capacity: schema.examRooms.capacity,
        location: schema.examRooms.location,
        createdAt: schema.examRooms.createdAt,
        updatedAt: schema.examRooms.updatedAt,
        sessionCount: sql<number>`count(${schema.examSessions.id})::int`,
      })
      .from(schema.examRooms)
      .leftJoin(
        schema.examSessions,
        eq(schema.examSessions.roomId, schema.examRooms.id),
      )
      .groupBy(schema.examRooms.id)
      .orderBy(schema.examRooms.name);

    return rows;
  }

  async findById(id: string) {
    const [room] = await this.db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.id, id))
      .limit(1);
    return room || null;
  }

  async create(data: { name: string; capacity: string; location: string }) {
    const existing = await this.findByName(data.name);
    if (existing) {
      throw new ConflictException(`A room named "${data.name}" already exists`);
    }

    const [room] = await this.db
      .insert(schema.examRooms)
      .values({
        name: data.name,
        capacity: data.capacity,
        location: data.location,
      })
      .returning();

    return room!;
  }

  async update(
    id: string,
    data: { name?: string; capacity?: string; location?: string },
  ) {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (data.name && data.name !== room.name) {
      const existing = await this.findByName(data.name);
      if (existing) {
        throw new ConflictException(`A room named "${data.name}" already exists`);
      }
    }

    const [updated] = await this.db
      .update(schema.examRooms)
      .set({
        name: data.name ?? room.name,
        capacity: data.capacity ?? room.capacity,
        location: data.location ?? room.location,
      })
      .where(eq(schema.examRooms.id, id))
      .returning();

    return updated!;
  }

  async remove(id: string) {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const [sessionCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.examSessions)
      .where(eq(schema.examSessions.roomId, id));

    if (sessionCount!.count > 0) {
      throw new ConflictException(
        `Cannot delete "${room.name}" — ${sessionCount!.count} exam session(s) are assigned to this room. Reassign or delete them first.`,
      );
    }

    await this.db.delete(schema.examRooms).where(eq(schema.examRooms.id, id));

    return { message: `Room "${room.name}" deleted successfully` };
  }

  private async findByName(name: string) {
    const [room] = await this.db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.name, name))
      .limit(1);
    return room || null;
  }
}