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

import { CreateIncomingLetterDto } from './dto/create-incoming-letter.dto';
import { UpdateIncomingLetterDto } from './dto/update-incoming-letter.dto';

@Injectable()
export class IncomingLetterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async findAll() {
    return this.prisma.incomingLetter.findMany({
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
        tanggalTerima: 'desc',
      },
    });
  }

  async findHistory() {
    return this.prisma.incomingLetter.findMany({
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
      await this.prisma.incomingLetter.findFirst({
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
        'Surat masuk tidak ditemukan',
      );
    }

    return letter;
  }

  async create(
    data: CreateIncomingLetterDto,
    userId: number,
  ) {
    const existingLetter =
      await this.prisma.incomingLetter.findFirst({
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
      await this.prisma.incomingLetter.create({
        data: {
          nomorSurat: data.nomorSurat,
          tanggalSurat: new Date(
            data.tanggalSurat,
          ),
          tanggalTerima:
            data.tanggalTerima
              ? new Date(
                  data.tanggalTerima,
                )
              : new Date(),
          pengirim: data.pengirim,
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
      module: 'INCOMING_LETTER',
      description:
        `Menambahkan surat masuk ${letter.nomorSurat} dari ${letter.pengirim}`,
      entityId: letter.id,
    });

    return letter;
  }

  async update(
    id: number,
    data: UpdateIncomingLetterDto,
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
        await this.prisma.incomingLetter.findFirst({
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
      await this.prisma.incomingLetter.update({
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
          tanggalTerima:
            data.tanggalTerima
              ? new Date(
                  data.tanggalTerima,
                )
              : undefined,
          pengirim:
            data.pengirim,
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
      module: 'INCOMING_LETTER',
      description:
        `Mengubah surat masuk ${updatedLetter.nomorSurat}`,
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
      await this.prisma.incomingLetter.update({
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
      module: 'INCOMING_LETTER',
      description:
        `Mengunggah file surat masuk ${updatedLetter.nomorSurat}`,
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

    await this.prisma.incomingLetter.update({
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
      module: 'INCOMING_LETTER',
      description:
        `Memindahkan surat masuk ${letter.nomorSurat} ke riwayat`,
      entityId: letter.id,
    });

    return {
      message:
        'Surat masuk berhasil dipindahkan ke history',
    };
  }

  async restore(
    id: number,
    userId: number,
  ) {
    const letter =
      await this.prisma.incomingLetter.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Surat masuk tidak ditemukan di history',
      );
    }

    const existingLetter =
      await this.prisma.incomingLetter.findFirst({
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
        'Nomor surat sudah digunakan oleh surat masuk aktif',
      );
    }

    await this.prisma.incomingLetter.update({
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
      module: 'INCOMING_LETTER',
      description:
        `Memulihkan surat masuk ${letter.nomorSurat}`,
      entityId: letter.id,
    });

    return {
      message:
        'Surat masuk berhasil dipulihkan',
    };
  }

  async permanentDelete(
    id: number,
    userId: number,
  ) {
    const letter =
      await this.prisma.incomingLetter.findFirst({
        where: {
          id,
          deletedAt: {
            not: null,
          },
        },
      });

    if (!letter) {
      throw new NotFoundException(
        'Surat masuk tidak ditemukan di history',
      );
    }

    const filePath =
      letter.filePath;

    const nomorSurat =
      letter.nomorSurat;

    await this.prisma.incomingLetter.delete({
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
      module: 'INCOMING_LETTER',
      description:
        `Menghapus permanen surat masuk ${nomorSurat}`,
      entityId: id,
    });

    return {
      message:
        'Surat masuk berhasil dihapus permanen',
    };
  }

  private deletePhysicalFile(
    filePath: string,
  ) {
    const normalizedPath =
      filePath.replace(/\\/g, '/');

    if (
      !normalizedPath.startsWith(
        'uploads/incoming-letters/',
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