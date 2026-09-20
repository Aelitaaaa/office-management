import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private readonly userSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    deletedById: true,
  };

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: this.userSelect,
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      select: this.userSelect,
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: this.userSelect,
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    return user;
  }

  async create(
    data: CreateUserDto,
    currentUserId: number,
  ) {
    const username =
      data.username.trim();

    const email =
      data.email.trim().toLowerCase();

    const existingUsername =
      await this.prisma.user.findUnique({
        where: {
          username,
        },
      });

    if (existingUsername) {
      throw new ConflictException(
        'Username sudah digunakan',
      );
    }

    const existingEmail =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingEmail) {
      throw new ConflictException(
        'Email sudah digunakan',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        data.password,
        10,
      );

    const createdUser =
      await this.prisma.user.create({
        data: {
          name: data.name.trim(),
          username,
          email,
          password: hashedPassword,
          role: data.role,
          isActive: true,
        },
        select: this.userSelect,
      });

    await this.activityLogService.create({
      userId: currentUserId,
      action: 'CREATE',
      module: 'USER',
      description:
        `Menambahkan user ${createdUser.username}`,
      entityId: createdUser.id,
    });

    return createdUser;
  }

  async update(
    id: number,
    data: UpdateUserDto,
    currentUserId: number,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    if (
      data.username &&
      data.username.trim() !==
        user.username
    ) {
      const username =
        data.username.trim();

      const existingUsername =
        await this.prisma.user.findUnique({
          where: {
            username,
          },
        });

      if (existingUsername) {
        throw new ConflictException(
          'Username sudah digunakan',
        );
      }
    }

    if (
      data.email &&
      data.email
        .trim()
        .toLowerCase() !==
        user.email.toLowerCase()
    ) {
      const email =
        data.email
          .trim()
          .toLowerCase();

      const existingEmail =
        await this.prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (existingEmail) {
        throw new ConflictException(
          'Email sudah digunakan',
        );
      }
    }

    if (
      id === currentUserId &&
      data.isActive === false
    ) {
      throw new BadRequestException(
        'Akun yang sedang digunakan tidak dapat dinonaktifkan',
      );
    }

    const hashedPassword =
      data.password
        ? await bcrypt.hash(
            data.password,
            10,
          )
        : undefined;

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          name:
            data.name !== undefined
              ? data.name.trim()
              : undefined,
          username:
            data.username !== undefined
              ? data.username.trim()
              : undefined,
          email:
            data.email !== undefined
              ? data.email
                  .trim()
                  .toLowerCase()
              : undefined,
          password: hashedPassword,
          role: data.role,
          isActive: data.isActive,
        },
        select: this.userSelect,
      });

    await this.activityLogService.create({
      userId: currentUserId,
      action: 'UPDATE',
      module: 'USER',
      description:
        `Mengubah user ${updatedUser.username}`,
      entityId: updatedUser.id,
    });

    return updatedUser;
  }

  async toggleActive(
    id: number,
    currentUserId: number,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    if (id === currentUserId) {
      throw new BadRequestException(
        'Akun yang sedang digunakan tidak dapat dinonaktifkan',
      );
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          isActive: !user.isActive,
        },
        select: this.userSelect,
      });

    await this.activityLogService.create({
      userId: currentUserId,
      action: updatedUser.isActive
        ? 'ACTIVATE'
        : 'DEACTIVATE',
      module: 'USER',
      description: updatedUser.isActive
        ? `Mengaktifkan user ${updatedUser.username}`
        : `Menonaktifkan user ${updatedUser.username}`,
      entityId: updatedUser.id,
    });

    return {
      message: updatedUser.isActive
        ? 'User berhasil diaktifkan'
        : 'User berhasil dinonaktifkan',
      user: updatedUser,
    };
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan',
      );
    }

    if (id === deletedById) {
      throw new BadRequestException(
        'Akun yang sedang digunakan tidak dapat dihapus',
      );
    }

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById,
      },
    });

    await this.activityLogService.create({
      userId: deletedById,
      action: 'DELETE',
      module: 'USER',
      description:
        `Memindahkan user ${user.username} ke riwayat`,
      entityId: user.id,
    });

    return {
      message:
        'User berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    currentUserId: number,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan di history',
      );
    }

    const usernameConflict =
      await this.prisma.user.findFirst({
        where: {
          username: user.username,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

    if (usernameConflict) {
      throw new ConflictException(
        'User tidak dapat dipulihkan karena username sudah digunakan',
      );
    }

    const emailConflict =
      await this.prisma.user.findFirst({
        where: {
          email: user.email,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

    if (emailConflict) {
      throw new ConflictException(
        'User tidak dapat dipulihkan karena email sudah digunakan',
      );
    }

    const restoredUser =
      await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          deletedAt: null,
          deletedById: null,
          isActive: true,
        },
        select: this.userSelect,
      });

    await this.activityLogService.create({
      userId: currentUserId,
      action: 'RESTORE',
      module: 'USER',
      description:
        `Memulihkan user ${restoredUser.username}`,
      entityId: restoredUser.id,
    });

    return {
      message:
        'User berhasil dipulihkan',
      user: restoredUser,
    };
  }

  async permanentDelete(
    id: number,
    currentUserId: number,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
        include: {
          orders: {
            select: {
              id: true,
            },
          },
          purchases: {
            select: {
              id: true,
            },
          },
          suratJalans: {
            select: {
              id: true,
            },
          },
          invoices: {
            select: {
              id: true,
            },
          },
          payments: {
            select: {
              id: true,
            },
          },
          incoming: {
            select: {
              id: true,
            },
          },
          outgoing: {
            select: {
              id: true,
            },
          },
          documents: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User tidak ditemukan di history',
      );
    }

    const hasRelations =
      user.orders.length > 0 ||
      user.purchases.length > 0 ||
      user.suratJalans.length > 0 ||
      user.invoices.length > 0 ||
      user.payments.length > 0 ||
      user.incoming.length > 0 ||
      user.outgoing.length > 0 ||
      user.documents.length > 0;

    if (hasRelations) {
      throw new ConflictException(
        'User tidak dapat dihapus permanen karena memiliki riwayat transaksi atau dokumen',
      );
    }

    const username =
      user.username;

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    await this.activityLogService.create({
      userId: currentUserId,
      action: 'PERMANENT_DELETE',
      module: 'USER',
      description:
        `Menghapus permanen user ${username}`,
      entityId: id,
    });

    return {
      message:
        'User berhasil dihapus permanen',
    };
  }
}