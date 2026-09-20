import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateActivityLogData {
  userId?: number | null;
  action: string;
  module: string;
  description: string;
  entityId?: number | null;
}

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateActivityLogData) {
    return this.prisma.activityLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        module: data.module,
        description: data.description,
        entityId: data.entityId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findLatest(limit = 5) {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      50,
    );

    return this.prisma.activityLog.findMany({
      take: safeLimit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.activityLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }
}
