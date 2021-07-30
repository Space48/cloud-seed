import fs from "fs";
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
import { BigcommerceProvider, Webhook } from "../../.gen/providers/bigcommerce";
import { GcpConfig } from "../../runtime";
import { StackOptions, GcpFunction, FunctionTriggerConfig } from "./types";
import path from "path";

// Name is always defined by the bundler, so mark as required.
type RuntimeConfig = GcpConfig & { name: string };

const defaultStackOptions: StackOptions = {
  functionsDir: ".build/functions",
  environment: "dev",
  region: "europe-west2",
  backendBucket: "s48-terraform-state",
  envVars: {},
};

export default class GcpStack extends TerraformStack {
  private options: StackOptions;
  private projectId: string;
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

    const hasWebhooks =
      functions.filter((func) => func.type === "http" && func.webhook?.type === "bigcommerce")
        .length > 0;

    if (hasWebhooks) {
      new BigcommerceProvider(this, "bigcommerce");
    }

    functions.forEach((func) => this.generateFunction(func, bucket));

    this.generateSecrets();
  }

  generateFunction(func: GcpFunction, bucket: StorageBucket) {
    const { functionsDir } = this.options;
    const functionDir = `${functionsDir}/${func.name}`;

    const artifactPath = path.join(this.options.functionsDir, `../artifacts/${func.name}.zip`);
    const archive = new DataArchiveFile(this, func.name + "zip", {
      type: "zip",
      outputPath: artifactPath,
      sourceDir: functionDir,
    });

    const object = new StorageBucketObject(this, func.name + "_storage_zip", {
      bucket: bucket.name,
      name: `${func.name}-${archive.outputMd5}.zip`,
      source: artifactPath,
    });

    const cloudFunc = new CloudfunctionsFunction(this, func.name + "-http", {
      name: func.name,
      runtime: func.runtime ?? "nodejs12",
      timeout: func.timeout,
      sourceArchiveBucket: bucket.name,
      sourceArchiveObject: object.name,
      availableMemoryMb: func.memory ?? 128,
      entryPoint: "default",
      environmentVariables: {
        GCP_PROJECT: this.projectId,
        ...this.options.envVars,
      },

      ...this.generateFunctionTriggerConfig(func),
    });

    if (func.type === "http") {
      this.configureHttpFunction(func, cloudFunc);
    }

    // Create pubsub topics if they don't exist already.
    if (func.type === "event" && !this.existingTopics.includes(func.topicName)) {
      new PubsubTopic(this, func.topicName, {
        name: func.topicName,
      });
      this.existingTopics.push(func.topicName);
    }

    // Create cloud scheduler job + pubsub topic.
    if (func.type === "schedule") {
      const scheduledTopic = new PubsubTopic(this, func.name + "-schedule", {
        name: "scheduled-" + func.name,
      });
      new CloudSchedulerJob(this, func.name, {
        name: func.name,
        schedule: func.schedule,
        pubsubTarget: [
          {
            topicName: scheduledTopic.name,
          },
        ],
      });
    }
  }

  configureHttpFunction(config: RuntimeConfig, cloudFunction: CloudfunctionsFunction) {
    if (config.type !== "http") {
      return;
    }

    // Configure if the http function is publically invokable.
    if (config.public) {
      new CloudfunctionsFunctionIamMember(this, config.name + "-http-invoker", {
        cloudFunction: config.name,
        role: "roles/cloudfunctions.invoker",
        member: "allUsers",
      });
    }

    // BigCommerce Webhook support.
    if (config.webhook?.type === "bigcommerce") {
      config.webhook.scopes.forEach((scope, index) => {
        new Webhook(this, `${config.name}-webhook-${index}`, {
          scope,
          destination: cloudFunction.httpsTriggerUrl,
          isActive: true,
        });
      });
    }
  }

  generateFunctionTriggerConfig(config: RuntimeConfig): FunctionTriggerConfig {
    if (config.type === "http") {
      return {
        triggerHttp: true,
      };
    }

    let eventType = "providers/cloud.pubsub/eventTypes/topic.publish";
    let resource: string;
    switch (config.type) {
      case "event":
        resource = config.topicName;
        break;
      case "schedule":
        resource = "scheduled-" + config.name;
        break;
      case "firestore":
        const event = config.event ?? "write";
        eventType = `providers/cloud.firestore/eventTypes/document.${event}`;
        resource = `project/${this.projectId}/databases/(default)/documents/${config.collection}`;
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
        secretId: secret,
        replication: [{ automatic: true }],
      });

      new SecretManagerSecretVersion(this, secret + "-version", {
        secret: gcpSecret.id,
        secretData: "INITIAL_VALUE",
      });
    });
  }

  getFunctions(): (RuntimeConfig & { file: string; name: string })[] {
    const contents = fs.readFileSync(path.join(this.options.functionsDir, "../functions.json"));
    return JSON.parse(contents.toString());
  }
}
