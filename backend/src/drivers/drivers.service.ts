import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.driver.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findHistory() {
    return this.prisma.driver.findMany({
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
    const driver =
      await this.prisma.driver.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

    if (!driver) {
      throw new NotFoundException(
        'Driver tidak ditemukan',
      );
    }

    return driver;
  }

  async create(
    data: CreateDriverDto,
    userId: number,
  ) {
    if (data.licenseNo) {
      const existingDriver =
        await this.prisma.driver.findFirst({
          where: {
            licenseNo: data.licenseNo,
            deletedAt: null,
          },
        });

      if (existingDriver) {
        throw new ConflictException(
          'Nomor SIM driver sudah digunakan',
        );
      }
    }

    const driver =
      await this.prisma.driver.create({
        data: {
          name: data.name,
          phone: data.phone,
          licenseNo: data.licenseNo,
          address: data.address,
          isActive:
            data.isActive ?? true,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'DRIVER',
      description:
        `Menambahkan driver ${driver.name}`,
      entityId: driver.id,
    });

    return driver;
  }

  async update(
    id: number,
    data: UpdateDriverDto,
    userId: number,
  ) {
    await this.findOne(id);

    if (data.licenseNo) {
      const existingDriver =
        await this.prisma.driver.findFirst({
          where: {
            licenseNo:
              data.licenseNo,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingDriver) {
        throw new ConflictException(
          'Nomor SIM driver sudah digunakan',
        );
      }
    }

    const driver =
      await this.prisma.driver.update({
        where: {
          id,
        },
        data: {
          name: data.name,
          phone: data.phone,
          licenseNo:
            data.licenseNo,
          address: data.address,
          isActive:
            data.isActive,
        },
      });

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'DRIVER',
      description:
        `Mengubah data driver ${driver.name}`,
      entityId: driver.id,
    });

    return driver;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const driver =
      await this.findOne(id);

    const activeSuratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          driverId: id,
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
        `Driver masih digunakan pada Surat Jalan ${activeSuratJalan.nomorSurat} dengan status pesanan ${activeSuratJalan.order.status}`,
      );
    }

    await this.prisma.driver.update({
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
      module: 'DRIVER',
      description:
        `Memindahkan driver ${driver.name} ke riwayat`,
      entityId: driver.id,
    });

    return {
      message:
        'Driver berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const driver =
      await this.prisma.driver.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!driver) {
      throw new NotFoundException(
        'Driver tidak ditemukan di history',
      );
    }

    if (driver.licenseNo) {
      const existingDriver =
        await this.prisma.driver.findFirst({
          where: {
            licenseNo:
              driver.licenseNo,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingDriver) {
        throw new ConflictException(
          'Driver tidak dapat dipulihkan karena nomor SIM sudah digunakan driver lain',
        );
      }
    }

    await this.prisma.driver.update({
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
      module: 'DRIVER',
      description:
        `Memulihkan driver ${driver.name}`,
      entityId: driver.id,
    });

    return {
      message:
        'Driver berhasil dipulihkan',
    };
  }

  async permanentDelete(
    id: number,
    userId: number,
  ) {
    const driver =
      await this.prisma.driver.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!driver) {
      throw new NotFoundException(
        'Driver tidak ditemukan di history',
      );
    }

    const activeSuratJalan =
      await this.prisma.suratJalan.findFirst({
        where: {
          driverId: id,
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
        `Driver tidak dapat dihapus permanen karena masih digunakan pada Surat Jalan ${activeSuratJalan.nomorSurat} dengan status pesanan ${activeSuratJalan.order.status}`,
      );
    }

    const driverName =
      driver.name;

    await this.prisma.driver.delete({
      where: {
        id,
      },
    });

    await this.activityLogService.create({
      userId,
      action: 'PERMANENT_DELETE',
      module: 'DRIVER',
      description:
        `Menghapus permanen driver ${driverName}`,
      entityId: id,
    });

    return {
      message:
        'Driver berhasil dihapus permanen',
    };
  }
}