import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Kendaraan tidak ditemukan');
    }

    return vehicle;
  }

  async create(data: CreateVehicleDto) {
    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        plateNumber: data.plateNumber,
      },
    });

    if (existingVehicle) {
      throw new ConflictException(
        'Nomor kendaraan sudah digunakan',
      );
    }

    return this.prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        type: data.type,
        brand: data.brand,
        model: data.model,
        color: data.color,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateVehicleDto) {
    await this.findOne(id);

    if (data.plateNumber) {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          plateNumber: data.plateNumber,
          NOT: {
            id,
          },
        },
      });

      if (existingVehicle) {
        throw new ConflictException(
          'Nomor kendaraan sudah digunakan',
        );
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber,
        type: data.type,
        brand: data.brand,
        model: data.model,
        color: data.color,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return {
      message: 'Kendaraan berhasil dihapus',
    };
  }
}