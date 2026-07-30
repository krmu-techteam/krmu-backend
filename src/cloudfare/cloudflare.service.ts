import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import { lookup } from 'mime-types';
import { randomUUID } from 'crypto';
import { UploadResult } from 'src/common/interfaces/upload-result.interface';
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

  getPublicUrl(key: string): string {
    return `${process.env.CUSTOM_MEDIA_URL}/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
        }),
      );

      return true;
    } catch (error: any) {
      if (
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }

      throw error;
    }
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

    return `${process.env.CUSTOM_MEDIA_URL}/${fileName}`;
  }

  /**
   * Generic Upload Method
   * Used by News, Events, Faculty, Blogs, etc.
   */

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const extension = path.extname(file.originalname);

    const fileName = `${file.originalname}`;

    const key = `images/${folder}/${fileName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: this.getPublicUrl(key),
    };
  }

  /**
   * Delete a single file from Cloudflare R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      console.log(`✅ Deleted: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to delete: ${key}`);
      console.error(error);

      throw error;
    }
  }

  /**
   * Delete multiple files from Cloudflare R2
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) {
      return;
    }

    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }
}
