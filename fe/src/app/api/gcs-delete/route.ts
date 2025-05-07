import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    type: process.env.GOOGLE_CLOUD_TYPE,
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || 'googleapis.com',
  },
});
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME as string;

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "Missing or invalid file URLs" }, { status: 400 });
    }

    const errors: string[] = [];
    for (const url of urls) {
      if (typeof url !== "string") {
        errors.push("Invalid URL type");
        continue;
      }
      const match = url.match(/https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)/) ||
                    url.match(/https:\/\/storage\.cloud\.google\.com\/([^/]+)\/(.+)/) ||
                    url.match(/https:\/\/[^/]+\/([^/]+)\/(.+)/);

      if (!match || match[1] !== bucketName) {
        errors.push(`Invalid or mismatched bucket in URL: ${url}`);
        continue;
      }
      const filePath = match[2];
      try {
        await storage.bucket(bucketName).file(filePath).delete();
      } catch (err) {
        if (err instanceof Error) {
                
            errors.push(`Failed to delete: ${url} - ${err.message}`);
            }
        errors.push(`Failed to delete: ${url}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 207 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] GCS Delete error:", error);
    return NextResponse.json({ error: "Failed to delete file(s)" }, { status: 500 });
  }
}