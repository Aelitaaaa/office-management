import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const allowedFiles: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

export function createUploadOptions(folder: string) {
  const uploadPath = `./uploads/${folder}`;

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, {
      recursive: true,
    });
  }

  return {
    storage: diskStorage({
      destination: uploadPath,

      filename: (
        req: Express.Request,
        file: Express.Multer.File,
        callback: (
          error: Error | null,
          filename: string,
        ) => void,
      ) => {
        const extension = extname(
          file.originalname,
        ).toLowerCase();

        const filename =
          `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}${extension}`;

        callback(null, filename);
      },
    }),

    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (
        error: Error | null,
        acceptFile: boolean,
      ) => void,
    ) => {
      const extension = extname(
        file.originalname,
      ).toLowerCase();

      const allowedExtensions =
        allowedFiles[file.mimetype];

      if (
        !allowedExtensions ||
        !allowedExtensions.includes(extension)
      ) {
        return callback(
          new BadRequestException(
            'File hanya boleh berupa PDF, JPG, JPEG, atau PNG yang valid',
          ),
          false,
        );
      }

      callback(null, true);
    },

    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  };
}