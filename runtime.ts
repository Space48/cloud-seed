
export type RuntimeConfig = {
  type: "http";
  public: boolean;
} | {
  type: "event";
  topicName: string;
} | {
  type: "schedule";
  schedule: string;
}