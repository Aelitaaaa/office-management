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
import type { Request, Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { scanFileWithClamAV } from '../common/upload/clamav-scanner.service';
import { validateFileSignature } from '../common/upload/file-signature.validator';
import { createUploadOptions } from '../common/upload/upload.config';

import { CreateIncomingLetterDto } from './dto/create-incoming-letter.dto';
import { UpdateIncomingLetterDto } from './dto/update-incoming-letter.dto';
import { IncomingLetterService } from './incoming-letter.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('incoming-letters')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class IncomingLetterController {
  constructor(
    private readonly incomingLetterService: IncomingLetterService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.incomingLetterService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.incomingLetterService.findHistory();
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
      await this.incomingLetterService.findOne(
        Number(id),
      );

    if (!letter.filePath) {
      throw new NotFoundException(
        'File surat masuk tidak ditemukan',
      );
    }

    const normalizedPath =
      letter.filePath.replace(
        /\\/g,
        '/',
      );

    if (
      !normalizedPath.startsWith(
        'uploads/incoming-letters/',
      )
    ) {
      throw new NotFoundException(
        'File surat masuk tidak valid',
      );
    }

    const absolutePath = join(
      process.cwd(),
      normalizedPath,
    );

    if (!existsSync(absolutePath)) {
      throw new NotFoundException(
        'File surat masuk tidak ditemukan di server',
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
    return this.incomingLetterService.findOne(
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
    createIncomingLetterDto: CreateIncomingLetterDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.incomingLetterService.create(
      createIncomingLetterDto,
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
        'incoming-letters',
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
      `uploads/incoming-letters/${file.filename}`;

    return this.incomingLetterService.updateFile(
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
    updateIncomingLetterDto: UpdateIncomingLetterDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.incomingLetterService.update(
      Number(id),
      updateIncomingLetterDto,
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
    return this.incomingLetterService.remove(
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
    return this.incomingLetterService.restore(
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
    return this.incomingLetterService.permanentDelete(
      Number(id),
      req.user.sub,
    );
  }
}