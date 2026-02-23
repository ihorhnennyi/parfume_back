import { extname } from 'path';


export class FileUtil {
  
  static generateFileName(originalName: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    const nameWithoutExt = originalName.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
    return `${nameWithoutExt}-${uniqueSuffix}${ext}`;
  }

  
  static isImage(mimetype: string): boolean {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedMimes.includes(mimetype);
  }

  
  static getExtension(filename: string): string {
    return extname(filename).toLowerCase();
  }
}




