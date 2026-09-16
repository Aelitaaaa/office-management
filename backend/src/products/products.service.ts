import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product tidak ditemukan');
    }

    return product;
  }

  async create(data: CreateProductDto) {
    const lastProduct = await this.prisma.product.findFirst({
      orderBy: {
        id: 'desc',
      },
    });

    const nextNumber = lastProduct ? lastProduct.id + 1 : 1;
    const code = `PRD${String(nextNumber).padStart(4, '0')}`;

    const existingProduct = await this.prisma.product.findUnique({
      where: {
        code,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Kode product sudah digunakan');
    }

    return this.prisma.product.create({
      data: {
        code,
        name: data.name,
        type: data.type,
        unit: data.unit,
        stock: data.stock ?? 0,
        minimumStock: data.minimumStock ?? 0,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: number, data: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        unit: data.unit,
        stock: data.stock,
        minimumStock: data.minimumStock,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Product berhasil dihapus',
    };
  }
}