'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/use-translations';

interface DropzoneProps {
  onFilesDrop: (files: File[]) => void;
}

export function Dropzone({ onFilesDrop }: DropzoneProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesDrop(acceptedFiles);
    setIsDragging(false);
  }, [onFilesDrop]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        'hover:border-primary hover:bg-secondary/50',
        isDragging && 'border-primary bg-secondary/50',
        'dark:border-gray-700 dark:hover:border-primary dark:hover:bg-gray-800/50'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('dropzone.title')}</h3>
      <p className="text-sm text-muted-foreground">{t('dropzone.description')}</p>
    </div>
  );
}