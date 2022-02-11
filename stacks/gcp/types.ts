import { GcpConfig } from "../../runtime";

export type StackOptions = {
  functionsDir: string;
  environment: string;
  project: string;
  region: string;
  envVars?: Record<string, string>;
  secretNames?: string[];
};

export type GcpFunction = GcpConfig & {
  file: string;
  name: string;
};

export type FunctionTriggerConfig =
  | { triggerHttp: boolean }
  | { eventTrigger: { eventType: string; resource: string } };
