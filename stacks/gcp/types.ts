import { GcpConfig } from "../../runtime";

export type StackOptions = {
  functionsDir: string;
  environment: string;
  region: string;
  backendBucket?: string;
  backendPrefix?: string;
};

export type GcpFunction = GcpConfig & {
  file: string;
  name: string;
};

export type FunctionTriggerConfig =
  | { triggerHttp: boolean }
  | { eventTrigger: { eventType: string; resource: string } };
