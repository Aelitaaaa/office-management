import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier tidak ditemukan');
    }

    return supplier;
  }

  async create(data: CreateSupplierDto) {
    if (data.email) {
      const existingSupplier = await this.prisma.supplier.findFirst({
        where: {
          email: data.email,
        },
      });

      if (existingSupplier) {
        throw new ConflictException('Email supplier sudah digunakan');
      }
    }

    const lastSupplier = await this.prisma.supplier.findFirst({
      orderBy: {
        id: 'desc',
      },
    });

    const nextNumber = lastSupplier ? lastSupplier.id + 1 : 1;
    const code = `SUP${String(nextNumber).padStart(4, '0')}`;

    return this.prisma.supplier.create({
      data: {
        code,
        name: data.name,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        contactName: data.contactName,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateSupplierDto) {
    await this.findOne(id);

    if (data.email) {
      const existingSupplier = await this.prisma.supplier.findFirst({
        where: {
          email: data.email,
          NOT: {
            id,
          },
        },
      });

      if (existingSupplier) {
        throw new ConflictException('Email supplier sudah digunakan');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        contactName: data.contactName,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.supplier.delete({
      where: { id },
    });

    return {
      message: 'Supplier berhasil dihapus',
    };
  }
}