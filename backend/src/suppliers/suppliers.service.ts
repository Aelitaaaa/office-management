import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.supplier.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan',
      );
    }

    return supplier;
  }

  async create(
    data: CreateSupplierDto,
    userId: number,
  ) {
    if (data.email) {
      const existingSupplier =
        await this.prisma.supplier.findFirst({
          where: {
            email: data.email,
            deletedAt: null,
          },
        });

      if (existingSupplier) {
        throw new ConflictException(
          'Email supplier sudah digunakan',
        );
      }
    }

    const lastSupplier =
      await this.prisma.supplier.findFirst({
        orderBy: {
          id: 'desc',
        },
      });

    const nextNumber =
      lastSupplier
        ? lastSupplier.id + 1
        : 1;

    const code =
      `SUP${String(nextNumber).padStart(
        4,
        '0',
      )}`;

    const supplier =
      await this.prisma.supplier.create({
        data: {
          code,
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          isActive:
            data.isActive ?? true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'SUPPLIER',
      description:
        `Menambahkan supplier ${supplier.name} (${supplier.code})`,
      entityId: supplier.id,
    });

    return supplier;
  }

  async update(
    id: number,
    data: UpdateSupplierDto,
    userId: number,
  ) {
    await this.findOne(id);

    if (data.email) {
      const existingSupplier =
        await this.prisma.supplier.findFirst({
          where: {
            email: data.email,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingSupplier) {
        throw new ConflictException(
          'Email supplier sudah digunakan',
        );
      }
    }

    const supplier =
      await this.prisma.supplier.update({
        where: {
          id,
        },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          isActive: data.isActive,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'SUPPLIER',
      description:
        `Mengubah data supplier ${supplier.name} (${supplier.code})`,
      entityId: supplier.id,
    });

    return supplier;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const supplier =
      await this.findOne(id);

    await this.prisma.supplier.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedById,
        isActive: false,
      },
    });

    await this.activityLogService.create({
      userId: deletedById,
      action: 'DELETE',
      module: 'SUPPLIER',
      description:
        `Memindahkan supplier ${supplier.name} (${supplier.code}) ke riwayat`,
      entityId: supplier.id,
    });

    return {
      message:
        'Supplier berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan di history',
      );
    }

    await this.prisma.supplier.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
        deletedById: null,
        isActive: true,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'RESTORE',
      module: 'SUPPLIER',
      description:
        `Memulihkan supplier ${supplier.name} (${supplier.code})`,
      entityId: supplier.id,
    });

    return {
      message:
        'Supplier berhasil dipulihkan',
    };
  }
}