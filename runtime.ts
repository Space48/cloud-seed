export type HttpConfig = {
  type: 'http'
  public: boolean;
}

export type EventConfig = {
  type: 'event'
  topicName: string;
}

export type ScheduleConfig = {
  type: 'schedule'
  schedule: string;
}

export type FirestoreConfig = {
  type: 'firestore'
  collection: string;
  event?: "create" | "write" | "update" | "delete";
}

export type RuntimeConfig = HttpConfig | EventConfig | ScheduleConfig | FirestoreConfig;
