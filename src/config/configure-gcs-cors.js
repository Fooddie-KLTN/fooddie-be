/* eslint-disable @typescript-eslint/no-require-imports */
// Use CommonJS syntax for Node.js compatibility

const { Storage } = require("@google-cloud/storage");
require("dotenv").config();
const bucketName =
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME ||
  ""; // <-- Optionally, put your bucket name here as a fallback

if (!bucketName) {
  console.error(
    "❌ Error: GOOGLE_CLOUD_STORAGE_BUCKET_NAME is not set. Please set it in your .env file or hardcode it in this script."
  );
  process.exit(1);
}

const origins = [
  "http://localhost:3000",
  "https://nguoitai.com", // <-- Replace with your production domain
];
const responseHeaders = ["Content-Type", "x-goog-acl"];
const methods = ["GET", "PUT", "POST", "HEAD"];
const maxAgeSeconds = 86400; // 24h

const configureBucketCors = async () => {
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
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      origin: origins,
      method: methods,
      responseHeader: responseHeaders,
      maxAgeSeconds,
    },
  ]);
  console.log(
    `✅ Bucket ${bucketName} was updated with a CORS config to allow ${methods.join(
      ", "
    )} requests from ${origins.join(", ")} sharing ${responseHeaders.join(
      ", "
    )} responses across origins`
  );
};

configureBucketCors().catch((err) => {
  console.error("❌ Failed to configure CORS:", err);
  process.exit(1);
});