import { Construct } from "constructs";
import { GcsBackend, TerraformHclModule, TerraformStack } from "cdktf";
import {
  GoogleProvider,
  SecretManagerSecret,
  SecretManagerSecretVersion,
  StorageBucket,
  StorageBucketObject,
} from "../.gen/providers/google";
import { DataArchiveFile } from "../.gen/providers/archive";
import { resolve } from "path";
import glob from "glob";
import fs from "fs";
import { ScheduleConfig, EventConfig, FirestoreConfig, HttpConfig } from "../runtime";

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

    const { functionsDir, environment, manifestName, region, backendBucket, backendPrefix } = {
      ...defaultStackOptions,
      ...options,
    };

    // Configure the remote backend where state will be stored.
    new GcsBackend(this, {
      bucket: backendBucket,
      prefix: backendPrefix,
    });

    // Configure the Google Provider.
    new GoogleProvider(this, "GoogleAuth", {
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
        fs.readFileSync(`${functionDir}/${manifestName}`).toString(),
      );

      const artifactPath = `.build/artifacts/${manifest.name}.zip`;
      new DataArchiveFile(this, manifest.name + "zip", {
        type: "zip",
        outputPath: artifactPath,
        sourceDir: functionDir,
      });

      const object = new StorageBucketObject(this, manifest.name + "_storage_zip", {
        bucket: bucket.name,
        name: `${manifest.name}.zip`,
        source: artifactPath,
      });

      switch (manifest.type) {
        case "event":
          new TerraformHclModule(this, manifest.name + "-event", {
            source: "git@bitbucket.org:space48/terraform-modules.git//modules/subscription",
            variables: {
              bucket_name: bucket.name,
              archive_object: object.name,
              hash: object.md5Hash,
              name: manifest.name,
              environment,
              topic_name: manifest.config.topicName,
            },
          });
          break;
        case "schedule":
          new TerraformHclModule(this, manifest.name + "-schedule", {
            source: "git@bitbucket.org:space48/terraform-modules.git//modules/schedule-function",
            variables: {
              bucket_name: bucket.name,
              archive_object: object.name,
              hash: object.md5Hash,
              schedule: manifest.config.schedule,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "http":
          new TerraformHclModule(this, manifest.name + "-http", {
            source: "git@bitbucket.org:space48/terraform-modules.git//modules/http-function",
            variables: {
              bucket_name: bucket.name,
              archive_object: object.name,
              hash: object.md5Hash,
              name: manifest.name,
              environment,
            },
          });
          break;
        case "firestore":
          new TerraformHclModule(this, manifest.name + "-firestore", {
            source: "git@bitbucket.org:space48/terraform-modules.git//modules/firestore",
            variables: {
              bucket_name: bucket.name,
              archive_object: object.name,
              hash: object.md5Hash,
              name: manifest.name,
              environment,
              collection_path: manifest.config.collection,
              firestore_action: manifest.config.event ?? "create",
            },
          });
          break;
      }
    }

    generateSecrets(this);
  }
}

/**
 * Generate secrets manager secrets. These can then be access by application code.
 * This expects an optional secrets.json file to exist in the root of the project.
 * @param {Construct} scope
 */
function generateSecrets(scope: Construct) {
  // Don't generate secrets if there isn't a secrets json file.
  if (!fs.existsSync("./secrets.json")) {
    return;
  }
  const secretsFile = JSON.parse(fs.readFileSync("./secrets.json").toString());
  const secrets = Object.values(secretsFile);
  secrets.forEach((secret) => {
    if (typeof secret !== "string") {
      return;
    }
    const gcpSecret = new SecretManagerSecret(scope, secret, {
      secretId: secret,
      replication: [{ automatic: true }],
    });

    new SecretManagerSecretVersion(scope, secret + "-version", {
      secret: gcpSecret.id,
      secretData: "INITIAL_VALUE",
    });
  });
}
