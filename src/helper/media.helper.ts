export function getFolderFromMimeType(mimeType: string): string {
  if (!mimeType) {
    return 'Others';
  }

  // Images
  if (mimeType.startsWith('image/')) {
    return 'Images';
  }

  // PDFs
  if (mimeType === 'application/pdf') {
    return 'PDFs';
  }

  // Videos
  if (mimeType.startsWith('video/')) {
    return 'Videos';
  }

  // Audio
  if (mimeType.startsWith('audio/')) {
    return 'Audio';
  }

  // Word Documents
  if (
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'Documents';
  }

  // Excel
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'Documents';
  }

  // PowerPoint
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'Documents';
  }

  // Archives
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed'
  ) {
    return 'Archives';
  }

  return 'Others';
}
