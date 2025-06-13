/**
 * Defines the names for different job queues.
 */
export const QueueNames = {
  FIND_SHIPPER: 'find-shipper',
  NOTIFY_SHIPPERS: 'notify-shippers',
} as const;

/**
 * Job data interfaces for type safety
 */
export interface FindShipperJobData {
  readonly pendingAssignmentId: string;
  readonly orderId: string;
  readonly attempt: number;
  readonly isRetry?: boolean;
  readonly originalJobId?: string;
  readonly retryAttempt?: number;
}

export interface GcsUploadJobData {
  readonly tempFilePath: string;
  readonly originalname: string;
  readonly mimetype: string;
  readonly folder: string;
  readonly isPublic: boolean;
  readonly transcodingConfig?: any;
  readonly contentId?: string;
}

