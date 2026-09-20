import { BadRequestException } from '@nestjs/common';
import {
  existsSync,
  openSync,
  readSync,
  closeSync,
  unlinkSync,
} from 'fs';

export function validateFileSignature(
  file: Express.Multer.File,
): void {
  if (!file?.path || !existsSync(file.path)) {
    throw new BadRequestException(
      'File upload tidak ditemukan',
    );
  }

  const buffer = Buffer.alloc(8);
  const fileDescriptor = openSync(file.path, 'r');

  try {
    readSync(
      fileDescriptor,
      buffer,
      0,
      buffer.length,
      0,
    );
  } finally {
    closeSync(fileDescriptor);
  }

  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const validSignature =
    (file.mimetype === 'application/pdf' && isPdf) ||
    (file.mimetype === 'image/jpeg' && isJpeg) ||
    (file.mimetype === 'image/png' && isPng);

  if (!validSignature) {
    if (existsSync(file.path)) {
      unlinkSync(file.path);
    }

    throw new BadRequestException(
      'Isi file tidak sesuai dengan jenis file. Upload ditolak.',
    );
  }
}