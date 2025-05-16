/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const { fileName, fileType, folder = "uploads", isPublic = false } = await req.json();
    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing fileName or fileType" }, { status: 400 });
    }
    const destination = `${folder}/${fileName}`;
    const options = {
      version: "v4" as const,
      action: "write" as const,
      expires: Date.now() + 360 * 60 * 1000, // 360 phut
      contentType: fileType,
    };
    if (isPublic) {
      // This is only a hint for the client; actual ACL is set by the client on upload
      (options as any).extensionHeaders = { "x-goog-acl": "public-read" };
    }
    const [url] = await storage.bucket(bucketName).file(destination).getSignedUrl(options);
    return NextResponse.json({ url, publicUrl: `https://storage.googleapis.com/${bucketName}/${destination}` });
  } catch (error) {
    console.error("[API] Signed URL error:", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}