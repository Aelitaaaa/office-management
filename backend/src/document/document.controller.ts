import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  Request,
  Response,
} from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { scanFileWithClamAV } from '../common/upload/clamav-scanner.service';
import { validateFileSignature } from '../common/upload/file-signature.validator';
import { createUploadOptions } from '../common/upload/upload.config';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentService } from './document.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('documents')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.documentService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.documentService.findHistory();
  }

  @Get(':id/file')
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  async getFile(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const document =
      await this.documentService.findOne(
        Number(id),
      );

    if (!document.filePath) {
      throw new NotFoundException(
        'File dokumen tidak ditemukan',
      );
    }

    const normalizedPath =
      document.filePath.replace(
        /\\/g,
        '/',
      );

    if (
      !normalizedPath.startsWith(
        'uploads/',
      )
    ) {
      throw new NotFoundException(
        'File dokumen tidak valid',
      );
    }

    const absolutePath = join(
      process.cwd(),
      normalizedPath,
    );

    if (!existsSync(absolutePath)) {
      throw new NotFoundException(
        'File dokumen tidak ditemukan di server',
      );
    }

    return res.sendFile(
      absolutePath,
    );
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findOne(
    @Param('id') id: string,
  ) {
    return this.documentService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles(
    'ADMIN',
    'STAFF',
  )
  create(
    @Body()
    createDocumentDto: CreateDocumentDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.documentService.create(
      createDocumentDto,
      req.user.sub,
    );
  }

  @Post(':id/upload')
  @Roles(
    'ADMIN',
    'STAFF',
  )
  @UseInterceptors(
    FileInterceptor(
      'file',
      createUploadOptions(
        'documents',
      ),
    ),
  )
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Req()
    req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException(
        'File wajib diunggah',
      );
    }

    validateFileSignature(file);

    await scanFileWithClamAV(file);

    const filePath =
      `uploads/documents/${file.filename}`;

    return this.documentService.updateFile(
      Number(id),
      filePath,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles(
    'ADMIN',
    'STAFF',
  )
  update(
    @Param('id') id: string,
    @Body()
    updateDocumentDto: UpdateDocumentDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.documentService.update(
      Number(id),
      updateDocumentDto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.documentService.remove(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  restore(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.documentService.restore(
      Number(id),
      req.user.sub,
    );
  }

  @Delete(':id/permanent')
  @Roles('ADMIN')
  permanentDelete(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.documentService.permanentDelete(
      Number(id),
      req.user.sub,
    );
  }
}