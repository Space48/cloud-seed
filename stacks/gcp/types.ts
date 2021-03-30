import { ScheduleConfig, EventConfig, FirestoreConfig, HttpConfig, GcpConfig } from "../../runtime";

export type Manifest = {
  name: string;
} & (
  | {
      type: "schedule";
      config: Omit<ScheduleConfig, "type">;
    }
  | {
      type: "event";
      config: Omit<EventConfig, "type">;
    }
  | {
      type: "http";
      config: Omit<HttpConfig, "type">;
    }
  | {
      type: "firestore";
      config: Omit<FirestoreConfig, "type">;
    }
);

export type StackOptions = {
  functionsDir: string;
  manifestName: string;
  environment: string;
  region: string;
  backendBucket: string;
  backendPrefix?: string;
};

export type GcpFunction = GcpConfig & {
  functionPath: string;
  functionName: string;
};

export type FunctionTriggerConfig =
  | { triggerHttp: boolean }
  | { eventTrigger: { eventType: string; resource: string }[] };
