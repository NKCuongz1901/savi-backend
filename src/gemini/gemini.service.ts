import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTranactionPrompt } from 'src/utils/prompt';

@Injectable()
export class GeminiService {
    private readonly ai: GoogleGenAI;
    constructor(private readonly configService: ConfigService) {
        const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.ai = new GoogleGenAI({
            apiKey: geminiApiKey,
        })
    }

    async ConvertText(transcript: string) {
        const prompt = buildTranactionPrompt(transcript);
        const response = await this.ai.models.generateContent({
            model:'gemini-2.0-flash-001',
            contents: prompt,
            config:{
                responseMimeType: 'application/json',
                responseSchema:{
                    type: 'object',
                    properties:{
                        type: {
                            type: 'string',
                            enum: ['INCOME', 'EXPENSE'],
                        },
                        amount: {
                            type: 'number',
                        },
                        category: {
                            type: 'string',
                        },
                        note: {
                            type: 'string',
                        },
                    },
                    required: ['type', 'amount', 'category', 'note'],
                }
            }
        });
        return response.text;
    }

    
}
