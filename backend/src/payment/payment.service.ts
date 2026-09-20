import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const payment =
      await this.prisma.payment.findUnique({
        where: {
          id,
        },
        include: {
          invoice: {
            include: {
              order: {
                include: {
                  customer: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Pembayaran tidak ditemukan',
      );
    }

    return payment;
  }

  async createManual(
    data: CreatePaymentDto,
    userId: number,
  ) {
    if (
      data.metode === 'VIRTUAL_ACCOUNT' ||
      data.metode === 'QRIS' ||
      data.metode === 'EWALLET'
    ) {
      throw new BadRequestException(
        'Metode ini harus diproses melalui payment gateway',
      );
    }

    if (data.jumlah <= 0) {
      throw new BadRequestException(
        'Jumlah pembayaran harus lebih besar dari 0',
      );
    }

    try {
      const result =
        await this.prisma.$transaction(
          async (tx) => {
            const invoice =
              await tx.invoice.findUnique({
                where: {
                  id: data.invoiceId,
                },
                include: {
                  payments: {
                    where: {
                      status: 'PAID',
                    },
                  },
                  order: {
                    include: {
                      suratJalan: true,
                    },
                  },
                },
              });

            if (!invoice) {
              throw new NotFoundException(
                'Invoice tidak ditemukan',
              );
            }

            if (invoice.deletedAt) {
              throw new BadRequestException(
                'Invoice sudah berada di riwayat dan tidak dapat menerima pembayaran',
              );
            }

            if (
              invoice.order.status ===
              'DIBATALKAN'
            ) {
              throw new BadRequestException(
                'Invoice dari pesanan yang dibatalkan tidak dapat menerima pembayaran',
              );
            }

            const totalInvoice =
              Number(invoice.total);

            const totalDibayar =
              invoice.payments.reduce(
                (sum, payment) =>
                  sum +
                  Number(
                    payment.jumlah,
                  ),
                0,
              );

            const sisaTagihan =
              Math.max(
                totalInvoice -
                  totalDibayar,
                0,
              );

            if (
              invoice.statusBayar ===
                'LUNAS' ||
              sisaTagihan <= 0
            ) {
              throw new BadRequestException(
                'Invoice sudah lunas',
              );
            }

            if (
              data.jumlah >
              sisaTagihan
            ) {
              throw new BadRequestException(
                `Pembayaran melebihi sisa tagihan. Sisa tagihan: ${sisaTagihan}`,
              );
            }

            const payment =
              await tx.payment.create({
                data: {
                  invoiceId:
                    data.invoiceId,
                  userId,
                  jumlah:
                    data.jumlah,
                  metode:
                    data.metode,
                  status: 'PAID',
                  tanggalBayar:
                    new Date(),
                  keterangan:
                    data.keterangan,
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

            const totalSetelahBayar =
              totalDibayar +
              data.jumlah;

            const sisaSetelahBayar =
              Math.max(
                totalInvoice -
                  totalSetelahBayar,
                0,
              );

            const lunas =
              sisaSetelahBayar <= 0;

            const statusBayar:
              | 'LUNAS'
              | 'SEBAGIAN' =
              lunas
                ? 'LUNAS'
                : 'SEBAGIAN';

            const waktuSelesai =
              new Date();

            await tx.invoice.update({
              where: {
                id: invoice.id,
              },
              data: {
                statusBayar,
                deletedAt:
                  lunas
                    ? waktuSelesai
                    : null,
                deletedById:
                  lunas
                    ? userId
                    : null,
              },
            });

            if (lunas) {
              await tx.order.update({
                where: {
                  id:
                    invoice.orderId,
                },
                data: {
                  status: 'SELESAI',
                },
              });

              await tx.suratJalan.updateMany({
                where: {
                  orderId:
                    invoice.orderId,
                  deletedAt: null,
                },
                data: {
                  deletedAt:
                    waktuSelesai,
                  deletedById:
                    userId,
                },
              });
            }

            return {
              message: lunas
                ? 'Pembayaran berhasil. Invoice telah lunas, pesanan selesai, dan Invoice serta Surat Jalan otomatis dipindahkan ke riwayat.'
                : 'Pembayaran berhasil dicatat.',

              payment,

              invoice: {
                id:
                  invoice.id,
                nomorInvoice:
                  invoice.nomorInvoice,
                total:
                  totalInvoice,
                totalDibayar:
                  totalSetelahBayar,
                sisaTagihan:
                  sisaSetelahBayar,
                statusBayar,
                masukRiwayat:
                  lunas,
              },

              order: {
                id:
                  invoice.orderId,
                status:
                  lunas
                    ? 'SELESAI'
                    : invoice.order
                        .status,
              },

              suratJalan: {
                masukRiwayat:
                  lunas &&
                  Boolean(
                    invoice.order
                      .suratJalan,
                  ),
              },
            };
          },
          {
            isolationLevel:
              'Serializable',
            maxWait: 5000,
            timeout: 10000,
          },
        );

      await this.activityLogService.create({
        userId,
        action: 'PAYMENT',
        module: 'PAYMENT',
        description:
          `Mencatat pembayaran untuk invoice ${result.invoice.nomorInvoice}`,
        entityId:
          result.payment.id,
      });

      return result;
    } catch (error: unknown) {
      if (
        error instanceof
          BadRequestException ||
        error instanceof
          NotFoundException ||
        error instanceof
          ConflictException
      ) {
        throw error;
      }

      if (
        typeof error ===
          'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Pembayaran sedang diproses oleh transaksi lain. Silakan coba kembali.',
        );
      }

      throw error;
    }
  }
}