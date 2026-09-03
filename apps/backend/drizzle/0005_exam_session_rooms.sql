-- Overflow rooms: allow an exam session to have additional (overflow) rooms
CREATE TABLE "exam_session_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_session_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_room_idx" UNIQUE("exam_session_id","room_id")
);
--> statement-breakpoint
ALTER TABLE "exam_session_rooms" ADD CONSTRAINT "exam_session_rooms_exam_session_id_exam_sessions_id_fk" FOREIGN KEY ("exam_session_id") REFERENCES "public"."exam_sessions"("id") ON UPDATE no action ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "exam_session_rooms" ADD CONSTRAINT "exam_session_rooms_room_id_exam_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."exam_rooms"("id") ON UPDATE no action ON DELETE cascade;
