import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async create(
    name: string,
    username: string,
    email: string,
    password: string,
    role: 'ADMIN' | 'STAFF' | 'FINANCE' | 'MANAGER',
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username atau email sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      username?: string;
      email?: string;
      password?: string;
      role?: 'ADMIN' | 'STAFF' | 'FINANCE' | 'MANAGER';
    },
  ) {
    await this.findOne(id);

    if (data.username || data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            data.username ? { username: data.username } : undefined,
            data.email ? { email: data.email } : undefined,
          ].filter(Boolean) as any,
          NOT: {
            id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username atau email sudah digunakan');
      }
    }

    const updateData: any = {
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User berhasil dihapus',
    };
  }
}