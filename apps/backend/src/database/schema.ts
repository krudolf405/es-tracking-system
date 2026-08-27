import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'LECTURER', 'INVIGILATOR', 'STUDENT']);
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'PRESENT',
  'LATE',
  'ABSENT',
]);
export const incidentTypeEnum = pgEnum('incident_type', [
  'MALPRACTICE',
  'UNAUTHORIZED_ENTRY',
  'TECHNICAL_ISSUE',
  'OTHER',
]);
export const sessionStatusEnum = pgEnum('session_status', [
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: roleEnum('role').notNull().default('STUDENT'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('email_idx').on(table.email),
  }),
);

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    matricNumber: varchar('matric_number', { length: 50 }).notNull().unique(),
    qrCodeHash: varchar('qr_code_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    matricIdx: uniqueIndex('matric_idx').on(table.matricNumber),
  }),
);

export const examRooms = pgTable('exam_rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  capacity: varchar('capacity', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const examSessions = pgTable('exam_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseName: varchar('course_name', { length: 255 }).notNull(),
  courseCode: varchar('course_code', { length: 50 }).notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  roomId: uuid('room_id')
    .notNull()
    .references(() => examRooms.id, { onDelete: 'restrict' }),
  status: sessionStatusEnum('status').notNull().default('SCHEDULED'),
  remarks: varchar('remarks', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const examSessionInvigilators = pgTable('exam_session_invigilators', {
  id: uuid('id').defaultRandom().primaryKey(),
  examSessionId: uuid('exam_session_id')
    .notNull()
    .references(() => examSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type ExamRoom = typeof examRooms.$inferSelect;
export type NewExamRoom = typeof examRooms.$inferInsert;
export type ExamSession = typeof examSessions.$inferSelect;
export type NewExamSession = typeof examSessions.$inferInsert;
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    examSessionId: uuid('exam_session_id')
      .notNull()
      .references(() => examSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    signInTime: timestamp('sign_in_time').defaultNow().notNull(),
    signOutTime: timestamp('sign_out_time'),
    status: attendanceStatusEnum('status').notNull().default('ABSENT'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionStudentIdx: uniqueIndex('session_student_idx').on(
      table.examSessionId,
      table.studentId,
    ),
  }),
);

export const incidents = pgTable('incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  examSessionId: uuid('exam_session_id')
    .notNull()
    .references(() => examSessions.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
  reportedById: uuid('reported_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: incidentTypeEnum('type').notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ExamSessionInvigilator = typeof examSessionInvigilators.$inferSelect;
export type NewExamSessionInvigilator = typeof examSessionInvigilators.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export const courseEnrollments = pgTable(
  'course_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseCode: varchar('course_code', { length: 50 }).notNull(),
    enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  },
  (table) => ({
    studentCourseIdx: uniqueIndex('student_course_idx').on(
      table.studentId,
      table.courseCode,
    ),
  }),
);

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
