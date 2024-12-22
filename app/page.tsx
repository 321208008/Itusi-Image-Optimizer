'use client';

import { useState } from 'react';
import { Dropzone } from '@/components/dropzone';
import { useI18n } from '@/lib/i18n/use-translations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface ImageFile extends File {
  preview: string;
}

interface ProcessedResult {
  originalUrl: string;
  processedUrl: string;
  info: {
    size: number;
    type: string;
    lastModified: string;
    originalSize: number;
    compressionRatio: string;
  };
}

export default function Home() {
  const { t } = useI18n();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('original');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);

  const handleFilesDrop = (newFiles: File[]) => {
    const updatedFiles = newFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...updatedFiles]);
  };

  const processImages = async () => {
    setProcessing(true);
    try {
      const processedResults = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('quality', quality.toString());
          formData.append('format', format);

          const response = await fetch('/api/image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to process image');
          }

          return await response.json();
        })
      );

      setResults(processedResults);
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (url: string, originalName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = format === 'original' ? originalName.split('.').pop() : format;
      const fileName = `optimized-${originalName.split('.')[0]}.${ext}`;
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const file = files[i];
      await handleDownload(result.processedUrl, file.name);
    }
  };

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.quality')}</CardTitle>
              <CardDescription>Adjust compression quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => setQuality(value)}
                  min={0}
                  max={100}
                  step={1}
                />
                <div className="text-sm text-muted-foreground text-center">
                  {quality}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.format')}</CardTitle>
              <CardDescription>Choose output format</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t('settings.formats')).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Dropzone onFilesDrop={handleFilesDrop} />

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => {
                setFiles([]);
                setResults([]);
              }}>
                {t('actions.clear')}
              </Button>
              {results.length > 0 && (
                <Button variant="outline" onClick={handleDownloadAll}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('actions.downloadAll')}
                </Button>
              )}
              <Button 
                onClick={processImages}
                disabled={processing}
              >
                {processing ? t('actions.processing') : t('actions.process')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <Card key={file.name}>
                  <CardContent className="p-4">
                    <img
                      src={results[index]?.processedUrl || file.preview}
                      alt={file.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t('imageInfo.name')}: </span>
                        {file.name}
                      </p>
                      {results[index] ? (
                        <>
                          <p>
                            <span className="font-medium">{t('imageInfo.originalSize')}: </span>
                            {formatSize(results[index].info.originalSize)}
                          </p>
                          <p>
                            <span className="font-medium">{t('imageInfo.processedSize')}: </span>
                            {formatSize(results[index].info.size)}
                          </p>
                          <p>
                            <span className="font-medium">{t('imageInfo.reduction')}: </span>
                            {results[index].info.compressionRatio}%
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleDownload(results[index].processedUrl, file.name)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {t('actions.download')}
                          </Button>
                        </>
                      ) : (
                        <p>
                          <span className="font-medium">{t('imageInfo.size')}: </span>
                          {formatSize(file.size)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}