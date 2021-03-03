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
  | {
      type: "firestore";
      config: {
        collection: string;
        event?: "create" | "write" | "update" | "delete";
      };
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

const defaultStackOptions: StackOptions = {
  functionsDir: ".build/functions",
  manifestName: "s48-manifest.json",
  environment: "dev",
  region: "europe-west2",
  backendBucket: "s48-terraform-state",
};

export default class GcpStack extends TerraformStack {
  constructor(scope: Construct, name: string, options: Partial<StackOptions>) {
    super(scope, name);

    const {
      functionsDir,
      environment,
      manifestName,
      region,
      backendBucket,
      backendPrefix,
    } = { ...defaultStackOptions, ...options };

    // Configure the remote backend where state will be stored.
    new GcsBackend(this, {
      bucket: backendBucket,
      prefix: backendPrefix,
    });

    // Configure the Google Provider.
    const provider = new GoogleProvider(this, "GoogleAuth", {
      region,
      project: name,
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

      const artifactPath = `.build/artifacts/${manifest.name}.zip`;
      const archive = new DataArchiveFile(this, manifest.name + "zip", {
        type: "zip",
        outputPath: artifactPath,
        sourceDir: functionDir,
      });

      switch (manifest.type) {
        case "event":
          new TerraformHclModule(this, manifest.name + "-event", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/subscription",
            variables: {
              bucket_name: bucket.name,
              archive_object: archive.id,
              name: manifest.name,
              environment,
              topic_name: manifest.config.topicName,
            },
          });
          break;
        case "schedule":
          new TerraformHclModule(this, manifest.name + "-schedule", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/schedule-function",
            variables: {
              bucket_name: bucket.name,
              archive_object: archive.id,
              schedule: manifest.config.schedule,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "http":
          new TerraformHclModule(this, manifest.name + "-http", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/http-function",
            variables: {
              bucket_name: bucket.name,
              archive_object: archive.id,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "firestore":
          new TerraformHclModule(this, manifest.name + "-firestore", {
            source:
              "git@bitbucket.org:space48/terraform-modules.git//modules/firestore",
            variables: {
              bucket_name: bucket.name,
              archive_object: archive.id,
              name: manifest.name,
              environment,
              collection_path: manifest.config.collection,
              firestore_action: manifest.config.event ?? "create",
            },
          });
          break;
      }
    }
  }
}
