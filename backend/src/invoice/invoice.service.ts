import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.invoice.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            customer: true,
            suratJalan: true,
          },
        },
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
        payments: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findHistory() {
    return this.prisma.invoice.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      include: {
        order: {
          include: {
            customer: true,
            suratJalan: true,
          },
        },
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
        payments: true,
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          order: {
            include: {
              customer: true,
              suratJalan: true,
            },
          },
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
          payments: true,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice tidak ditemukan',
      );
    }

    return invoice;
  }

  async create(
    data: CreateInvoiceDto,
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
          suratJalan: {
            where: {
              deletedAt: null,
            },
          },
          invoice: {
            where: {
              deletedAt: null,
            },
          },
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Pesanan tidak ditemukan',
      );
    }

    if (order.invoice) {
      throw new ConflictException(
        'Pesanan ini sudah memiliki invoice',
      );
    }

    if (order.details.length === 0) {
      throw new BadRequestException(
        'Pesanan tidak memiliki detail barang',
      );
    }

    if (order.status === 'DIBATALKAN') {
      throw new BadRequestException(
        'Pesanan yang dibatalkan tidak dapat dibuatkan invoice',
      );
    }

    const subtotal =
      order.details.reduce(
        (sum, detail) =>
          sum +
          Number(detail.quantity) *
            Number(detail.price),
        0,
      );

    // Diskon = nominal Rupiah
    const diskon = data.diskon ?? 0;

    // Pajak = persentase
    // Contoh: 11 berarti 11%
    const pajak = data.pajak ?? 0;

    if (diskon < 0) {
      throw new BadRequestException(
        'Diskon tidak boleh bernilai negatif',
      );
    }

    if (pajak < 0 || pajak > 100) {
      throw new BadRequestException(
        'Pajak harus berada antara 0% sampai 100%',
      );
    }

    if (diskon > subtotal) {
      throw new BadRequestException(
        'Diskon tidak boleh lebih besar dari subtotal',
      );
    }

    const dasarPajak =
      subtotal - diskon;

    const nilaiPajak =
      dasarPajak * (pajak / 100);

    const total =
      dasarPajak + nilaiPajak;

    const invoice =
      await this.prisma.$transaction(
        async (tx) => {
          const lastInvoice =
            await tx.invoice.findFirst({
              orderBy: {
                id: 'desc',
              },
              select: {
                id: true,
              },
            });

          const nextNumber =
            (lastInvoice?.id ?? 0) + 1;

          const nomorInvoice =
            `INV${nextNumber
              .toString()
              .padStart(4, '0')}`;

          return tx.invoice.create({
            data: {
              nomorInvoice,
              orderId: order.id,
              userId,

              jatuhTempo:
                data.jatuhTempo
                  ? new Date(
                      data.jatuhTempo,
                    )
                  : null,

              subtotal,

              diskon,

              pajak,

              total,

              statusBayar:
                'BELUM_DIBAYAR',

              keterangan:
                data.keterangan,

              details: {
                create:
                  order.details.map(
                    (detail) => ({
                      productId:
                        detail.productId,

                      quantity:
                        detail.quantity,

                      price:
                        detail.price,

                      subtotal:
                        detail.subtotal,
                    }),
                  ),
              },
            },

            include: {
              order: {
                include: {
                  customer: true,
                  suratJalan: true,
                },
              },

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

              payments: true,
            },
          });
        },
      );

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'INVOICE',
      description:
        `Membuat invoice ${invoice.nomorInvoice}`,
      entityId: invoice.id,
    });

    return invoice;
  }

  async update(
    id: number,
    data: UpdateInvoiceDto,
    userId: number,
  ) {
    const invoice =
      await this.findOne(id);

    if (
      invoice.statusBayar === 'LUNAS'
    ) {
      throw new BadRequestException(
        'Invoice yang sudah lunas tidak dapat diubah',
      );
    }

    const subtotal =
      Number(invoice.subtotal);

    const diskon =
      data.diskon !== undefined
        ? data.diskon
        : Number(invoice.diskon);

    const pajak =
      data.pajak !== undefined
        ? data.pajak
        : Number(invoice.pajak);

    if (diskon < 0) {
      throw new BadRequestException(
        'Diskon tidak boleh bernilai negatif',
      );
    }

    if (pajak < 0 || pajak > 100) {
      throw new BadRequestException(
        'Pajak harus berada antara 0% sampai 100%',
      );
    }

    if (diskon > subtotal) {
      throw new BadRequestException(
        'Diskon tidak boleh lebih besar dari subtotal',
      );
    }

    const dasarPajak =
      subtotal - diskon;

    const nilaiPajak =
      dasarPajak * (pajak / 100);

    const total =
      dasarPajak + nilaiPajak;

    const totalDibayar =
      invoice.payments
        .filter(
          (payment) =>
            payment.status === 'PAID',
        )
        .reduce(
          (sum, payment) =>
            sum +
            Number(payment.jumlah),
          0,
        );

    if (total < totalDibayar) {
      throw new BadRequestException(
        'Total invoice tidak boleh lebih kecil dari pembayaran yang sudah diterima',
      );
    }

    let statusBayar:
      | 'BELUM_DIBAYAR'
      | 'SEBAGIAN'
      | 'LUNAS';

    if (totalDibayar <= 0) {
      statusBayar =
        'BELUM_DIBAYAR';
    } else if (
      totalDibayar >= total
    ) {
      statusBayar = 'LUNAS';
    } else {
      statusBayar = 'SEBAGIAN';
    }

    const updatedInvoice =
      await this.prisma.invoice.update({
        where: {
          id,
        },

        data: {
          jatuhTempo:
            data.jatuhTempo !== undefined
              ? new Date(
                  data.jatuhTempo,
                )
              : undefined,

          diskon,

          pajak,

          total,

          statusBayar,

          keterangan:
            data.keterangan,
        },

        include: {
          order: {
            include: {
              customer: true,
              suratJalan: true,
            },
          },

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

          payments: true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'INVOICE',
      description:
        `Mengubah invoice ${updatedInvoice.nomorInvoice}`,
      entityId: updatedInvoice.id,
    });

    return updatedInvoice;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const invoice =
      await this.findOne(id);

    if (
      invoice.payments.length > 0
    ) {
      throw new BadRequestException(
        'Invoice yang sudah memiliki pembayaran tidak dapat dihapus',
      );
    }

    if (
      invoice.statusBayar !==
      'BELUM_DIBAYAR'
    ) {
      throw new BadRequestException(
        'Hanya invoice yang belum dibayar yang dapat diarsipkan',
      );
    }

    await this.prisma.invoice.update({
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
      module: 'INVOICE',
      description:
        `Memindahkan invoice ${invoice.nomorInvoice} ke riwayat`,
      entityId: invoice.id,
    });

    return {
      message:
        'Invoice berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice tidak ditemukan di history',
      );
    }

    const existingInvoice =
      await this.prisma.invoice.findFirst({
        where: {
          orderId:
            invoice.orderId,

          deletedAt: null,

          NOT: {
            id,
          },
        },
      });

    if (existingInvoice) {
      throw new ConflictException(
        'Pesanan sudah memiliki Invoice aktif',
      );
    }

    await this.prisma.invoice.update({
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
      module: 'INVOICE',
      description:
        `Memulihkan invoice ${invoice.nomorInvoice}`,
      entityId: invoice.id,
    });

    return {
      message:
        'Invoice berhasil dipulihkan',
    };
  }
}