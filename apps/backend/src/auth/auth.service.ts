import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as schema from '../database/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async registerAdmin(email: string, password: string): Promise<{ message: string }> {
    const [existing] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.db.insert(schema.users).values({
      email,
      passwordHash,
      role: 'ADMIN',
    });

    return { message: 'Admin user created successfully' };
  }

  async register(
    email: string,
    password: string,
    role: 'ADMIN' | 'LECTURER' | 'INVIGILATOR' | 'STUDENT',
    fullName?: string,
    matricNumber?: string,
  ): Promise<{ message: string }> {
    if (role === 'ADMIN') {
      throw new UnauthorizedException('Public registration as ADMIN is not allowed');
    }

    const [existing] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    if (role === 'STUDENT' && (!fullName || !matricNumber)) {
      throw new UnauthorizedException('Full name and matric number are required for students');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        role,
      })
      .returning({ id: schema.users.id });

    if (role === 'STUDENT') {
      const qrCodeHash = `qr_${crypto.randomBytes(16).toString('hex')}`;
      await this.db.insert(schema.students).values({
        userId: user!.id,
        fullName: fullName!,
        matricNumber: matricNumber!,
        qrCodeHash,
      });
    }

    return { message: 'Account created successfully' };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: { id: string; email: string; role: string } }> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign({ ...payload });

    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
