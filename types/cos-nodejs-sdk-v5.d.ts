declare module 'cos-nodejs-sdk-v5' {
  interface COSOptions {
    SecretId: string;
    SecretKey: string;
    Protocol?: string;
  }

  interface PutObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
    Body: Buffer | string;
    ContentType?: string;
  }

  interface HeadObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }

  interface COSResult {
    statusCode: number;
    headers: {
      [key: string]: string;
    };
  }

  class COS {
    constructor(options: COSOptions);
    putObject(
      params: PutObjectParams,
      callback: (err: Error | null, data: COSResult) => void
    ): void;
    headObject(
      params: HeadObjectParams,
      callback: (err: Error | null, data: COSResult) => void
    ): void;
  }

  export = COS;
} 