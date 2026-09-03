import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  const adminHash = await bcrypt.hash('admin123', 12);
  const invigilatorHash = await bcrypt.hash('invig123', 12);
  const studentHash = await bcrypt.hash('student123', 12);

  async function ensureUser(
    email: string,
    passwordHash: string,
    role: schema.User['role'],
  ) {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    if (existing) return existing;
    const [created] = await db
      .insert(schema.users)
      .values({ email, passwordHash, role })
      .returning();
    return created!;
  }

  async function ensureStudent(
    email: string,
    fullName: string,
    matricNumber: string,
    qrCodeHash: string,
  ) {
    const user = await ensureUser(email, studentHash, 'STUDENT');
    const [existing] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.userId, user.id))
      .limit(1);
    if (existing) {
      return { user, student: existing };
    }
    const [student] = await db
      .insert(schema.students)
      .values({ userId: user.id, fullName, matricNumber, qrCodeHash })
      .returning();
    console.log(`Student created: ${email} / student123 (${fullName}, ${matricNumber})`);
    return { user, student: student! };
  }

  async function ensureInvigilator(email: string) {
    const user = await ensureUser(email, invigilatorHash, 'INVIGILATOR');
    console.log(`Invigilator ensured: ${email} / invig123`);
    return user;
  }

  // ---- Admin ----
  await ensureUser('admin@example.com', adminHash, 'ADMIN');
  console.log('Admin user ensured: admin@example.com / admin123');

  // ---- Invigilators ----
  const invigilators = await Promise.all([
    ensureInvigilator('invigilator@example.com'),
    ensureInvigilator('invigilator2@example.com'),
    ensureInvigilator('invigilator3@example.com'),
  ]);

  // ---- Students ----
  const students = await Promise.all([
    ensureStudent('student@example.com', 'John Doe', 'MAT/2024/001', 'qr_demo_student_001'),
    ensureStudent('student2@example.com', 'Jane Smith', 'MAT/2024/002', 'qr_demo_student_002'),
    ensureStudent('student3@example.com', 'Michael Johnson', 'MAT/2024/003', 'qr_demo_student_003'),
    ensureStudent('student4@example.com', 'Emily Davis', 'MAT/2024/004', 'qr_demo_student_004'),
    ensureStudent('student5@example.com', 'David Wilson', 'MAT/2024/005', 'qr_demo_student_005'),
    ensureStudent('student6@example.com', 'Sarah Brown', 'MAT/2024/006', 'qr_demo_student_006'),
    ensureStudent('student7@example.com', 'Daniel Taylor', 'MAT/2024/007', 'qr_demo_student_007'),
    ensureStudent('student8@example.com', 'Olivia Martinez', 'MAT/2024/008', 'qr_demo_student_008'),
    ensureStudent('student9@example.com', 'James Anderson', 'MAT/2024/009', 'qr_demo_student_009'),
    ensureStudent('student10@example.com', 'Sophia Thomas', 'MAT/2024/010', 'qr_demo_student_010'),
  ]);

  // ---- Rooms ----
  async function ensureRoom(name: string, capacity: string, location: string) {
    const [existing] = await db
      .select()
      .from(schema.examRooms)
      .where(eq(schema.examRooms.name, name))
      .limit(1);
    if (existing) return existing;
    const [room] = await db
      .insert(schema.examRooms)
      .values({ name, capacity, location })
      .returning();
    console.log(`Room created: ${name}`);
    return room!;
  }

  const roomA = await ensureRoom('Lecture Hall A', '100', 'Main Campus Building A');
  const roomB = await ensureRoom('Laboratory Block', '40', 'Science Complex');
  const roomC = await ensureRoom('Seminar Room 2', '30', 'Administration Wing');

  // ---- Enrollments (a few courses per student) ----
  const courses = ['MATH101', 'CSC201', 'PHY102', 'ENG202', 'BIO301'];
  async function ensureEnrollment(studentId: string, courseCode: string) {
    const [existing] = await db
      .select()
      .from(schema.courseEnrollments)
      .where(
        and(
          eq(schema.courseEnrollments.studentId, studentId),
          eq(schema.courseEnrollments.courseCode, courseCode),
        ),
      )
      .limit(1);
    if (existing) return;
    await db.insert(schema.courseEnrollments).values({ studentId, courseCode });
  }

  for (let i = 0; i < students.length; i++) {
    const studentId = students[i]!.student.id;
    // Each student is enrolled in 2-3 courses, rotating through the list
    const c1 = courses[i % courses.length]!;
    const c2 = courses[(i + 1) % courses.length]!;
    const c3 = courses[(i + 2) % courses.length]!;
    await ensureEnrollment(studentId, c1);
    await ensureEnrollment(studentId, c2);
    if (i % 2 === 0) await ensureEnrollment(studentId, c3);
  }
  console.log('Course enrollments ensured for all students.');

  // ---- Exam sessions ----
  async function ensureSession(
    courseName: string,
    courseCode: string,
    date: string,
    startTime: string,
    endTime: string,
    roomId: string,
    status: schema.ExamSession['status'],
    invigilatorUserIds: string[],
  ) {
    const [existing] = await db
      .select()
      .from(schema.examSessions)
      .where(eq(schema.examSessions.courseCode, courseCode))
      .limit(1);
    if (existing) return existing;

    const [session] = await db
      .insert(schema.examSessions)
      .values({ courseName, courseCode, date, startTime, endTime, roomId, status })
      .returning();

    await db.insert(schema.examSessionInvigilators).values(
      invigilatorUserIds.map((userId) => ({
        examSessionId: session!.id,
        userId,
      })),
    );
    console.log(`Exam session created: ${courseName} (${courseCode}) - ${status}`);
    return session!;
  }

  await ensureSession(
    'Mathematics 101',
    'MATH101',
    '2026-09-03',
    '09:00',
    '12:00',
    roomA.id,
    'SCHEDULED',
    [invigilators[0]!.id, invigilators[1]!.id],
  );
  await ensureSession(
    'Computer Science 201',
    'CSC201',
    '2026-09-04',
    '10:00',
    '13:00',
    roomB.id,
    'SCHEDULED',
    [invigilators[1]!.id],
  );
  await ensureSession(
    'Physics 102',
    'PHY102',
    '2026-09-05',
    '09:00',
    '12:00',
    roomC.id,
    'SCHEDULED',
    [invigilators[0]!.id, invigilators[2]!.id],
  );

  await pool.end();
  console.log('Seed completed successfully.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
