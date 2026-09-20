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

import { CreateOutgoingLetterDto } from './dto/create-outgoing-letter.dto';
import { UpdateOutgoingLetterDto } from './dto/update-outgoing-letter.dto';

@Injectable()
export class OutgoingLetterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.outgoingLetter.findMany({
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
        tanggalSurat: 'desc',
      },
    });
  }

  async findHistory() {
    return this.prisma.outgoingLetter.findMany({
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
    const letter =
      await this.prisma.outgoingLetter.findFirst({
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

    if (!letter) {
      throw new NotFoundException(
        'Surat keluar tidak ditemukan',
      );
    }

    return letter;
  }

  async create(
    data: CreateOutgoingLetterDto,
    userId: number,
  ) {
    const existingLetter =
      await this.prisma.outgoingLetter.findFirst({
        where: {
          nomorSurat: data.nomorSurat,
          deletedAt: null,
        },
      });

    if (existingLetter) {
      throw new BadRequestException(
        'Nomor surat sudah terdaftar',
      );
    }

    const letter =
      await this.prisma.outgoingLetter.create({
        data: {
          nomorSurat: data.nomorSurat,
          tanggalSurat:
            data.tanggalSurat
              ? new Date(
                  data.tanggalSurat,
                )
              : new Date(),
          penerima: data.penerima,
          perihal: data.perihal,
          jenis:
            data.jenis ?? 'BIASA',
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
      module: 'OUTGOING_LETTER',
      description:
        `Menambahkan surat keluar ${letter.nomorSurat} untuk ${letter.penerima}`,
      entityId: letter.id,
    });

    return letter;
  }

  async update(
    id: number,
    data: UpdateOutgoingLetterDto,
    userId: number,
  ) {
    const letter =
      await this.findOne(id);

    if (
      data.nomorSurat &&
      data.nomorSurat !==
        letter.nomorSurat
    ) {
      const existingLetter =
        await this.prisma.outgoingLetter.findFirst({
          where: {
            nomorSurat:
              data.nomorSurat,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingLetter) {
        throw new BadRequestException(
          'Nomor surat sudah terdaftar',
        );
      }
    }

    const updatedLetter =
      await this.prisma.outgoingLetter.update({
        where: {
          id,
        },
        data: {
          nomorSurat:
            data.nomorSurat,
          tanggalSurat:
            data.tanggalSurat
              ? new Date(
                  data.tanggalSurat,
                )
              : undefined,
          penerima:
            data.penerima,
          perihal:
            data.perihal,
          jenis:
            data.jenis,
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
      module: 'OUTGOING_LETTER',
      description:
        `Mengubah surat keluar ${updatedLetter.nomorSurat}`,
      entityId: updatedLetter.id,
    });

    return updatedLetter;
  }

  async updateFile(
    id: number,
    filePath: string,
    userId: number,
  ) {
    const letter =
      await this.findOne(id);

    const oldFilePath =
      letter.filePath;

    const updatedLetter =
      await this.prisma.outgoingLetter.update({
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
      module: 'OUTGOING_LETTER',
      description:
        `Mengunggah file surat keluar ${updatedLetter.nomorSurat}`,
      entityId: updatedLetter.id,
    });

    return updatedLetter;
  }

  async remove(
    id: number,
    deletedById: number,
  ) {
    const letter =
      await this.findOne(id);

    await this.prisma.outgoingLetter.update({
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
      module: 'OUTGOING_LETTER',
      description:
        `Memindahkan surat keluar ${letter.nomorSurat} ke riwayat`,
      entityId: letter.id,
    });

    return {
      message:
        'Surat keluar berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const letter =
      await this.prisma.outgoingLetter.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Surat keluar tidak ditemukan di history',
      );
    }

    const existingLetter =
      await this.prisma.outgoingLetter.findFirst({
        where: {
          nomorSurat:
            letter.nomorSurat,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

    if (existingLetter) {
      throw new BadRequestException(
        'Nomor surat sudah digunakan oleh surat keluar aktif',
      );
    }

    await this.prisma.outgoingLetter.update({
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
      module: 'OUTGOING_LETTER',
      description:
        `Memulihkan surat keluar ${letter.nomorSurat}`,
      entityId: letter.id,
    });

    return {
      message:
        'Surat keluar berhasil dipulihkan',
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