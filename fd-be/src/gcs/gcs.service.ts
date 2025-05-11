import { Injectable, BadRequestException } from '@nestjs/common';
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import * as path from 'path';

@Injectable()
export class GoogleCloudStorageService {
  private storage: Storage;
  private bucket: string;

  constructor() {
    // Initialize with credentials from environment variables with FIREBASE_ prefix
    this.storage = new Storage({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credentials: {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
      }
    });
    

    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET_NAME environment variable is not defined');
    }
    this.bucket = bucketName;
  }

  /**
   * Upload file and make it publicly accessible
   * @param file The file to upload
   * @param folder Destination folder in the bucket
   * @returns Public URL of the uploaded file
   */
  async uploadPublicFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = this.storage.bucket(this.bucket).file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        // Set predefined ACL instead of trying to update ACL after upload
        predefinedAcl: 'publicRead'
      },
      resumable: false,
    });


    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        reject(err);
      });

      stream.on('finish', async () => {
        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${fileName}`;
        
        try {
          // Wait for the makePublic operation to complete
          await this.makeFilePublic(publicUrl);
          resolve(publicUrl);
        } catch (error) {
          console.error('Error making file public:', error);
          // Still resolve with the URL even if setting permissions failed
          resolve(publicUrl);
        }
      });

      stream.end(file.buffer);
    });
  }

  /**
   * Upload file with private access (not publicly accessible)
   * @param file The file to upload
   * @param folder Destination folder in the bucket
   * @returns File path in the bucket (not public URL)
   */
  async uploadPrivateFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = this.storage.bucket(this.bucket).file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        // Use private access level
        predefinedAcl: 'private'
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => {
        reject(err);
      });

      stream.on('finish', async () => {
        // Return the file path instead of URL
        const filePath = fileName;
        resolve(filePath);
      });

      stream.end(file.buffer);
    });
  }

  /**
   * Generate a signed URL for temporarily accessing a private file
   * @param filePath Path to the file in the bucket
   * @param expiresInMinutes How long the URL should be valid (in minutes)
   * @returns Signed URL for temporary access
   */
  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read' as 'read', // Type assertion to the literal type
      expires: Date.now() + expiresInMinutes * 60 * 1000, // Convert minutes to milliseconds
    };

    try {
      const signedUrlResponse = await this.storage
        .bucket(this.bucket)
        .file(filePath)
        .getSignedUrl(options);

      // signedUrlResponse is an array with the URL as the first element
      return signedUrlResponse[0];
    } catch (error) {
      throw new BadRequestException(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
 * Update file permissions to make it publicly accessible
 * @param fileUrl URL or path of the file to make public
 */
  async makeFilePublic(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    let fileName: string;

    // Handle both full URLs and file paths
    if (fileUrl.startsWith('https://storage.googleapis.com')) {
      const urlParts = fileUrl.split(`${this.bucket}/`);
      if (urlParts.length < 2 || !urlParts[1]) return;
      fileName = urlParts[1];
    } else {
      // If it's already a file path
      fileName = fileUrl;
    }

    try {
      await this.storage
        .bucket(this.bucket)
        .file(fileName)
        .makePublic();
      console.log(`Made file public: ${fileName}`);
    } catch (error) {
      console.error(`Error making file public: ${error.message}`);
    }
  }
  /**
   * Delete a file from storage
   * @param fileUrl URL or file path of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    let fileName: string;

    // Handle both full URLs and file paths
    if (fileUrl.startsWith('https://storage.googleapis.com')) {
      const urlParts = fileUrl.split(`${this.bucket}/`);
      if (urlParts.length < 2 || !urlParts[1]) return;
      fileName = urlParts[1];
    } else {
      // If it's already a file path
      fileName = fileUrl;
    }

    await this.storage
      .bucket(this.bucket)
      .file(fileName)
      .delete()
      .catch(() => {
        // Ignore errors if file doesn't exist
      });
  }

  /**
   * Keep the original uploadFile method for backward compatibility
   * @deprecated Use uploadPublicFile instead
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    return this.uploadPublicFile(file, folder);
  }
}