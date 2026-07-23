import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.examRooms).orderBy(schema.examRooms.name);
  }

  async findById(id: string) {
    const [room] = await this.db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.id, id))
      .limit(1);
    return room || null;
  }
}
