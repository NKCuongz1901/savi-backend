import { Controller, Get } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get()
  async testGenerateText() {
    return this.geminiService.ConvertText('I have salary 10000000 VND');
  }
}
