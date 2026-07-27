import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import { lookup } from 'mime-types';
// import { HttpService } from '@nestjs/axios';

@Injectable()
export class CloudflareService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    // private readonly http: HttpService,
    // private readonly cloudflareService: CloudflareService,
  ) {
    this.bucketName = process.env.R2_BUCKET!;

    this.s3 = new S3Client({
      endpoint: process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : undefined,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );

      console.log('✅ Cloudflare R2 Connected Successfully');
    } catch (error) {
      console.error('❌ Unable to connect to Cloudflare R2');
      console.error(error);
    }
  }

  async uploadWordpressMedia(
    filename: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    const fileExt = path.extname(filename);

    const fileName =
      filename.replace(fileExt, '').toLowerCase().split(' ').join('-') +
      '-' +
      Date.now() +
      fileExt;

    const contentType = lookup(fileExt) || 'application/octet-stream';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      }),
    );

    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  }
}

//   async testConnection() {
//     try {
//       await this.s3.send(
//         new HeadBucketCommand({
//           Bucket: this.bucketName,
//         }),
//       );

//       console.log('✅ Cloudflare R2 Connected Successfully');
//     } catch (error) {
//       console.error('❌ Failed to connect to Cloudflare R2');
//       console.error(error);
//     }
//   }

/**
 * Generate a pre-signed URL for uploading an image
 */

//   /**
//    * Generate a pre-signed URL for fetching an image
//    */
//   async getDownloadUrl(fileKey: string): Promise<string> {
//     const command = new GetObjectCommand({
//       Bucket: this.bucketName,
//       Key: fileKey,
//     });

//     return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
//   }

//   /**
//    * Generate a pre-signed URL for deleting an image
//    */
//   async getDeleteUrl(fileKey: string): Promise<string> {
//     const command = new DeleteObjectCommand({
//       Bucket: this.bucketName,
//       Key: fileKey,
//     });

//     return await getSignedUrl(this.s3, command);
//   }
// }
