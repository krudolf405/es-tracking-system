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
import archiver from 'archiver';
import { Response } from 'express';
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

  async getProfile(userId: string) {
    const [student] = await this.db
      .select({
        id: schema.students.id,
        fullName: schema.students.fullName,
        matricNumber: schema.students.matricNumber,
        qrCodeHash: schema.students.qrCodeHash,
        email: schema.users.email,
      })
      .from(schema.students)
      .leftJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(eq(schema.students.userId, userId))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async getMyExams(studentId: string) {
    const enrollments = await this.db
      .select({ courseCode: schema.courseEnrollments.courseCode })
      .from(schema.courseEnrollments)
      .where(eq(schema.courseEnrollments.studentId, studentId));

    if (enrollments.length === 0) {
      return [];
    }

    const courseCodes = enrollments.map((e) => e.courseCode);

    const exams = await this.db
      .select({
        id: schema.examSessions.id,
        courseName: schema.examSessions.courseName,
        courseCode: schema.examSessions.courseCode,
        date: schema.examSessions.date,
        startTime: schema.examSessions.startTime,
        endTime: schema.examSessions.endTime,
        status: schema.examSessions.status,
        roomId: schema.examSessions.roomId,
        roomName: schema.examRooms.name,
      })
      .from(schema.examSessions)
      .leftJoin(schema.examRooms, eq(schema.examSessions.roomId, schema.examRooms.id))
      .where(
        courseCodes.length === 1
          ? eq(schema.examSessions.courseCode, courseCodes[0]!)
          : undefined,
      );

    const results: {
      examSession: {
        id: string;
        courseName: string;
        courseCode: string;
        date: string;
        startTime: string;
        endTime: string;
        status: string;
        roomName: string | null;
      };
      attendance: {
        signInTime: string | null;
        signOutTime: string | null;
        status: string;
      } | null;
      progress: number;
    }[] = [];

    for (const exam of exams) {
      if (!courseCodes.includes(exam.courseCode)) continue;

      const [attendance] = await this.db
        .select({
          signInTime: schema.attendance.signInTime,
          signOutTime: schema.attendance.signOutTime,
          status: schema.attendance.status,
        })
        .from(schema.attendance)
        .where(
          eq(schema.attendance.examSessionId, exam.id) &&
            eq(schema.attendance.studentId, studentId),
        )
        .limit(1);

      let progress = 0;
      if (attendance) {
        progress = attendance.signOutTime ? 100 : 50;
      }

      results.push({
        examSession: {
          id: exam.id,
          courseName: exam.courseName,
          courseCode: exam.courseCode,
          date: exam.date,
          startTime: exam.startTime,
          endTime: exam.endTime,
          status: exam.status,
          roomName: exam.roomName,
        },
        attendance: attendance
          ? {
              signInTime: attendance.signInTime?.toISOString() ?? null,
              signOutTime: attendance.signOutTime?.toISOString() ?? null,
              status: attendance.status,
            }
          : null,
        progress,
      });
    }

    return results;
  }

  async generateBulkQrCodes(studentId: string, res: Response) {
    const [student] = await this.db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="qr-codes.zip"');

    const archive = archiver('zip');
    archive.pipe(res);

    const buffer = await this.generateQrCode(studentId);
    archive.append(buffer, { name: 'qr-code.png' });

    await archive.finalize();
  }
}
