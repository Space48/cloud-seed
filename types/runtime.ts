export enum CloudServices {
  GCP = "gcp",
  AWS = "aws",
  AZURE = "azure",
}

// Generic function parameters.
export type FunctionConfig = {
  // timeout in seconds. default of 60, max of 540.
  timeout?: number;
  runtime?: "nodejs12" | "nodejs14";
  memory?: number;
  retryOnFailure?: boolean;
  staticIp?: boolean;
  maxInstances?: number;
};

export type HttpConfig = {
  type: "http";
  public: boolean;
} & FunctionConfig;

export type EventConfig = {
  type: "event";
  topicName: string;
} & FunctionConfig;

export type ScheduleConfig = {
  type: "schedule";
  schedule: string;
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
  | FirestoreConfig
  | StorageConfig
) & {
  cloud: "gcp";
  name?: string;
};
