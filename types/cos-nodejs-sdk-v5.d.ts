declare module 'cos-nodejs-sdk-v5' {
  interface COSOptions {
    SecretId: string;
    SecretKey: string;
    UseAccelerate?: boolean;
    Protocol?: string;
  }

  interface PutObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
    Body: Buffer;
    ContentType?: string;
  }

  interface HeadObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }

  interface COSResponse {
    ContentLength?: number;
    ContentType?: string;
    LastModified?: string;
  }

  type Callback = (err: Error | null, data: COSResponse) => void;

  class COS {
    constructor(options: COSOptions);
    putObject(params: PutObjectParams, callback: Callback): void;
    headObject(params: HeadObjectParams, callback: Callback): void;
  }

  export = COS;
} 