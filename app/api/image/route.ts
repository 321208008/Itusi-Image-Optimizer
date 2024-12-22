import { NextRequest, NextResponse } from 'next/server';
import { TencentCloudService } from '@/lib/tencent-cloud';

// 新的路由配置格式
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quality = Number(formData.get('quality')) || 80;
    const format = formData.get('format') as string || 'original';

    console.log('接收到的处理参数:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      quality,
      format
    });

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只支持图片文件' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudService = new TencentCloudService();

    console.log('开始上传图片:', file.name);
    // 上传原始图片
    const imageUrl = await cloudService.uploadImage(buffer, file.name);
    console.log('图片上传成功:', imageUrl);

    console.log('开始处理图片:', {
      quality,
      format,
      originalUrl: imageUrl
    });
    // 处理图片
    const processedImageUrl = await cloudService.processImage(imageUrl, {
      quality,
      format: format === 'original' ? undefined : format,
    });
    console.log('图片处理成功:', processedImageUrl);

    // 获取原始图片信息
    console.log('获取原始图片信息');
    const originalInfo = await cloudService.getImageInfo(imageUrl);
    console.log('原始图片信息:', originalInfo);

    // 获取处理后的图片信息
    console.log('获取处理后图片信息');
    const processedInfo = await cloudService.getImageInfo(processedImageUrl);
    console.log('处理后图片信息:', processedInfo);

    // 计算压缩率
    const compressionRatio = originalInfo.size > 0 
      ? ((originalInfo.size - processedInfo.size) / originalInfo.size * 100).toFixed(1)
      : '0';

    console.log('压缩结果:', {
      originalSize: originalInfo.size,
      processedSize: processedInfo.size,
      compressionRatio: `${compressionRatio}%`
    });

    return NextResponse.json({
      originalUrl: imageUrl,
      processedUrl: processedImageUrl,
      info: {
        size: processedInfo.size,
        type: processedInfo.type,
        lastModified: processedInfo.lastModified,
        originalSize: originalInfo.size,
        compressionRatio
      },
    });
  } catch (error) {
    console.error('图片处理错误:', error);
    const errorMessage = error instanceof Error ? error.message : '图片处理失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 