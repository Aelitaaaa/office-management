import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.purchase.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        supplier: true,
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
    return this.prisma.purchase.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      include: {
        supplier: true,
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
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const purchase =
      await this.prisma.purchase.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          supplier: true,
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
      });

    if (!purchase) {
      throw new NotFoundException(
        'Purchase tidak ditemukan',
      );
    }

    return purchase;
  }

  async create(
    data: CreatePurchaseDto,
    userId: number,
  ) {
    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id: data.supplierId,
          deletedAt: null,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier tidak ditemukan atau sudah diarsipkan',
      );
    }

    if (!supplier.isActive) {
      throw new BadRequestException(
        'Supplier tidak aktif',
      );
    }

    if (!data.details.length) {
      throw new BadRequestException(
        'Detail purchase tidak boleh kosong',
      );
    }

    const productIds = [
      ...new Set(
        data.details.map(
          (detail) => detail.productId,
        ),
      ),
    ];

    if (
      productIds.length !==
      data.details.length
    ) {
      throw new BadRequestException(
        'Produk yang sama tidak boleh dimasukkan lebih dari sekali',
      );
    }

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

    for (const product of products) {
      if (!product.isActive) {
        throw new BadRequestException(
          `Produk ${product.name} tidak aktif`,
        );
      }

      if (
        product.type !==
        'BAHAN_MENTAH'
      ) {
        throw new BadRequestException(
          `Produk ${product.name} bukan bahan mentah`,
        );
      }
    }

    const total = data.details.reduce(
      (sum, detail) =>
        sum +
        detail.quantity *
          detail.price,
      0,
    );

    const purchase =
      await this.prisma.$transaction(
        async (tx) => {
          const lastPurchase =
            await tx.purchase.findFirst({
              orderBy: {
                id: 'desc',
              },
            });

          const nextNumber =
            (lastPurchase?.id ?? 0) + 1;

          const purchaseNumber =
            `PUR${nextNumber
              .toString()
              .padStart(4, '0')}`;

          return tx.purchase.create({
            data: {
              purchaseNumber,
              supplierId:
                data.supplierId,
              userId,
              notes: data.notes,
              total,
              status: 'DRAFT',
              details: {
                create:
                  data.details.map(
                    (detail) => ({
                      productId:
                        detail.productId,
                      quantity:
                        detail.quantity,
                      price:
                        detail.price,
                      subtotal:
                        detail.quantity *
                        detail.price,
                    }),
                  ),
              },
            },
            include: {
              supplier: true,
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
          });
        },
      );

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'PURCHASE',
      description:
        `Membuat purchase ${purchase.purchaseNumber}`,
      entityId: purchase.id,
    });

    return purchase;
  }

  async update(
    id: number,
    data: UpdatePurchaseDto,
    userId: number,
  ) {
    const purchase =
      await this.findOne(id);

    if (data.status) {
      throw new BadRequestException(
        'Status Purchase harus diubah melalui endpoint status khusus',
      );
    }

    if (
      purchase.status === 'DITERIMA' ||
      purchase.status === 'SELESAI' ||
      purchase.status === 'DIBATALKAN'
    ) {
      throw new BadRequestException(
        'Purchase ini sudah tidak dapat diubah',
      );
    }

    const updatedPurchase =
      await this.prisma.purchase.update({
        where: {
          id,
        },
        data: {
          notes: data.notes,
        },
        include: {
          supplier: true,
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
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'PURCHASE',
      description:
        `Mengubah purchase ${updatedPurchase.purchaseNumber}`,
      entityId: updatedPurchase.id,
    });

    return updatedPurchase;
  }

  async order(
    id: number,
    userId: number,
  ) {
    const purchase =
      await this.findOne(id);

    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException(
        'Hanya Purchase berstatus DRAFT yang dapat dipesan',
      );
    }

    const updatedPurchase =
      await this.prisma.purchase.update({
        where: {
          id,
        },
        data: {
          status: 'DIPESAN',
        },
        include: {
          supplier: true,
          details: {
            include: {
              product: true,
            },
          },
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'ORDER',
      module: 'PURCHASE',
      description:
        `Memesan purchase ${updatedPurchase.purchaseNumber}`,
      entityId: updatedPurchase.id,
    });

    return updatedPurchase;
  }

  async receive(
    id: number,
    userId: number,
  ) {
    const purchase =
      await this.prisma.$transaction(
        async (tx) => {
          const existingPurchase =
            await tx.purchase.findFirst({
              where: {
                id,
                deletedAt: null,
              },
              include: {
                details: true,
              },
            });

          if (!existingPurchase) {
            throw new NotFoundException(
              'Purchase tidak ditemukan',
            );
          }

          if (
            existingPurchase.status !==
            'DIPESAN'
          ) {
            throw new BadRequestException(
              'Hanya Purchase berstatus DIPESAN yang dapat diterima',
            );
          }

          if (
            !existingPurchase.details
              .length
          ) {
            throw new BadRequestException(
              'Purchase tidak memiliki detail barang',
            );
          }

          for (
            const detail of
            existingPurchase.details
          ) {
            await tx.product.update({
              where: {
                id: detail.productId,
              },
              data: {
                stock: {
                  increment:
                    detail.quantity,
                },
              },
            });
          }

          return tx.purchase.update({
            where: {
              id,
            },
            data: {
              status: 'DITERIMA',
            },
            include: {
              supplier: true,
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
          });
        },
      );

    await this.activityLogService.create({
      userId,
      action: 'RECEIVE',
      module: 'PURCHASE',
      description:
        `Menerima barang purchase ${purchase.purchaseNumber}`,
      entityId: purchase.id,
    });

    return purchase;
  }

  async complete(
    id: number,
    userId: number,
  ) {
    const purchase =
      await this.findOne(id);

    if (
      purchase.status !== 'DITERIMA'
    ) {
      throw new BadRequestException(
        'Hanya Purchase berstatus DITERIMA yang dapat diselesaikan',
      );
    }

    const updatedPurchase =
      await this.prisma.purchase.update({
        where: {
          id,
        },
        data: {
          status: 'SELESAI',
        },
        include: {
          supplier: true,
          details: {
            include: {
              product: true,
            },
          },
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'COMPLETE',
      module: 'PURCHASE',
      description:
        `Menyelesaikan purchase ${updatedPurchase.purchaseNumber}`,
      entityId: updatedPurchase.id,
    });

    return updatedPurchase;
  }

  async cancel(
    id: number,
    userId: number,
  ) {
    const purchase =
      await this.findOne(id);

    if (
      purchase.status !== 'DRAFT' &&
      purchase.status !== 'DIPESAN'
    ) {
      throw new BadRequestException(
        'Purchase hanya dapat dibatalkan sebelum barang diterima',
      );
    }

    const updatedPurchase =
      await this.prisma.purchase.update({
        where: {
          id,
        },
        data: {
          status: 'DIBATALKAN',
        },
        include: {
          supplier: true,
          details: {
            include: {
              product: true,
            },
          },
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CANCEL',
      module: 'PURCHASE',
      description:
        `Membatalkan purchase ${updatedPurchase.purchaseNumber}`,
      entityId: updatedPurchase.id,
    });

    return updatedPurchase;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const purchase =
      await this.findOne(id);

    if (
      purchase.status !== 'DRAFT'
    ) {
      throw new BadRequestException(
        'Hanya Purchase berstatus DRAFT yang dapat diarsipkan',
      );
    }

    await this.prisma.purchase.update({
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
      module: 'PURCHASE',
      description:
        `Memindahkan purchase ${purchase.purchaseNumber} ke riwayat`,
      entityId: purchase.id,
    });

    return {
      message:
        'Purchase berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const purchase =
      await this.prisma.purchase.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Purchase tidak ditemukan di history',
      );
    }

    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id: purchase.supplierId,
          deletedAt: null,
        },
      });

    if (!supplier) {
      throw new BadRequestException(
        'Supplier dari Purchase masih berada di history. Pulihkan supplier terlebih dahulu',
      );
    }

    await this.prisma.purchase.update({
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
      module: 'PURCHASE',
      description:
        `Memulihkan purchase ${purchase.purchaseNumber}`,
      entityId: purchase.id,
    });

    return {
      message:
        'Purchase berhasil dipulihkan',
    };
  }
}