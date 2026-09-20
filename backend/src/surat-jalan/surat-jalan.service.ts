import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateSuratJalanDto } from './dto/create-surat-jalan.dto';
import { UpdateSuratJalanDto } from './dto/update-surat-jalan.dto';

@Injectable()
export class SuratJalanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.suratJalan.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        driver: true,
        vehicle: true,
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
    return this.prisma.suratJalan.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        driver: true,
        vehicle: true,
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
    const suratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          driver: true,
          vehicle: true,
          details: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!suratJalan) {
      throw new NotFoundException(
        'Surat jalan tidak ditemukan',
      );
    }

    return suratJalan;
  }

  async create(
    data: CreateSuratJalanDto,
    userId: number,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: data.orderId,
          deletedAt: null,
        },
        include: {
          customer: true,
          details: {
            include: {
              product: true,
            },
          },
          suratJalan: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Pesanan tidak ditemukan',
      );
    }

    if (order.suratJalan) {
      throw new ConflictException(
        'Pesanan ini sudah memiliki surat jalan',
      );
    }

    if (order.details.length === 0) {
      throw new BadRequestException(
        'Pesanan tidak memiliki detail barang',
      );
    }

    if (order.status === 'DIBATALKAN') {
      throw new BadRequestException(
        'Pesanan yang dibatalkan tidak dapat dibuatkan surat jalan',
      );
    }

    if (order.status === 'SELESAI') {
      throw new BadRequestException(
        'Pesanan yang sudah selesai tidak dapat dibuatkan surat jalan',
      );
    }

    if (data.driverId) {
      const driver =
        await this.prisma.driver.findFirst({
          where: {
            id: data.driverId,
            deletedAt: null,
          },
        });

      if (!driver) {
        throw new NotFoundException(
          'Driver tidak ditemukan',
        );
      }

      if (!driver.isActive) {
        throw new BadRequestException(
          'Driver tidak aktif',
        );
      }
    }

    if (data.vehicleId) {
      const vehicle =
        await this.prisma.vehicle.findFirst({
          where: {
            id: data.vehicleId,
            deletedAt: null,
          },
        });

      if (!vehicle) {
        throw new NotFoundException(
          'Kendaraan tidak ditemukan',
        );
      }

      if (!vehicle.aktif) {
        throw new BadRequestException(
          'Kendaraan tidak aktif',
        );
      }
    }

    const suratJalan =
      await this.prisma.$transaction(
        async (tx) => {
          const lastSuratJalan =
            await tx.suratJalan.findFirst({
              orderBy: {
                id: 'desc',
              },
              select: {
                id: true,
              },
            });

          const nextNumber =
            (lastSuratJalan?.id ?? 0) + 1;

          const nomorSurat =
            `SJ${nextNumber
              .toString()
              .padStart(4, '0')}`;

          await tx.order.update({
            where: {
              id: order.id,
            },
            data: {
              status: 'DIKIRIM',
            },
          });

          return tx.suratJalan.create({
            data: {
              nomorSurat,
              orderId: order.id,
              userId,
              driverId:
                data.driverId,
              vehicleId:
                data.vehicleId,
              referensiPO:
                data.referensiPO,
              tujuan:
                data.tujuan ??
                order.customer.name,
              alamat:
                data.alamat ??
                order.customer.address,
              penerima:
                data.penerima,
              catatan:
                data.catatan,
              details: {
                create:
                  order.details.map(
                    (detail) => ({
                      productId:
                        detail.productId,
                      quantity:
                        detail.quantity,
                    }),
                  ),
              },
            },
            include: {
              order: {
                include: {
                  customer: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
              driver: true,
              vehicle: true,
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
      module: 'SURAT_JALAN',
      description:
        `Membuat Surat Jalan ${suratJalan.nomorSurat}`,
      entityId: suratJalan.id,
    });

    return suratJalan;
  }

  async update(
    id: number,
    data: UpdateSuratJalanDto,
    userId: number,
  ) {
    const suratJalan =
      await this.findOne(id);

    if (
      suratJalan.order.status ===
      'SELESAI'
    ) {
      throw new BadRequestException(
        'Surat jalan dari pesanan yang sudah selesai tidak dapat diubah',
      );
    }

    if (data.driverId) {
      const driver =
        await this.prisma.driver.findFirst({
          where: {
            id: data.driverId,
            deletedAt: null,
          },
        });

      if (!driver) {
        throw new NotFoundException(
          'Driver tidak ditemukan',
        );
      }

      if (!driver.isActive) {
        throw new BadRequestException(
          'Driver tidak aktif',
        );
      }
    }

    if (data.vehicleId) {
      const vehicle =
        await this.prisma.vehicle.findFirst({
          where: {
            id: data.vehicleId,
            deletedAt: null,
          },
        });

      if (!vehicle) {
        throw new NotFoundException(
          'Kendaraan tidak ditemukan',
        );
      }

      if (!vehicle.aktif) {
        throw new BadRequestException(
          'Kendaraan tidak aktif',
        );
      }
    }

    const updated =
      await this.prisma.suratJalan.update({
        where: {
          id,
        },
        data: {
          driverId:
            data.driverId,
          vehicleId:
            data.vehicleId,
          referensiPO:
            data.referensiPO,
          tujuan:
            data.tujuan,
          alamat:
            data.alamat,
          penerima:
            data.penerima,
          catatan:
            data.catatan,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          driver: true,
          vehicle: true,
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
      module: 'SURAT_JALAN',
      description:
        `Mengubah Surat Jalan ${updated.nomorSurat}`,
      entityId: updated.id,
    });

    return updated;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const suratJalan =
      await this.findOne(id);

    if (
      suratJalan.order.status ===
      'SELESAI'
    ) {
      throw new BadRequestException(
        'Surat jalan dari pesanan yang sudah selesai tidak dapat dihapus manual',
      );
    }

    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          orderId:
            suratJalan.orderId,
          deletedAt: null,
        },
      });

    if (invoice) {
      throw new BadRequestException(
        'Surat jalan tidak dapat dihapus karena pesanan sudah memiliki Invoice',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.suratJalan.update({
          where: {
            id,
          },
          data: {
            deletedAt:
              new Date(),
            deletedById,
          },
        });

        await tx.order.update({
          where: {
            id:
              suratJalan.orderId,
          },
          data: {
            status:
              'DIPROSES',
          },
        });
      },
    );

    await this.activityLogService.create({
      userId: deletedById,
      action: 'DELETE',
      module: 'SURAT_JALAN',
      description:
        `Memindahkan Surat Jalan ${suratJalan.nomorSurat} ke riwayat`,
      entityId: suratJalan.id,
    });

    return {
      message:
        'Surat jalan berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const suratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
        include: {
          order: true,
        },
      });

    if (!suratJalan) {
      throw new NotFoundException(
        'Surat jalan tidak ditemukan di history',
      );
    }

    if (
      suratJalan.order.status ===
      'SELESAI'
    ) {
      throw new BadRequestException(
        'Surat jalan tidak dapat dipulihkan karena pesanan sudah selesai',
      );
    }

    if (
      suratJalan.order.status ===
      'DIBATALKAN'
    ) {
      throw new BadRequestException(
        'Surat jalan tidak dapat dipulihkan karena pesanan sudah dibatalkan',
      );
    }

    const existingActive =
      await this.prisma.suratJalan.findFirst({
        where: {
          orderId:
            suratJalan.orderId,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

    if (existingActive) {
      throw new ConflictException(
        'Pesanan sudah memiliki Surat Jalan aktif',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.suratJalan.update({
          where: {
            id,
          },
          data: {
            deletedAt: null,
            deletedById: null,
          },
        });

        await tx.order.update({
          where: {
            id:
              suratJalan.orderId,
          },
          data: {
            status:
              'DIKIRIM',
          },
        });
      },
    );

    await this.activityLogService.create({
      userId,
      action: 'RESTORE',
      module: 'SURAT_JALAN',
      description:
        `Memulihkan Surat Jalan ${suratJalan.nomorSurat}`,
      entityId: suratJalan.id,
    });

    return {
      message:
        'Surat jalan berhasil dipulihkan',
    };
  }

  async permanentDelete(
    id: number,
    userId: number,
  ) {
    const suratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
        include: {
          order: {
            include: {
              invoice: true,
            },
          },
        },
      });

    if (!suratJalan) {
      throw new NotFoundException(
        'Surat jalan tidak ditemukan di history',
      );
    }

    if (
      suratJalan.order.status ===
      'SELESAI'
    ) {
      throw new ConflictException(
        'Surat jalan dari pesanan yang sudah selesai tidak dapat dihapus permanen karena merupakan riwayat transaksi',
      );
    }

    if (
      suratJalan.order.invoice
    ) {
      throw new ConflictException(
        'Surat jalan tidak dapat dihapus permanen karena pesanan memiliki riwayat Invoice',
      );
    }

    const nomorSurat =
      suratJalan.nomorSurat;

    await this.prisma.suratJalan.delete({
      where: {
        id,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'PERMANENT_DELETE',
      module: 'SURAT_JALAN',
      description:
        `Menghapus permanen Surat Jalan ${nomorSurat}`,
      entityId: id,
    });

    return {
      message:
        'Surat jalan berhasil dihapus permanen',
    };
  }
}