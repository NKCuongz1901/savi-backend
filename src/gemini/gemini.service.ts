import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { buildAnalysisPrompt, buildTranactionPrompt } from 'src/utils/prompt';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class GeminiService {
    private readonly ai: GoogleGenAI;
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService, 
      
    ) {
        const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
        this.ai = new GoogleGenAI({
            apiKey: geminiApiKey,
        })
    }

    async ConvertText(transcript: string) {
        const prompt = buildTranactionPrompt(transcript);
        const response = await this.ai.models.generateContent({
            model:'gemini-2.5-flash',
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

    async analyzeTransactions(userId: string, filters?: {
        startDate?: string;
        endDate?: string;
        type?: 'INCOME' | 'EXPENSE';
    }) {
        // Lấy transactions từ Prisma
        const where: any = { userId };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                where.date.lte = endDate;
            }
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                category: true,
                defaultCategory: true,
            },
            orderBy: { date: 'desc' },
        });

        // Chuẩn bị dữ liệu transactions cho prompt
        const transactionsData = transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            category: t.category?.name || t.defaultCategory?.name || 'Unknown',
            date: t.date,
            note: t.note || '',
        }));

        // Tạo prompt
        const prompt = buildAnalysisPrompt(JSON.stringify(transactionsData));

        // Gọi AI phân tích
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
        });

        return response.text;
    }

    
}
