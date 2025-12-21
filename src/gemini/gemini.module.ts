import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { PrismaService } from 'src/prisma/prisma.service';


@Module({
  controllers: [GeminiController],
  providers: [GeminiService, PrismaService],
})
export class GeminiModule {}
