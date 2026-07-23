import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  const passwordHash = await bcrypt.hash('admin123', 12);
  const invigilatorHash = await bcrypt.hash('invig123', 12);
  const studentHash = await bcrypt.hash('student123', 12);

  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'admin@example.com'))
    .limit(1);

  let adminId: string;
  if (existingAdmin.length === 0) {
    const [admin] = await db
      .insert(schema.users)
      .values({
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
      })
      .returning({ id: schema.users.id });
    adminId = admin.id;
    console.log('Admin user created: admin@example.com / admin123');
  } else {
    adminId = existingAdmin[0].id;
    console.log('Admin user already exists.');
  }

  const existingInvigilator = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'invigilator@example.com'))
    .limit(1);

  let invigilatorId: string;
  if (existingInvigilator.length === 0) {
    const [invigilator] = await db
      .insert(schema.users)
      .values({
        email: 'invigilator@example.com',
        passwordHash: invigilatorHash,
        role: 'INVIGILATOR',
      })
      .returning({ id: schema.users.id });
    invigilatorId = invigilator.id;
    console.log('Invigilator created: invigilator@example.com / invig123');
  } else {
    invigilatorId = existingInvigilator[0].id;
    console.log('Invigilator already exists.');
  }

  const existingStudentUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'student@example.com'))
    .limit(1);

  let studentId: string;
  if (existingStudentUser.length === 0) {
    const [studentUser] = await db
      .insert(schema.users)
      .values({
        email: 'student@example.com',
        passwordHash: studentHash,
        role: 'STUDENT',
      })
      .returning({ id: schema.users.id });

    const [student] = await db
      .insert(schema.students)
      .values({
        userId: studentUser.id,
        fullName: 'John Doe',
        matricNumber: 'MAT/2024/001',
        qrCodeHash: 'qr_demo_student_001',
      })
      .returning({ id: schema.students.id });
    studentId = student.id;
    console.log('Student created: student@example.com / student123');
  } else {
    const [existingStudentRecord] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.userId, existingStudentUser[0].id))
      .limit(1);
    studentId = existingStudentRecord
      ? existingStudentRecord.id
      : (
          await db
            .insert(schema.students)
            .values({
              userId: existingStudentUser[0].id,
              fullName: 'John Doe',
              matricNumber: 'MAT/2024/001',
              qrCodeHash: 'qr_demo_student_001',
            })
            .returning({ id: schema.students.id })
        )[0].id;
    console.log('Student already exists.');
  }

  const existingRoom = await db
    .select()
    .from(schema.examRooms)
    .where(eq(schema.examRooms.name, 'Lecture Hall A'))
    .limit(1);

  let roomId: string;
  if (existingRoom.length === 0) {
    const [room] = await db
      .insert(schema.examRooms)
      .values({
        name: 'Lecture Hall A',
        capacity: '100',
        location: 'Main Campus Building A',
      })
      .returning({ id: schema.examRooms.id });
    roomId = room.id;
    console.log('Room created: Lecture Hall A');
  } else {
    roomId = existingRoom[0].id;
    console.log('Room already exists.');
  }

  const existingSession = await db
    .select()
    .from(schema.examSessions)
    .where(eq(schema.examSessions.courseCode, 'MATH101'))
    .limit(1);

  if (existingSession.length === 0) {
    const [session] = await db
      .insert(schema.examSessions)
      .values({
        courseName: 'Mathematics 101',
        courseCode: 'MATH101',
        date: '2026-07-22',
        startTime: '09:00',
        endTime: '12:00',
        roomId,
        status: 'SCHEDULED',
      })
      .returning({ id: schema.examSessions.id });

    await db.insert(schema.examSessionInvigilators).values({
      examSessionId: session.id,
      userId: invigilatorId,
    });

    console.log(`Exam session created: Mathematics 101 (MATH101)`);
  } else {
    console.log('Exam session already exists.');
  }

  await pool.end();
  console.log('Seed completed successfully.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
