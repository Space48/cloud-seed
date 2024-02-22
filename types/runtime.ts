export enum CloudServices {
  GCP = "gcp",
  AWS = "aws",
  AZURE = "azure",
}

// Generic function parameters.
export type FunctionConfig = {
  // timeout in seconds. default of 60, max of 540.
  timeout?: number;
  runtime: string;
  memory?: number;
  retryOnFailure?: boolean;
  staticIp?: boolean;
  maxInstances?: number;
  minInstances?: number;
  version?: string;
};

export type HttpConfig = {
  type: "http";
  public: boolean;
} & FunctionConfig;

export type EventConfig = {
  type: "event";
  topicName: string;
  topicConfig?: {
    messageRetentionDuration?: string;
  };
} & FunctionConfig;

export type ScheduleConfig = {
  type: "schedule";
  schedule: string;
} & FunctionConfig;

// This is to trigger the cloud function directly from scheduled job, rather than triggering through a pub/sub topic
export type ScheduledJobConfig = {
  type: "scheduledJob";
  schedule: string;
} & FunctionConfig;

export type QueueConfig = {
  type: "queue";
  queueConfig?: {
    maxDispatchesPerSecond?: number;
    maxConcurrentDispatches?: number;
    maxAttempts?: number;
    maxRetryDuration?: string;
    minBackoff?: string;
    maxBackoff?: string;
    maxDoublings?: number;
  };
} & FunctionConfig;

export type FirestoreConfig = {
  type: "firestore";
  document: string;
  firestoreEvent?: "create" | "write" | "update" | "delete";
} & FunctionConfig;

export type StorageConfig = {
  type: "storage";
  bucket: {
    default: string;
    environmentSpecific?: Record<string, string>;
  };
  storageEvent?: "finalize" | "delete" | "archive" | "metadataUpdate";
} & FunctionConfig;

export type GcpConfig = (
  | HttpConfig
  | EventConfig
  | ScheduleConfig
  | QueueConfig
  | FirestoreConfig
  | StorageConfig
  | ScheduledJobConfig
) & {
  cloud: "gcp";
  name?: string;
};
