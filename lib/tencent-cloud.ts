import type COS from 'cos-nodejs-sdk-v5';

interface ImageProcessOptions {
  quality?: number;
  format?: string;
  width?: number;
  height?: number;
}

interface ImageInfo {
  size: number;
  type: string;
  lastModified: Date;
}

interface COSConfig {
  SecretId: string;
  SecretKey: string;
  Protocol?: string;
}

export class TencentCloudService {
  private cos: any;
  private bucket: string;
  private region: string;

  constructor() {
    if (typeof window !== 'undefined') {
      throw new Error('TencentCloudService can only be instantiated on the server side');
    }

    try {
      // 检查环境变量
      const secretId = process.env.TENCENT_SECRET_ID;
      const secretKey = process.env.TENCENT_SECRET_KEY;
      const bucket = process.env.TENCENT_BUCKET;
      const region = process.env.TENCENT_REGION;

      if (!secretId || !secretKey || !bucket || !region) {
        throw new Error('腾讯云配置缺失：请检查环境变量');
      }

      // 动态导入 COS SDK
      const COS = require('cos-nodejs-sdk-v5');
      
      const config: COSConfig = {
        SecretId: secretId,
        SecretKey: secretKey,
        Protocol: 'https:'
      };

      this.cos = new COS(config);
      this.bucket = bucket;
      this.region = region;
    } catch (error) {
      console.error('初始化腾讯云服务失败:', error);
      throw new Error('初始化腾讯云服务失败');
    }
  }

  // 上传图片
  async uploadImage(file: Buffer, fileName: string): Promise<string> {
    try {
      const uniqueFileName = this.generateUniqueFileName(fileName);
      const mimeType = this.getMimeType(fileName);
      
      return new Promise<string>((resolve, reject) => {
        this.cos.putObject({
          Bucket: this.bucket,
          Region: this.region,
          Key: uniqueFileName,
          Body: file,
          ContentType: mimeType,
        }, (err: Error | null, data: any) => {
          if (err) {
            console.error('上传图片失败:', err);
            reject(new Error('上传图片失败'));
          } else {
            // 使用标准域名格式
            const url = `https://${this.bucket}.cos.${this.region}.myqcloud.com/${uniqueFileName}`;
            console.log('图片上传成功:', url);
            resolve(url);
          }
        });
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      throw new Error('上传图片失败');
    }
  }

  // 生成唯一的文件名
  private generateUniqueFileName(originalName: string): string {
    try {
      const timestamp = Date.now();
      const crypto = require('crypto');
      const hash = crypto.createHash('md5')
        .update(`${originalName}${timestamp}`)
        .digest('hex')
        .substring(0, 8);
      const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
      return `${hash}-${timestamp}.${ext}`;
    } catch (error) {
      console.error('生成文件名失败:', error);
      throw new Error('生成文件名失败');
    }
  }

  // 获取MIME类型
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  // 处理图片
  async processImage(imageUrl: string, options: ImageProcessOptions): Promise<string> {
    try {
      // 构建数据万象的处理参数
      let processRule = 'imageMogr2/strip';  // 添加 strip 参数移除图片元信息

      // 添加格式转换参数（需要先设置格式）
      if (options.format && ['jpg', 'jpeg', 'png', 'webp'].includes(options.format.toLowerCase())) {
        processRule += `/format/${options.format.toLowerCase()}`;
      }

      // 添加质量压缩参数（使用相对质量）
      if (options.quality && options.quality > 0 && options.quality <= 100) {
        processRule += `/rquality/${options.quality}`;
      }

      // 添加尺寸调整参数
      if (options.width || options.height) {
        processRule += `/thumbnail/${options.width || ''}x${options.height || ''}`;
      }

      // 如果没有任何处理参数，返回原始URL
      if (processRule === 'imageMogr2/strip') {
        return imageUrl;
      }

      // 构建完整的处理URL
      const processedUrl = `${imageUrl}?${processRule}`;
      console.log('处理后的图片URL:', processedUrl);
      
      // 验证处理是否成功
      try {
        const response = await fetch(processedUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error('图片处理验证失败:', response.status, response.statusText);
          return imageUrl;
        }
      } catch (error) {
        console.error('图片处理验证错误:', error);
        return imageUrl;
      }
      
      return processedUrl;
    } catch (error) {
      console.error('处理图片失败:', error);
      return imageUrl; // 如果处理失败，返回原始URL
    }
  }

  // 获取图片信息
  async getImageInfo(imageUrl: string): Promise<ImageInfo> {
    try {
      // 直接通过HTTP请求获取文件大小
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('获取图片失败');
      }
      
      const blob = await response.blob();
      console.log('获取到的图片信息:', {
        size: blob.size,
        type: blob.type,
        url: imageUrl
      });

      return {
        size: blob.size,
        type: blob.type || 'image/jpeg',
        lastModified: new Date(),
      };
    } catch (fetchError) {
      console.error('HTTP请求获取图片信息失败:', fetchError);
      
      try {
        // 从URL中提取文件名
        const urlObj = new URL(imageUrl);
        const pathname = urlObj.pathname;
        const key = pathname.split('/').pop();
        
        if (!key) {
          throw new Error('无效的图片URL');
        }

        // 如果是处理后的URL，需要去除参数部分
        const processedKey = key.split('?')[0];

        // 尝试使用COS API获取信息
        return new Promise<ImageInfo>((resolve, reject) => {
          this.cos.headObject({
            Bucket: this.bucket,
            Region: this.region,
            Key: processedKey,
          }, (err: Error | null, data: any) => {
            if (err) {
              console.error('COS获取图片信息失败:', err);
              resolve({
                size: 0,
                type: this.getMimeType(processedKey),
                lastModified: new Date(),
              });
            } else {
              resolve({
                size: data.ContentLength || 0,
                type: data.ContentType || this.getMimeType(processedKey),
                lastModified: new Date(data.LastModified || Date.now()),
              });
            }
          });
        });
      } catch (error) {
        console.error('获取图片信息失败:', error);
        return {
          size: 0,
          type: 'image/jpeg',
          lastModified: new Date(),
        };
      }
    }
  }
} 