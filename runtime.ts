export enum CloudServices {
  GCP = "gcp",
  AWS = "aws", 
  AZURE = "azure",
}

export type HttpConfig = {
  type: "http";
  public: boolean;
};

export type EventConfig = {
  type: "event";
  topicName: string;
};

export type ScheduleConfig = {
  type: "schedule";
  schedule: string;
};

export type FirestoreConfig = {
  type: "firestore";
  collection: string;
  event?: "create" | "write" | "update" | "delete";
};

export type GcpConfig = (
  HttpConfig | EventConfig | ScheduleConfig | FirestoreConfig
) & {
  cloud: "gcp"
};
