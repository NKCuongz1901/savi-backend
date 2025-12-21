import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get()
  async testGenerateText() {
    return this.geminiService.ConvertText('I have salary 10000000 VND');
  }

  @UseGuards(JwtAuthGuard)
  @Get('analyze')
  async analyzeTransactions(@Request() req: any) {
    const userId = req.user.userId;
    return this.geminiService.analyzeTransactions(userId);
  }
}
