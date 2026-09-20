import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findActive() {
    const now = new Date();

    return this.prisma.announcement.findMany({
      where: {
        isActive: true,

        startDate: {
          lte: now,
        },

        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: now,
            },
          },
        ],
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const announcement =
      await this.prisma.announcement.findUnique({
        where: {
          id,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

    if (!announcement) {
      throw new NotFoundException(
        'Pengumuman tidak ditemukan',
      );
    }

    return announcement;
  }

  async create(
    dto: CreateAnnouncementDto,
    userId: number,
  ) {
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : new Date();

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : null;

    if (
      endDate &&
      endDate < startDate
    ) {
      throw new BadRequestException(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
      );
    }

    const announcement =
      await this.prisma.announcement.create({
        data: {
          title: dto.title.trim(),
          content: dto.content.trim(),
          isActive:
            dto.isActive ?? true,
          startDate,
          endDate,
          userId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'ANNOUNCEMENT',
      description:
        `Membuat pengumuman "${announcement.title}"`,
      entityId: announcement.id,
    });

    return announcement;
  }

  async update(
    id: number,
    dto: UpdateAnnouncementDto,
    userId: number,
  ) {
    const existing =
      await this.findOne(id);

    const startDate =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : existing.startDate;

    const endDate =
      dto.endDate !== undefined
        ? dto.endDate
          ? new Date(dto.endDate)
          : null
        : existing.endDate;

    if (
      endDate &&
      endDate < startDate
    ) {
      throw new BadRequestException(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
      );
    }

    const announcement =
      await this.prisma.announcement.update({
        where: {
          id,
        },

        data: {
          ...(dto.title !== undefined && {
            title: dto.title.trim(),
          }),

          ...(dto.content !== undefined && {
            content: dto.content.trim(),
          }),

          ...(dto.isActive !== undefined && {
            isActive: dto.isActive,
          }),

          ...(dto.startDate !== undefined && {
            startDate,
          }),

          ...(dto.endDate !== undefined && {
            endDate,
          }),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'ANNOUNCEMENT',
      description:
        `Mengubah pengumuman "${announcement.title}"`,
      entityId: announcement.id,
    });

    return announcement;
  }

  async remove(
    id: number,
    userId: number,
  ) {
    const announcement =
      await this.findOne(id);

    await this.prisma.announcement.delete({
      where: {
        id,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'DELETE',
      module: 'ANNOUNCEMENT',
      description:
        `Menghapus pengumuman "${announcement.title}"`,
      entityId: id,
    });

    return {
      message:
        'Pengumuman berhasil dihapus',
    };
  }
}
