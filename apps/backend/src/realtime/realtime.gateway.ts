import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { examSessionId: string }) {
    const room = `exam-session:${payload.examSessionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined', data: { room } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: { examSessionId: string }) {
    const room = `exam-session:${payload.examSessionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'left', data: { room } };
  }

  emitAttendanceUpdated(data: {
    examSessionId: string;
    attendance: {
      id: string;
      studentId: string;
      studentName: string;
      matricNumber: string;
      status: string;
      signInTime: string;
    };
    stats: {
      totalPresent: number;
      totalLate: number;
      totalAbsent: number;
      totalExpected: number;
    };
  }) {
    const room = `exam-session:${data.examSessionId}`;
    this.server?.to(room).emit('attendanceUpdated', data);
  }

  emitIncidentLogged(data: {
    id: string;
    examSessionId: string;
    type: string;
    description: string;
    reportedBy: string;
    studentName?: string;
  }) {
    const room = `exam-session:${data.examSessionId}`;
    this.server?.to(room).emit('incidentLogged', data);
    this.server?.emit('incidentLogged', data);
  }
}
