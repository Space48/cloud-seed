import { GcpConfig } from "../../runtime";
import { BaseConfig } from "../../utils/rootConfig";

export type StackOptions = {
  outDir: string;
  environment: string;
  gcpOptions: BaseConfig["cloud"]["gcp"];
  envVars?: Record<string, string>;
  secretNames?: string[];
};

export type GcpFunction = GcpConfig & {
  file: string;
  name: string;
};
