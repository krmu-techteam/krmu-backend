import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateImage(file: Express.Multer.File) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException(`${file.originalname} is not a valid image.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(
      `${file.originalname} exceeds the maximum size of 10 MB.`,
    );
  }

  return true;
}

export function validateImages(files: Express.Multer.File[]) {
  if (!files || files.length === 0) {
    throw new BadRequestException('Please upload at least one image.');
  }

  files.forEach(validateImage);
}
