import fs from "fs";
import crypto from "crypto";
import { Construct } from "constructs";
import { GcsBackend, TerraformStack } from "cdktf";
import {
  CloudfunctionsFunction,
  CloudfunctionsFunctionIamMember,
  CloudSchedulerJob,
  GoogleProvider,
  PubsubTopic,
  SecretManagerSecret,
  SecretManagerSecretVersion,
  StorageBucket,
  StorageBucketObject,
} from "../../.gen/providers/google";
import { DataArchiveFile } from "../../.gen/providers/archive";
import { GcpConfig } from "../../runtime";
import { StackOptions, GcpFunction, Manifest, FunctionTriggerConfig } from "./types";

const defaultStackOptions: StackOptions = {
  functionsDir: ".build/functions",
  manifestName: "s48-manifest.json",
  environment: "dev",
  region: "europe-west2",
  backendBucket: "s48-terraform-state",
};

export default class GcpStack extends TerraformStack {
  private options: StackOptions;
  private projectId?: string;
  private existingTopics: string[] = [];
  constructor(scope: Construct, name: string, options: Partial<StackOptions>) {
    super(scope, name);

    this.projectId = name;
    this.options = {
      ...defaultStackOptions,
      ...options,
    };

    // Configure the remote backend where state will be stored.
    new GcsBackend(this, {
      bucket: this.options.backendBucket,
      prefix: this.options.backendPrefix,
    });

    // Configure the Google Provider.
    new GoogleProvider(this, "GoogleAuth", { region: this.options.region });

    // Creates a storage bucket for the functions to be uploaded to.
    const bucket = new StorageBucket(this, `${name}-functions`, {
      name: `${name}-functions`,
    });

    const functions = this.getFunctions();
    functions.forEach((func) => this.generateFunction(func, bucket));

    this.generateSecrets();
  }

  generateFunction(func: GcpFunction, bucket: StorageBucket) {
    const { functionsDir, manifestName } = this.options;
    const functionDir = `${functionsDir}/${func.functionName}`;
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

    new CloudfunctionsFunction(this, manifest.name + "-http", {
      name: manifest.name,
      runtime: manifest.config.runtime ?? "nodejs12",
      timeout: manifest.config.timeout,
      sourceArchiveBucket: bucket.name,
      sourceArchiveObject: object.name,
      availableMemoryMb: manifest.config.memory ?? 128,
      entryPoint: "default",
      labels: {
        "s48-hash": crypto.createHash("md5").update(object.md5Hash).digest("hex"),
      },

      ...this.generateFunctionTriggerConfig(manifest),
    });

    // Configure if the http function is publically invokable.
    if (manifest.type === "http" && manifest.config.public) {
      new CloudfunctionsFunctionIamMember(this, manifest.name + "-http-invoker", {
        cloudFunction: manifest.name,
        role: "roles/cloudfunctions.invoker",
        member: "allUsers",
      });
    }

    // Create pubsub topics if they don't exist already.
    if (manifest.type === "event" && !this.existingTopics.includes(manifest.config.topicName)) {
      new PubsubTopic(this, manifest.config.topicName, {
        name: manifest.config.topicName,
      });
      this.existingTopics.push(manifest.config.topicName);
    }

    // Create cloud scheduler job + pubsub topic.
    if (manifest.type === "schedule") {
      const scheduledTopic = new PubsubTopic(this, manifest.name + "-schedule", {
        name: "scheduled-" + manifest.name,
      });
      new CloudSchedulerJob(this, manifest.name, {
        name: manifest.name,
        schedule: manifest.config.schedule,
        pubsubTarget: [
          {
            topicName: scheduledTopic.name,
          },
        ],
      });
    }
  }

  generateFunctionTriggerConfig(manifest: Manifest): FunctionTriggerConfig {
    if (manifest.type === "http") {
      return {
        triggerHttp: true,
      };
    }

    let eventType = "providers/cloud.pubsub/eventTypes/topic.publish";
    let resource: string;
    switch (manifest.type) {
      case "event":
        resource = manifest.config.topicName;
        break;
      case "schedule":
        resource = "scheduled-" + manifest.name;
        break;
      case "firestore":
        const event = manifest.config.event ?? "write";
        eventType = `providers/cloud.firestore/eventTypes/document.${event}`;
        resource = `project/${this.projectId}/databases/(default)/documents/${manifest.config.collection}`;
        break;
    }

    return {
      eventTrigger: [{ eventType, resource }],
    };
  }

  /**
   * Generate secrets manager secrets. These can then be access by application code.
   * This expects an optional secrets.json file to exist in the root of the project.
   */
  generateSecrets() {
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

      const gcpSecret = new SecretManagerSecret(this, secret, {
        secretId: `${this.options.environment}/${secret}`,
        replication: [{ automatic: true }],
      });

      new SecretManagerSecretVersion(this, secret + "-version", {
        secret: gcpSecret.id,
        secretData: "INITIAL_VALUE",
      });
    });
  }

  getFunctions(): (GcpConfig & { functionPath: string; functionName: string })[] {
    const contents = fs.readFileSync("./.build/compiled/functions.json");
    return JSON.parse(contents.toString());
  }
}
