import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UploadResult } from '../interfaces/upload-result.interface';
import { CloudflareService } from '../../cloudfare/cloudflare.service';

@Injectable()
export class UploadService {
  constructor(private readonly cloudflareService: CloudflareService) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    try {
      return await this.cloudflareService.uploadFile(file, folder);
    } catch (error) {
      console.error('Image upload failed:', error);

      throw new InternalServerErrorException('Image upload failed.');
    }
  }

  /**
   * Delete uploaded images
   * Used when SQL transaction fails
   */
  async rollbackImages(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      await this.cloudflareService.deleteFiles(keys);
    } catch (error) {
      /**
       * Don't throw another exception.
       * Database failure is more important.
       *
       * Just log the error.
       */
      console.error('Failed to rollback uploaded images.', error);
    }
  }
}
