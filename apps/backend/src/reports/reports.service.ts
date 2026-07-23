import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as ExcelJS from 'exceljs';
import * as PDFKit from 'pdfkit';
import { Readable } from 'stream';
import { attendance, students, examSessions, examRooms, incidents, users } from '../database/schema';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase,
  ) {}

  async getAttendanceExcel(examSessionId: string): Promise<{ stream: Readable; filename: string }> {
    const session = await this.getSessionOrThrow(examSessionId);
    const records = await this.db
      .select({
        studentName: students.fullName,
        matricNumber: students.matricNumber,
        signInTime: attendance.signInTime,
        signOutTime: attendance.signOutTime,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(attendance.examSessionId, examSessionId))
      .orderBy(students.fullName);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    sheet.columns = [
      { header: 'Student Name', key: 'studentName', width: 30 },
      { header: 'Matric Number', key: 'matricNumber', width: 20 },
      { header: 'Sign In Time', key: 'signInTime', width: 25 },
      { header: 'Sign Out Time', key: 'signOutTime', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    sheet.addRows(
      records.map((r) => ({
        studentName: r.studentName,
        matricNumber: r.matricNumber,
        signInTime: r.signInTime?.toISOString() || '',
        signOutTime: r.signOutTime?.toISOString() || '',
        status: r.status,
      })),
    );

    sheet.getRow(1).font = { bold: true };

    const filename = `attendance-${session.courseCode}-${session.date}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return { stream, filename };
  }

  async getAttendancePdf(examSessionId: string): Promise<{ stream: PDFKit.PDFDocument; filename: string }> {
    const session = await this.getSessionOrThrow(examSessionId);
    const records = await this.db
      .select({
        studentName: students.fullName,
        matricNumber: students.matricNumber,
        signInTime: attendance.signInTime,
        signOutTime: attendance.signOutTime,
        status: attendance.status,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .where(eq(attendance.examSessionId, examSessionId))
      .orderBy(students.fullName);

    const doc = new PDFKit({ margin: 50 });
    const filename = `attendance-${session.courseCode}-${session.date}.pdf`;

    doc.fontSize(18).text('Attendance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`${session.courseName} (${session.courseCode})`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${session.date}  |  Time: ${session.startTime} - ${session.endTime}`, { align: 'center' });
    doc.moveDown();

    const room = await this.db
      .select()
      .from(examRooms)
      .where(eq(examRooms.id, session.roomId))
      .limit(1);
    if (room[0]) {
      doc.fontSize(10).text(`Room: ${room[0].name}`, { align: 'center' });
    }
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const colX = [50, 200, 350, 450];
    const colHeaders = ['Student Name', 'Matric No', 'Sign In', 'Status'];

    doc.fontSize(10).font('Helvetica-Bold');
    colHeaders.forEach((h, i) => doc.text(h, colX[i]!, tableTop));
    doc.moveDown(0.5);

    doc.font('Helvetica');
    let y = doc.y;
    for (const r of records) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(r.studentName, colX[0]!, y);
      doc.text(r.matricNumber, colX[1]!, y);
      doc.text(r.signInTime ? r.signInTime.toLocaleTimeString() : '-', colX[2]!, y);
      doc.text(r.status, colX[3]!, y);
      y += 20;
    }

    doc.end();
    return { stream: doc, filename };
  }

  async getIncidentsPdf(examSessionId: string): Promise<{ stream: PDFKit.PDFDocument; filename: string }> {
    const session = await this.getSessionOrThrow(examSessionId);
    const rows = await this.db
      .select({
        type: incidents.type,
        description: incidents.description,
        timestamp: incidents.timestamp,
        studentName: students.fullName,
        reportedByEmail: users.email,
      })
      .from(incidents)
      .leftJoin(students, eq(incidents.studentId, students.id))
      .innerJoin(users, eq(incidents.reportedById, users.id))
      .where(eq(incidents.examSessionId, examSessionId))
      .orderBy(incidents.timestamp);

    const doc = new PDFKit({ margin: 50 });
    const filename = `incidents-${session.courseCode}-${session.date}.pdf`;

    doc.fontSize(18).text('Incident Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`${session.courseName} (${session.courseCode})`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${session.date}  |  Time: ${session.startTime} - ${session.endTime}`, { align: 'center' });
    doc.moveDown(1.5);

    if (rows.length === 0) {
      doc.fontSize(12).text('No incidents reported for this session.', { align: 'center' });
      doc.end();
      return { stream: doc, filename };
    }

    const tableTop = doc.y;
    const colX = [50, 150, 300, 450];
    const colHeaders = ['Time', 'Type', 'Student', 'Reported By'];

    doc.fontSize(10).font('Helvetica-Bold');
    colHeaders.forEach((h, i) => doc.text(h, colX[i]!, tableTop));
    doc.moveDown(0.5);

    doc.font('Helvetica');
    let y = doc.y;
    for (const r of rows) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(r.timestamp ? r.timestamp.toLocaleTimeString() : '-', colX[0]!, y);
      doc.text(r.type, colX[1]!, y);
      doc.text(r.studentName || 'N/A', colX[2]!, y);
      doc.text(r.reportedByEmail, colX[3]!, y);
      y += 15;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(9).text(r.description, colX[0]!, y, { width: 500 });
      doc.fontSize(10);
      y += 25;
    }

    doc.end();
    return { stream: doc, filename };
  }

  private async getSessionOrThrow(examSessionId: string) {
    const sessions = await this.db
      .select()
      .from(examSessions)
      .where(eq(examSessions.id, examSessionId))
      .limit(1);

    if (!sessions.length) {
      throw new NotFoundException('Exam session not found');
    }
    return sessions[0]!;
  }
}
