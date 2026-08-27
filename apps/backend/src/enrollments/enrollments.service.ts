import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async enroll(studentId: string, courseCode: string) {
    const [student] = await this.db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [existing] = await this.db
      .select()
      .from(schema.courseEnrollments)
      .where(
        and(
          eq(schema.courseEnrollments.studentId, studentId),
          eq(schema.courseEnrollments.courseCode, courseCode),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    const [enrollment] = await this.db
      .insert(schema.courseEnrollments)
      .values({ studentId, courseCode })
      .returning();

    return enrollment!;
  }

  async enrollBulk(studentIds: string[], courseCode: string) {
    const toInsert: { studentId: string; courseCode: string }[] = [];

    for (const studentId of studentIds) {
      const [existing] = await this.db
        .select()
        .from(schema.courseEnrollments)
        .where(
          and(
            eq(schema.courseEnrollments.studentId, studentId),
            eq(schema.courseEnrollments.courseCode, courseCode),
          ),
        )
        .limit(1);

      if (!existing) {
        toInsert.push({ studentId, courseCode });
      }
    }

    if (toInsert.length > 0) {
      await this.db
        .insert(schema.courseEnrollments)
        .values(toInsert);
    }

    return {
      enrolled: toInsert.length,
      skipped: studentIds.length - toInsert.length,
    };
  }

  async getCourseStudents(courseCode: string) {
    const rows = await this.db
      .select({
        enrollmentId: schema.courseEnrollments.id,
        studentId: schema.students.id,
        fullName: schema.students.fullName,
        matricNumber: schema.students.matricNumber,
        email: schema.users.email,
        enrolledAt: schema.courseEnrollments.enrolledAt,
      })
      .from(schema.courseEnrollments)
      .leftJoin(
        schema.students,
        eq(schema.courseEnrollments.studentId, schema.students.id),
      )
      .leftJoin(
        schema.users,
        eq(schema.students.userId, schema.users.id),
      )
      .where(eq(schema.courseEnrollments.courseCode, courseCode))
      .orderBy(schema.students.fullName);

    return rows;
  }

  async getStudentCourses(studentId: string) {
    const rows = await this.db
      .select({ courseCode: schema.courseEnrollments.courseCode })
      .from(schema.courseEnrollments)
      .where(eq(schema.courseEnrollments.studentId, studentId));

    return rows.map((r) => r.courseCode);
  }

  async countEnrolledStudents(courseCode: string) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.courseEnrollments)
      .where(eq(schema.courseEnrollments.courseCode, courseCode));

    return result!.count;
  }

  async removeEnrollment(id: string) {
    const [existing] = await this.db
      .select()
      .from(schema.courseEnrollments)
      .where(eq(schema.courseEnrollments.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.db
      .delete(schema.courseEnrollments)
      .where(eq(schema.courseEnrollments.id, id));

    return { message: 'Enrollment removed successfully' };
  }

  async findAll() {
    const rows = await this.db
      .select({
        courseCode: schema.courseEnrollments.courseCode,
        enrolledCount: sql<number>`count(*)::int`,
      })
      .from(schema.courseEnrollments)
      .groupBy(schema.courseEnrollments.courseCode)
      .orderBy(schema.courseEnrollments.courseCode);

    return rows;
  }
}
