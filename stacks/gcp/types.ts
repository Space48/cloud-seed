import { GcpConfig } from "../../types/runtime";

export type StackOptions = {
  outDir: string;
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
