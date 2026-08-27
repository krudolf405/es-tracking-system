import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as schema from '../database/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        studentName: schema.students.fullName,
        matricNumber: schema.students.matricNumber,
      })
      .from(schema.users)
      .leftJoin(schema.students, eq(schema.students.userId, schema.users.id))
      .orderBy(schema.users.createdAt);
  }

  async createUser(data: {
    email: string;
    password: string;
    role: 'ADMIN' | 'INVIGILATOR' | 'STUDENT';
    fullName?: string;
    matricNumber?: string;
  }) {
    const [existingUser] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (data.role === 'STUDENT' && (!data.fullName || !data.matricNumber)) {
      throw new ConflictException(
        'Full name and matric number are required when creating a student account',
      );
    }

    if (data.role === 'STUDENT') {
      const [existingMatric] = await this.db
        .select()
        .from(schema.students)
        .where(eq(schema.students.matricNumber, data.matricNumber!))
        .limit(1);

      if (existingMatric) {
        throw new ConflictException('Matric number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: data.email,
        passwordHash,
        role: data.role,
      })
      .returning();

    if (data.role === 'STUDENT') {
      const qrCodeHash = `qr_${crypto.randomBytes(16).toString('hex')}`;
      await this.db.insert(schema.students).values({
        userId: user!.id,
        fullName: data.fullName!,
        matricNumber: data.matricNumber!,
        qrCodeHash,
      });
    }

    return {
      id: user!.id,
      email: user!.email,
      role: user!.role,
    };
  }

  async findInvigilators() {
    return this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.role, 'INVIGILATOR'));
  }

  async findById(id: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
