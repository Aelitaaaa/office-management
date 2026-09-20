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

import { CreateOutgoingLetterDto } from './dto/create-outgoing-letter.dto';
import { UpdateOutgoingLetterDto } from './dto/update-outgoing-letter.dto';
import { OutgoingLetterService } from './outgoing-letter.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('outgoing-letters')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class OutgoingLetterController {
  constructor(
    private readonly outgoingLetterService: OutgoingLetterService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.outgoingLetterService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.outgoingLetterService.findHistory();
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
    const letter =
      await this.outgoingLetterService.findOne(
        Number(id),
      );

    if (!letter.filePath) {
      throw new NotFoundException(
        'File surat keluar tidak ditemukan',
      );
    }

    const normalizedPath =
      letter.filePath.replace(
        /\\/g,
        '/',
      );

    if (
      !normalizedPath.startsWith(
        'uploads/outgoing-letters/',
      )
    ) {
      throw new NotFoundException(
        'File surat keluar tidak valid',
      );
    }

    const absolutePath = join(
      process.cwd(),
      normalizedPath,
    );

    if (!existsSync(absolutePath)) {
      throw new NotFoundException(
        'File surat keluar tidak ditemukan di server',
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
    return this.outgoingLetterService.findOne(
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
    createOutgoingLetterDto: CreateOutgoingLetterDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.outgoingLetterService.create(
      createOutgoingLetterDto,
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
        'outgoing-letters',
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
      `uploads/outgoing-letters/${file.filename}`;

    return this.outgoingLetterService.updateFile(
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
    updateOutgoingLetterDto: UpdateOutgoingLetterDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.outgoingLetterService.update(
      Number(id),
      updateOutgoingLetterDto,
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
    return this.outgoingLetterService.remove(
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
    return this.outgoingLetterService.restore(
      Number(id),
      req.user.sub,
    );
  }
}