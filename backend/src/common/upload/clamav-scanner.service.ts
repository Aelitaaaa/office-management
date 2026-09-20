import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

const clamScanPath =
  'C:\\Program Files\\ClamAV\\clamscan.exe';

const databasePath =
  'C:\\Program Files\\ClamAV\\database';

export async function scanFileWithClamAV(
  file: Express.Multer.File,
): Promise<void> {
  if (!file?.path || !existsSync(file.path)) {
    throw new BadRequestException(
      'File upload tidak ditemukan',
    );
  }

  if (!existsSync(clamScanPath)) {
    deleteFile(file.path);

    throw new InternalServerErrorException(
      'ClamAV tidak ditemukan di server',
    );
  }

  if (!existsSync(databasePath)) {
    deleteFile(file.path);

    throw new InternalServerErrorException(
      'Database ClamAV tidak ditemukan',
    );
  }

  await new Promise<void>((resolve, reject) => {
    execFile(
      clamScanPath,
      [
        `--database=${databasePath}`,
        '--no-summary',
        file.path,
      ],
      {
        windowsHide: true,
        timeout: 60000,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve();
          return;
        }

        const exitCode =
          typeof error.code === 'number'
            ? error.code
            : undefined;

        deleteFile(file.path);

        if (exitCode === 1) {
          reject(
            new BadRequestException(
              'File terdeteksi berbahaya oleh ClamAV dan upload ditolak',
            ),
          );

          return;
        }

        console.error(
          'ClamAV scan gagal:',
          stdout,
          stderr,
          error.message,
        );

        reject(
          new InternalServerErrorException(
            'File gagal diperiksa oleh ClamAV',
          ),
        );
      },
    );
  });
}

function deleteFile(filePath: string): void {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}