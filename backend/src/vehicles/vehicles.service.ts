import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.vehicle.findMany({
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
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Kendaraan tidak ditemukan',
      );
    }

    return vehicle;
  }

  async create(
    data: CreateVehicleDto,
    userId: number,
  ) {
    const existingVehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          nomorPolisi: data.nomorPolisi,
          deletedAt: null,
        },
      });

    if (existingVehicle) {
      throw new ConflictException(
        'Nomor polisi sudah digunakan',
      );
    }

    const vehicle =
      await this.prisma.vehicle.create({
        data: {
          nomorPolisi: data.nomorPolisi,
          jenis: data.jenis,
          merek: data.merek,
          model: data.model,
          warna: data.warna,
          tahun: data.tahun,
          aktif: data.aktif ?? true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'VEHICLE',
      description:
        `Menambahkan kendaraan ${vehicle.nomorPolisi}`,
      entityId: vehicle.id,
    });

    return vehicle;
  }

  async update(
    id: number,
    data: UpdateVehicleDto,
    userId: number,
  ) {
    await this.findOne(id);

    if (data.nomorPolisi) {
      const existingVehicle =
        await this.prisma.vehicle.findFirst({
          where: {
            nomorPolisi:
              data.nomorPolisi,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingVehicle) {
        throw new ConflictException(
          'Nomor polisi sudah digunakan',
        );
      }
    }

    const vehicle =
      await this.prisma.vehicle.update({
        where: {
          id,
        },
        data: {
          nomorPolisi:
            data.nomorPolisi,
          jenis: data.jenis,
          merek: data.merek,
          model: data.model,
          warna: data.warna,
          tahun: data.tahun,
          aktif: data.aktif,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'VEHICLE',
      description:
        `Mengubah data kendaraan ${vehicle.nomorPolisi}`,
      entityId: vehicle.id,
    });

    return vehicle;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const vehicle =
      await this.findOne(id);

    const activeSuratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          vehicleId: id,
          deletedAt: null,
          order: {
            status: {
              notIn: [
                'SELESAI',
                'SELESAI_DIKIRIM',
                'DIBATALKAN',
              ],
            },
          },
        },
        select: {
          id: true,
          nomorSurat: true,
          order: {
            select: {
              orderNumber: true,
              status: true,
            },
          },
        },
      });

    if (activeSuratJalan) {
      throw new ConflictException(
        `Kendaraan masih digunakan pada Surat Jalan ${activeSuratJalan.nomorSurat} dengan status pesanan ${activeSuratJalan.order.status}`,
      );
    }

    await this.prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedById,
        aktif: false,
      },
    });

    await this.activityLogService.create({
      userId: deletedById,
      action: 'DELETE',
      module: 'VEHICLE',
      description:
        `Memindahkan kendaraan ${vehicle.nomorPolisi} ke riwayat`,
      entityId: vehicle.id,
    });

    return {
      message:
        'Kendaraan berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Kendaraan tidak ditemukan di history',
      );
    }

    const existingVehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          nomorPolisi:
            vehicle.nomorPolisi,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

    if (existingVehicle) {
      throw new ConflictException(
        'Kendaraan tidak dapat dipulihkan karena nomor polisi sudah digunakan kendaraan lain',
      );
    }

    await this.prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
        deletedById: null,
        aktif: true,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'RESTORE',
      module: 'VEHICLE',
      description:
        `Memulihkan kendaraan ${vehicle.nomorPolisi}`,
      entityId: vehicle.id,
    });

    return {
      message:
        'Kendaraan berhasil dipulihkan',
    };
  }

  async permanentDelete(
    id: number,
    userId: number,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Kendaraan tidak ditemukan di history',
      );
    }

    const activeSuratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          vehicleId: id,
          deletedAt: null,
          order: {
            status: {
              notIn: [
                'SELESAI',
                'SELESAI_DIKIRIM',
                'DIBATALKAN',
              ],
            },
          },
        },
        select: {
          id: true,
          nomorSurat: true,
          order: {
            select: {
              orderNumber: true,
              status: true,
            },
          },
        },
      });

    if (activeSuratJalan) {
      throw new ConflictException(
        `Kendaraan tidak dapat dihapus permanen karena masih digunakan pada Surat Jalan ${activeSuratJalan.nomorSurat} dengan status pesanan ${activeSuratJalan.order.status}`,
      );
    }

    const nomorPolisi =
      vehicle.nomorPolisi;

    await this.prisma.vehicle.delete({
      where: {
        id,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'PERMANENT_DELETE',
      module: 'VEHICLE',
      description:
        `Menghapus permanen kendaraan ${nomorPolisi}`,
      entityId: id,
    });

    return {
      message:
        'Kendaraan berhasil dihapus permanen',
    };
  }
}