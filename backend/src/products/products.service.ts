import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.product.findMany({
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
    const product =
      await this.prisma.product.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan',
      );
    }

    return product;
  }

  async create(
    data: CreateProductDto,
    userId: number,
  ) {
    const lastProduct =
      await this.prisma.product.findFirst({
        orderBy: {
          id: 'desc',
        },
      });

    const nextNumber =
      lastProduct
        ? lastProduct.id + 1
        : 1;

    const code =
      `PRD${String(nextNumber).padStart(
        4,
        '0',
      )}`;

    const existingProduct =
      await this.prisma.product.findUnique({
        where: {
          code,
        },
      });

    if (existingProduct) {
      throw new ConflictException(
        'Kode product sudah digunakan',
      );
    }

    const product =
      await this.prisma.product.create({
        data: {
          code,
          name: data.name,
          type: data.type,
          unit: data.unit,
          stock: data.stock ?? 0,
          minimumStock:
            data.minimumStock ?? 0,
          description:
            data.description,
          isActive:
            data.isActive ?? true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'PRODUCT',
      description:
        `Menambahkan product ${product.name} (${product.code})`,
      entityId: product.id,
    });

    return product;
  }

  async update(
    id: number,
    data: UpdateProductDto,
    userId: number,
  ) {
    await this.findOne(id);

    const product =
      await this.prisma.product.update({
        where: {
          id,
        },
        data: {
          name: data.name,
          type: data.type,
          unit: data.unit,
          stock: data.stock,
          minimumStock:
            data.minimumStock,
          description:
            data.description,
          isActive:
            data.isActive,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'PRODUCT',
      description:
        `Mengubah data product ${product.name} (${product.code})`,
      entityId: product.id,
    });

    return product;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const product =
      await this.findOne(id);

    await this.prisma.product.update({
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
      module: 'PRODUCT',
      description:
        `Memindahkan product ${product.name} (${product.code}) ke riwayat`,
      entityId: product.id,
    });

    return {
      message:
        'Product berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const product =
      await this.prisma.product.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product tidak ditemukan di history',
      );
    }

    await this.prisma.product.update({
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
      module: 'PRODUCT',
      description:
        `Memulihkan product ${product.name} (${product.code})`,
      entityId: product.id,
    });

    return {
      message:
        'Product berhasil dipulihkan',
    };
  }
}