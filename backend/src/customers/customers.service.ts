import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer tidak ditemukan');
    }

    return customer;
  }

  async create(data: CreateCustomerDto) {
    if (data.email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          email: data.email,
        },
      });

      if (existingCustomer) {
        throw new ConflictException('Email customer sudah digunakan');
      }
    }

    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: {
        id: 'desc',
      },
    });

    const nextNumber = lastCustomer ? lastCustomer.id + 1 : 1;
    const code = `CUS${String(nextNumber).padStart(4, '0')}`;

    return this.prisma.customer.create({
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

  async update(id: number, data: UpdateCustomerDto) {
    await this.findOne(id);

    if (data.email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          email: data.email,
          NOT: {
            id,
          },
        },
      });

      if (existingCustomer) {
        throw new ConflictException('Email customer sudah digunakan');
      }
    }

    return this.prisma.customer.update({
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

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      message: 'Customer berhasil dihapus',
    };
  }
}