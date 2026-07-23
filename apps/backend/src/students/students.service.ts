import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as schema from '../database/schema';

@Injectable()
export class StudentsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createStudent(data: {
    email: string;
    password: string;
    fullName: string;
    matricNumber: string;
  }) {
    const [existingUser] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const [existingMatric] = await this.db
      .select()
      .from(schema.students)
      .where(eq(schema.students.matricNumber, data.matricNumber))
      .limit(1);

    if (existingMatric) {
      throw new ConflictException('Matric number already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const qrCodeHash = crypto.randomUUID();

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: data.email,
        passwordHash,
        role: 'STUDENT',
      })
      .returning();

    const [student] = await this.db
      .insert(schema.students)
      .values({
        userId: user!.id,
        fullName: data.fullName,
        matricNumber: data.matricNumber,
        qrCodeHash,
      })
      .returning();

    return {
      id: student!.id,
      fullName: student!.fullName,
      matricNumber: student!.matricNumber,
      email: user!.email,
      qrCodeHash: student!.qrCodeHash,
    };
  }

  async findAll() {
    const allStudents = await this.db
      .select({
        id: schema.students.id,
        fullName: schema.students.fullName,
        matricNumber: schema.students.matricNumber,
        qrCodeHash: schema.students.qrCodeHash,
        email: schema.users.email,
        createdAt: schema.students.createdAt,
      })
      .from(schema.students)
      .leftJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .orderBy(schema.students.createdAt);

    return allStudents;
  }

  async generateQrCode(studentId: string): Promise<Buffer> {
    const [student] = await this.db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const qrData = JSON.stringify({
      studentId: student.id,
      matricNumber: student.matricNumber,
      qrCodeHash: student.qrCodeHash,
    });

    return QRCode.toBuffer(qrData, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#1a365d',
        light: '#ffffff',
      },
    });
  }
}
