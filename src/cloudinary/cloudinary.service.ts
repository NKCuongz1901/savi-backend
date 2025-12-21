import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImageFromUrl(imageUrl: string, options?: UploadApiOptions): Promise<UploadApiResponse> {
    try {
      // Direct upload from remote URL
      return await cloudinary.uploader.upload(imageUrl, {
        folder: 'transactions',
        resource_type: 'image',
        ...options,
      });
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to upload image to Cloudinary');
    }
  }

  async uploadImageFromData(imageData: string, options?: UploadApiOptions): Promise<UploadApiResponse> {
    try {
      const raw = (imageData || '').trim();
      const isDataUrl = raw.startsWith('data:');
      const isBase64Only = /^[A-Za-z0-9+/=\r\n]+$/.test(raw);
      const payload = isDataUrl
        ? raw
        : (isBase64Only ? `data:image/jpeg;base64,${raw}` : raw);
  
      return await cloudinary.uploader.upload(payload, {
        folder: 'transactions',
        resource_type: 'image',
        ...options,
      });
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to upload imageData to Cloudinary');
    }
  }
}


