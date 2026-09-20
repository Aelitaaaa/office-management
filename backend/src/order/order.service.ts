import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        details: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findHistory() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        details: {
          include: {
            product: true,
          },
        },
        suratJalan: true,
        invoice: true,
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          customer: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          details: {
            include: {
              product: true,
            },
          },
          suratJalan: true,
          invoice: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Pesanan tidak ditemukan',
      );
    }

    return order;
  }

  async create(
    data: CreateOrderDto,
    userId: number,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id: data.customerId,
          deletedAt: null,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer tidak ditemukan atau sudah diarsipkan',
      );
    }

    const productIds = [
      ...new Set(
        data.details.map(
          (item) => item.productId,
        ),
      ),
    ];

    const products =
      await this.prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          deletedAt: null,
        },
      });

    if (
      products.length !==
      productIds.length
    ) {
      throw new NotFoundException(
        'Salah satu produk tidak ditemukan atau sudah diarsipkan',
      );
    }

    const total = data.details.reduce(
      (sum, item) => {
        return (
          sum +
          item.quantity * item.price
        );
      },
      0,
    );

    const order =
      await this.prisma.$transaction(
        async (tx) => {
          const lastOrder =
            await tx.order.findFirst({
              orderBy: {
                id: 'desc',
              },
              select: {
                id: true,
              },
            });

          const nextNumber =
            (lastOrder?.id ?? 0) + 1;

          const orderNumber =
            `ORD${nextNumber
              .toString()
              .padStart(4, '0')}`;

          return tx.order.create({
            data: {
              orderNumber,
              customerId:
                data.customerId,
              userId,
              notes: data.notes,
              total,
              details: {
                create:
                  data.details.map(
                    (item) => ({
                      productId:
                        item.productId,
                      quantity:
                        item.quantity,
                      price:
                        item.price,
                      subtotal:
                        item.quantity *
                        item.price,
                    }),
                  ),
              },
            },
            include: {
              customer: true,
              details: {
                include: {
                  product: true,
                },
              },
            },
          });
        },
      );

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'ORDER',
      description:
        `Membuat pesanan ${order.orderNumber}`,
      entityId: order.id,
    });

    return order;
  }

  async update(
    id: number,
    data: UpdateOrderDto,
    userId: number,
  ) {
    const order =
      await this.findOne(id);

    if (
      order.status === 'DIBATALKAN' &&
      data.status !== 'DIBATALKAN'
    ) {
      throw new BadRequestException(
        'Pesanan yang sudah dibatalkan tidak dapat diaktifkan kembali melalui update',
      );
    }

    if (
      order.suratJalan &&
      data.status === 'DIBATALKAN'
    ) {
      throw new BadRequestException(
        'Pesanan yang sudah memiliki Surat Jalan tidak dapat dibatalkan melalui perubahan status',
      );
    }

    if (
      order.invoice &&
      data.status === 'DIBATALKAN'
    ) {
      throw new BadRequestException(
        'Pesanan yang sudah memiliki Invoice tidak dapat dibatalkan melalui perubahan status',
      );
    }

    const updatedOrder =
      await this.prisma.order.update({
        where: {
          id,
        },
        data: {
          status: data.status,
          notes: data.notes,
        },
        include: {
          customer: true,
          details: {
            include: {
              product: true,
            },
          },
          suratJalan: true,
          invoice: true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'ORDER',
      description:
        `Mengubah pesanan ${updatedOrder.orderNumber}`,
      entityId: updatedOrder.id,
    });

    return updatedOrder;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const order =
      await this.findOne(id);

    if (order.suratJalan) {
      throw new BadRequestException(
        'Pesanan sudah memiliki Surat Jalan dan tidak dapat dihapus',
      );
    }

    if (order.invoice) {
      throw new BadRequestException(
        'Pesanan sudah memiliki Invoice dan tidak dapat dihapus',
      );
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException(
        'Hanya pesanan dengan status DRAFT yang dapat diarsipkan',
      );
    }

    await this.prisma.order.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });

    await this.activityLogService.create({
      userId: deletedById,
      action: 'DELETE',
      module: 'ORDER',
      description:
        `Memindahkan pesanan ${order.orderNumber} ke riwayat`,
      entityId: order.id,
    });

    return {
      message:
        'Pesanan berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
        include: {
          customer: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Pesanan tidak ditemukan di history',
      );
    }

    if (order.customer.deletedAt) {
      throw new BadRequestException(
        'Customer dari pesanan ini masih berada di history. Pulihkan customer terlebih dahulu',
      );
    }

    await this.prisma.order.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'RESTORE',
      module: 'ORDER',
      description:
        `Memulihkan pesanan ${order.orderNumber}`,
      entityId: order.id,
    });

    return {
      message:
        'Pesanan berhasil dipulihkan',
    };
  }
}