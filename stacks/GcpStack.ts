import { Construct } from "constructs";
import { GcsBackend, TerraformHclModule, TerraformStack } from "cdktf";
import { GoogleProvider, StorageBucket } from "../.gen/providers/google";
import { DataArchiveFile } from "../.gen/providers/archive";
import { resolve } from "path";
import glob from "glob";
import fs from "fs";

export type FunctionType = "http" | "schedule" | "event";

export type Manifest = {
  name: string;
} & (
  | {
      type: "schedule";
      config: {
        schedule: string;
      };
    }
  | {
      type: "event";
      config: {
        topicName: string;
      };
    }
  | {
      type: "http";
      config: {
        public: boolean;
      };
    }
);

export type StackOptions = {
  functionsDir: string;
  manifestName: string;
  environment: string;
  region: string;
  gcpProject?: string;
  backendBucket: string;
  backendPrefix?: string;
};

const defaultStackOptions: StackOptions = {
  functionsDir: ".build/functions",
  manifestName: "s48-manifest.json",
  environment: "dev",
  region: "europe-west2",
  backendBucket: "s48-terraform-state",
};

export default class GcpStack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    options: Partial<StackOptions>
  ) {
    super(scope, name);

    const {
      functionsDir,
      environment,
      manifestName,
      region,
      gcpProject,
      backendBucket,
      backendPrefix,
    } = { ...defaultStackOptions ,...options };

    // Configure the remote backend where state will be stored.
    new GcsBackend(this, {
      bucket: backendBucket,
      prefix: backendPrefix,
    });

    // Configure the Google Provider.
    const provider = new GoogleProvider(this, "GoogleAuth", {
      region,
      project: gcpProject,
    });


    // Creates a storage bucket for the functions to be uploaded to.
    const bucket = new StorageBucket(this, `${name}-functions`, {
      name: `${name}-functions`,
    });

    // Find all functions that are going to be deployed
    // iterates over each and produces a zip archive
    // then reads the manifest to figure out how to deploy.
    const funcDir = resolve(functionsDir);
    const functions = glob.sync(`${funcDir}/*`);
    for (let index = 0; index < functions.length; index++) {
      const functionDir = functions[index];

      const manifest: Manifest = JSON.parse(
        fs.readFileSync(`${functionDir}/${manifestName}`).toString()
      );

      // TODO: we need to create this artifact, and pass it into the module, as the module won't be aware of it otherwise.
      const artifactPath = `.build/artifacts/${manifest.name}.zip`;
      const archive = new DataArchiveFile(this, manifest.name + "zip", {
        type: "zip",
        outputPath: artifactPath,
        sourceDir: functionDir,
      });

      // TODO: move environment to a configur
      switch (manifest.type) {
        case "event":
          // TODO: Are all the variables correct here?
          new TerraformHclModule(this, manifest.name + "-event", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/event-function",
            variables: {
              bucket_name: bucket.name,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "schedule":
          // TODO: Are all the variables correct here?
          new TerraformHclModule(this, manifest.name + "-schedule", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/schedule-function",
            variables: {
              bucket_name: bucket.name,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "http":
          // TODO: Are all the variables correct here?
          new TerraformHclModule(this, manifest.name + "-http", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/http-function",
            variables: {
              bucket_name: bucket.name,
              name: manifest.name,
              environment,
            },
          });
          break;
        // TODO: Add firestore...
        // case "firstore":
        //   // TODO: Are all the variables correct here?
        //   new TerraformHclModule(this, manifest.name + "-firestore", {
        //     source:
        //       "git@bitbucket.org:space48/terraform-modules.git//modules/firestore-function",
        //     variables: {
        //       bucket_name: bucket.name,
        //       name: manifest.name,
        //       environment,
        //     },
        //   });
        //   break;
        // TODO: what about cloud storage triggers?
      }
    }
  }
}
