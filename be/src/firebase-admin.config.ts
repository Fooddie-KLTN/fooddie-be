import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

let firebaseApp: admin.app.App;

export function initializeFirebaseAdmin(configService: ConfigService) {
  try {
    const serviceAccount = {
      type: configService.get('FIREBASE_TYPE'),
      project_id: configService.get('FIREBASE_PROJECT_ID'),
      private_key_id: configService.get('FIREBASE_PRIVATE_KEY_ID'),
      private_key: configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      client_email: configService.get('FIREBASE_CLIENT_EMAIL'),
      client_id: configService.get('FIREBASE_CLIENT_ID'),
      auth_uri: configService.get('FIREBASE_AUTH_URI'),
      token_uri: configService.get('FIREBASE_TOKEN_URI'),
      auth_provider_x509_cert_url: configService.get('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
      client_x509_cert_url: configService.get('FIREBASE_CLIENT_X509_CERT_URL'),
      universe_domain: "googleapis.com"
    };

    if (!firebaseApp) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
  }
}

export default admin;