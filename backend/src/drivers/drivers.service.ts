import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.driver.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver tidak ditemukan');
    }

    return driver;
  }

  async create(data: CreateDriverDto) {
    if (data.licenseNo) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: {
          licenseNo: data.licenseNo,
        },
      });

      if (existingDriver) {
        throw new ConflictException(
          'Nomor SIM driver sudah digunakan',
        );
      }
    }

    return this.prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        licenseNo: data.licenseNo,
        address: data.address,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateDriverDto) {
    await this.findOne(id);

    if (data.licenseNo) {
      const existingDriver = await this.prisma.driver.findFirst({
        where: {
          licenseNo: data.licenseNo,
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

    return this.prisma.driver.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        licenseNo: data.licenseNo,
        address: data.address,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.driver.delete({
      where: { id },
    });

    return {
      message: 'Driver berhasil dihapus',
    };
  }
}