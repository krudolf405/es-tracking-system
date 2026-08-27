-- Add remarks column to exam_sessions
ALTER TABLE "exam_sessions" ADD COLUMN "remarks" varchar(1000);--> statement-breakpoint
-- Create course_enrollments table
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_course_idx" UNIQUE("student_id","course_code")
);
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON UPDATE no action ON DELETE cascade;