// Cloudflare R2 Service
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export class R2Service {
  private bucket = process.env.R2_BUCKET || 'lendflow-documents';

  async upload(key: string, body: Buffer, options?: { ContentType?: string }): Promise<void> {
    await r2Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.ContentType || 'application/octet-stream',
    }));
  }

  async download(key: string): Promise<Buffer> {
    const response = await r2Client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    return Buffer.from(await response.Body!.transformToByteArray());
  }

  getPublicUrl(key: string): string {
    return `https://pub.lendflow.na/${key}`;
  }
}

export const r2Service = new R2Service();
