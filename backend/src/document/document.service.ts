import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  existsSync,
  unlinkSync,
} from 'fs';
import { join } from 'path';

import { ActivityLogService } from '../activity-log/activity-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.document.findMany({
      where: {
        deletedAt: null,
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
      orderBy: {
        tanggal: 'desc',
      },
    });
  }

  async findHistory() {
    return this.prisma.document.findMany({
      where: {
        deletedAt: {
          not: null,
        },
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
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id,
          deletedAt: null,
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

    if (!document) {
      throw new NotFoundException(
        'Dokumen tidak ditemukan',
      );
    }

    return document;
  }

  async create(
    data: CreateDocumentDto,
    userId: number,
  ) {
    if (data.nomorDokumen) {
      const existingDocument =
        await this.prisma.document.findFirst({
          where: {
            nomorDokumen:
              data.nomorDokumen,
            deletedAt: null,
          },
        });

      if (existingDocument) {
        throw new BadRequestException(
          'Nomor dokumen sudah terdaftar',
        );
      }
    }

    const document =
      await this.prisma.document.create({
        data: {
          nomorDokumen:
            data.nomorDokumen,
          nama: data.nama,
          kategori: data.kategori,
          tanggal:
            data.tanggal
              ? new Date(
                  data.tanggal,
                )
              : new Date(),
          status:
            data.status ?? 'DRAFT',
          keterangan:
            data.keterangan,
          userId,
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

    await this.activityLogService.create({
      userId,
      action: 'CREATE',
      module: 'DOCUMENT',
      description:
        `Menambahkan dokumen ${document.nama}`,
      entityId: document.id,
    });

    return document;
  }

  async update(
    id: number,
    data: UpdateDocumentDto,
    userId: number,
  ) {
    const document =
      await this.findOne(id);

    if (
      data.nomorDokumen &&
      data.nomorDokumen !==
        document.nomorDokumen
    ) {
      const existingDocument =
        await this.prisma.document.findFirst({
          where: {
            nomorDokumen:
              data.nomorDokumen,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingDocument) {
        throw new BadRequestException(
          'Nomor dokumen sudah terdaftar',
        );
      }
    }

    const updatedDocument =
      await this.prisma.document.update({
        where: {
          id,
        },
        data: {
          nomorDokumen:
            data.nomorDokumen,
          nama:
            data.nama,
          kategori:
            data.kategori,
          tanggal:
            data.tanggal
              ? new Date(
                  data.tanggal,
                )
              : undefined,
          status:
            data.status,
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

    await this.activityLogService.create({
      userId,
      action: 'UPDATE',
      module: 'DOCUMENT',
      description:
        `Mengubah dokumen ${updatedDocument.nama}`,
      entityId: updatedDocument.id,
    });

    return updatedDocument;
  }

  async updateFile(
    id: number,
    filePath: string,
    userId: number,
  ) {
    const document =
      await this.findOne(id);

    const oldFilePath =
      document.filePath;

    const updatedDocument =
      await this.prisma.document.update({
        where: {
          id,
        },
        data: {
          filePath,
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

    if (
      oldFilePath &&
      oldFilePath !== filePath
    ) {
      this.deletePhysicalFile(
        oldFilePath,
      );
    }

    await this.activityLogService.create({
      userId,
      action: 'UPLOAD_FILE',
      module: 'DOCUMENT',
      description:
        `Mengunggah file dokumen ${updatedDocument.nama}`,
      entityId: updatedDocument.id,
    });

    return updatedDocument;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const document =
      await this.findOne(id);

    await this.prisma.document.update({
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
      module: 'DOCUMENT',
      description:
        `Memindahkan dokumen ${document.nama} ke riwayat`,
      entityId: document.id,
    });

    return {
      message:
        'Dokumen berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Dokumen tidak ditemukan di history',
      );
    }

    if (document.nomorDokumen) {
      const existingDocument =
        await this.prisma.document.findFirst({
          where: {
            nomorDokumen:
              document.nomorDokumen,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingDocument) {
        throw new BadRequestException(
          'Nomor dokumen sudah digunakan oleh dokumen aktif',
        );
      }
    }

    await this.prisma.document.update({
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
      module: 'DOCUMENT',
      description:
        `Memulihkan dokumen ${document.nama}`,
      entityId: document.id,
    });

    return {
      message:
        'Dokumen berhasil dipulihkan',
    };
  }

  async permanentDelete(
    id: number,
    userId: number,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Dokumen tidak ditemukan di history',
      );
    }

    const filePath =
      document.filePath;

    const documentName =
      document.nama;

    await this.prisma.document.delete({
      where: {
        id,
      },
    });

    if (filePath) {
      this.deletePhysicalFile(
        filePath,
      );
    }

    await this.activityLogService.create({
      userId,
      action: 'PERMANENT_DELETE',
      module: 'DOCUMENT',
      description:
        `Menghapus permanen dokumen ${documentName}`,
      entityId: id,
    });

    return {
      message:
        'Dokumen berhasil dihapus permanen',
    };
  }

  private deletePhysicalFile(
    filePath: string,
  ) {
    const normalizedPath =
      filePath.replace(/\\/g, '/');

    if (
      !normalizedPath.startsWith(
        'uploads/',
      )
    ) {
      return;
    }

    const absolutePath = join(
      process.cwd(),
      normalizedPath,
    );

    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }
}