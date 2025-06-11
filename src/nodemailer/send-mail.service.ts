import * as nodemailer from 'nodemailer';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Interface representing email information used for sending messages
 */
export interface EmailInfo {
  readonly from: string;      // Original sender's email (will be stored in reply-to)
  readonly to: string;        // Recipient email
  readonly subject: string;   // Email subject
  readonly sender: string;    // Sender's name
  readonly bodyHtml: string;  // Email HTML content
}

/**
 * Service for sending emails using nodemailer
 */
@Injectable()
export class MailingService implements OnModuleInit {
  private readonly logger = new Logger(MailingService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigValid = false;

  /**
   * Initializes the mail transporter when the module loads
   */
  onModuleInit(): void {
    this.initializeTransporter();
  }

  /**
   * Initializes the nodemailer transporter
   * @returns True if initialization successful, false otherwise
   */
  private initializeTransporter(): boolean {
    try {
      const requiredEnvVars = [
        'MAIL_HOST',
        'MAIL_PORT',
        'MAIL_USER',
        'MAIL_PASSWORD',
        'PROJECT_NAME',
        'PROJECT_EMAIL',
      ];
      
      const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingEnvVars.length > 0) {
        this.logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
        return false;
      }
      
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAILER_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      
      this.isConfigValid = true;
      this.logger.log('Mail transporter initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize mail transporter: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends an email with the provided information
   * @param emailData Information for the email to be sent
   * @returns Promise resolving to success status
   */
  async sendEmail(emailData: EmailInfo): Promise<boolean> {
    if (!this.isConfigValid) {
      const initialized = this.initializeTransporter();
      if (!initialized) {
        this.logger.error('Mail service configuration is invalid');
        throw new Error('Mailing service is not configured properly');
      }
    }
    
    if (!this.transporter) {
      this.logger.error('Transporter is not initialized. Cannot send email.');
      throw new Error('Mailing service is not configured properly');
    }

    try {
      // IMPORTANT CHANGE: Always use the verified MAIL_USER as the from address
      // Store the original sender's email in reply-to and potentially in the body
      const mailOptions = {
        from: {
          name: emailData.sender || process.env.PROJECT_NAME,
          address: process.env.MAIL_USER, // Always use the verified email
        },
        to: emailData.to || process.env.PROJECT_EMAIL,
        subject: emailData.subject || 'Automated email',
        replyTo: emailData.from, // Store original sender email in reply-to
        html: emailData.bodyHtml || '',
        // Optional: Add additional information to the email body
        text: `Original sender: ${emailData.from}\n\n${emailData.bodyHtml.replace(/<[^>]*>/g, '')}`,
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${emailData.to}: ${error.message}`,
        error.stack
      );
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}