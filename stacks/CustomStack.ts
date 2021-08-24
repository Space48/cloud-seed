import { Construct } from "constructs";
import { GcsBackend, TerraformStack } from "cdktf";
import { BuildOpts } from "../build";
import { GcpConfig } from "../runtime";

export type FunctionConfig = {
  file: string;
  name: string;
} & GcpConfig;

export type StackOptions = {
  functionsDir: string;
  functions: FunctionConfig[];
  backendBucket: string;
  backendPrefix?: string;
} & BuildOpts;

export default class CustomStack extends TerraformStack {
  constructor(scope: Construct, name: string, private options: StackOptions) {
    super(scope, name);
    // Configure the remote backend where state will be stored.
    new GcsBackend(this, {
      bucket: this.options.backendBucket,
      prefix: this.options.backendPrefix,
    });
  }
}
