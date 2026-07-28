import { Controller } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';

@Controller('cloudflare')
export class CloudflareController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file'))
  // async upload(@UploadedFile() file: Express.Multer.File) {
  //   console.log(file);

  //   if (!file) {
  //     return {
  //       success: false,
  //       message: 'No file received',
  //     };
  //   }

  //   const url = await this.cloudflareService.uploadWordpressMedia(
  //     file.originalname,
  //     file.buffer,
  //   );

  //   return {
  //     success: true,
  //     url,
  //   };
  // }
  // async uploadWordpressMedia(
  //   mediaId: number,
  //   filename: string,
  // ): Promise<string | null> {
  //   const mediaUrl = await this.wordpressService.getMediaById(mediaId);

  //   if (!mediaUrl) {
  //     return null;
  //   }

  //   const buffer = await this.wordpressService.downloadMedia(mediaUrl);

  //   return await this.cloudflareService.uploadWordpressMedia(filename, buffer);
  // }
}
