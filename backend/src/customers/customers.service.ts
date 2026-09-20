import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.customer.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.customer.findMany({
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
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan',
      );
    }

    return customer;
  }

  async create(
    data: CreateCustomerDto,
    userId: number,
  ) {
    if (data.email) {
      const existingCustomer =
        await this.prisma.customer.findFirst({
          where: {
            email: data.email,
            deletedAt: null,
          },
        });

      if (existingCustomer) {
        throw new ConflictException(
          'Email customer sudah digunakan',
        );
      }
    }

    const lastCustomer =
      await this.prisma.customer.findFirst({
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
        },
      });

    const nextNumber =
      (lastCustomer?.id ?? 0) + 1;

    const code =
      `CUS${String(nextNumber).padStart(
        4,
        '0',
      )}`;

    const customer =
      await this.prisma.customer.create({
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
      module: 'CUSTOMER',
      description:
        `Menambahkan customer ${customer.name} (${customer.code})`,
      entityId: customer.id,
    });

    return customer;
  }

  async update(
    id: number,
    data: UpdateCustomerDto,
    userId: number,
  ) {
    await this.findOne(id);

    if (data.email) {
      const existingCustomer =
        await this.prisma.customer.findFirst({
          where: {
            email: data.email,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingCustomer) {
        throw new ConflictException(
          'Email customer sudah digunakan',
        );
      }
    }

    const customer =
      await this.prisma.customer.update({
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
      module: 'CUSTOMER',
      description:
        `Mengubah data customer ${customer.name} (${customer.code})`,
      entityId: customer.id,
    });

    return customer;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const customer =
      await this.findOne(id);

    await this.prisma.customer.update({
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
      module: 'CUSTOMER',
      description:
        `Memindahkan customer ${customer.name} (${customer.code}) ke riwayat`,
      entityId: customer.id,
    });

    return {
      message:
        'Customer berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan di history',
      );
    }

    await this.prisma.customer.update({
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
      module: 'CUSTOMER',
      description:
        `Memulihkan customer ${customer.name} (${customer.code})`,
      entityId: customer.id,
    });

    return {
      message:
        'Customer berhasil dipulihkan',
    };
  }
}