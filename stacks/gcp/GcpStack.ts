import fs from "fs";
import { Construct } from "constructs";
import { GcsBackend, LocalBackend, TerraformStack } from "cdktf";
import {
  CloudfunctionsFunction,
  CloudfunctionsFunctionIamMember,
  CloudSchedulerJob,
  ComputeAddress,
  ComputeNetwork,
  ComputeRouter,
  ComputeRouterNat,
  GoogleProvider,
  PubsubTopic,
  SecretManagerSecret,
  SecretManagerSecretVersion,
  StorageBucket,
  StorageBucketObject,
  VpcAccessConnector,
} from "../../.gen/providers/google";
import { ArchiveProvider, DataArchiveFile } from "../../.gen/providers/archive";
import { GcpConfig } from "../../runtime";
import { StackOptions, GcpFunction, FunctionTriggerConfig } from "./types";
import path from "path";

// Name is always defined by the bundler, so mark as required.
type RuntimeConfig = GcpConfig & { name: string };

const defaultStackOptions: StackOptions = {
  functionsDir: ".build/functions",
  environment: "dev",
  region: "europe-west2",
};

export default class GcpStack extends TerraformStack {
  private options: StackOptions;
  private projectId: string;
  private existingTopics: string[] = [];
  private existingStaticIpVpcSubnets: string[] = [];
  constructor(scope: Construct, name: string, options: Partial<StackOptions>) {
    super(scope, name);

    this.projectId = name;
    this.options = {
      ...defaultStackOptions,
      ...options,
    };

    // If bucket is defined,
    // then configure the remote backend where state will be stored,
    // else use a local backend.
    this.options.backendBucket?.length
      ? new GcsBackend(this, {
          bucket: this.options.backendBucket,
          prefix: this.options.backendPrefix,
        })
      : new LocalBackend(this, {
          path: path.join(this.options.functionsDir, "../"),
        });

    // Configure the Google Provider.
    new GoogleProvider(this, "Google", {
      region: this.options.region,
      project: this.projectId,
    });

    // Creates a storage bucket for the functions to be uploaded to.
    const bucket = new StorageBucket(this, `${name}-functions`, {
      name: `${name}-functions`,
      location: "EU",
    });

    const functions = this.getFunctions();

    if (functions.length) {
      new ArchiveProvider(this, "Archive");
    }

    functions.forEach(func => this.generateFunction(func, bucket));

    this.generateSecrets();
  }

  private generateFunction(func: GcpFunction, bucket: StorageBucket) {
    const { functionsDir } = this.options;
    const functionDir = path.join(functionsDir, func.name);

    const artifactPath = path.join(this.options.functionsDir, `../artifacts/${func.name}.zip`);
    const archive = new DataArchiveFile(this, func.name + "zip", {
      type: "zip",
      outputPath: artifactPath.replace(/^.*\.build\//, ""),
      sourceDir: functionDir.replace(/^.*\.build\//, ""),
    });

    const object = new StorageBucketObject(this, func.name + "_storage_zip", {
      bucket: bucket.name,
      name: `${func.name}-${archive.outputMd5}.zip`,
      source: artifactPath.replace(/^.*\.build\//, ""),
    });

    const envVars = fs.existsSync("./env.json")
      ? JSON.parse(fs.readFileSync("./env.json").toLocaleString())?.[this.options.environment] ?? {}
      : {};

    const cloudFunc = new CloudfunctionsFunction(this, func.name + "-http", {
      name: func.name,
      runtime: func.runtime ?? "nodejs14",
      timeout: func.timeout ?? 60,
      sourceArchiveBucket: bucket.name,
      sourceArchiveObject: object.name,
      availableMemoryMb: func.memory ?? 256,
      entryPoint: "default",
      environmentVariables: {
        NODE_ENV: this.options.environment,
        GCP_PROJECT: this.projectId,
        ...envVars,
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
        pubsubTarget: {
          topicName: `projects/${this.projectId}/topics/${scheduledTopic.name}`,
          data: "c2NoZWR1bGU=",
        },
      });
    }

    // Configure static IP constraint
    if (func.staticIp) {
      const vpcAccessConnectorCidrRange = "10.1.1.0/28";
      const vpcAccessConnectorName =
        "static-ip-connector-" +
        vpcAccessConnectorCidrRange.replace(/\./g, "-").replace(/\/.*/, "");
      cloudFunc.vpcConnector = vpcAccessConnectorName;
      cloudFunc.vpcConnectorEgressSettings = "ALL_TRAFFIC";
      if (!this.existingStaticIpVpcSubnets.length) {
        this.configureStaticIpResources(vpcAccessConnectorName, vpcAccessConnectorCidrRange);
      }
    }
  }

  private configureHttpFunction(config: RuntimeConfig, cloudFunction: CloudfunctionsFunction) {
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
  }

  private generateFunctionTriggerConfig(config: RuntimeConfig): FunctionTriggerConfig {
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
        eventType = `providers/cloud.firestore/eventTypes/document.${
          config.firestoreEvent ?? "write"
        }`;
        resource = config.document;
        break;
      case "storage":
        eventType = `google.storage.object.${config.storageEvent ?? "finalize"}`;
        resource =
          config.bucket.environmentSpecific?.[this.options.environment] ?? config.bucket.default;
        break;
    }

    return {
      eventTrigger: { eventType, resource },
    };
  }

  private configureStaticIpResources(
    vpcAccessConnectorName: string,
    vpcAccessConnectorCidrRange: string,
  ) {
    const region = this.options.region;
    const netName = "static-ip-vpc";
    if (!this.existingStaticIpVpcSubnets.length) {
      const network = new ComputeNetwork(this, netName, {
        name: netName,
        autoCreateSubnetworks: false,
      });
      const staticIp = new ComputeAddress(this, "static-ip", {
        name: "static-ip",
        addressType: "EXTERNAL",
        region,
      });
      const router = new ComputeRouter(this, "static-ip-router", {
        name: "static-ip-router",
        network: network.id,
        region,
      });
      new ComputeRouterNat(this, "static-ip-nat", {
        name: "static-ip-nat",
        router: router.name,
        region: router.region,
        natIpAllocateOption: "MANUAL_ONLY",
        sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
        natIps: [staticIp.selfLink],
      });
    }
    if (!this.existingStaticIpVpcSubnets.includes(vpcAccessConnectorCidrRange)) {
      new VpcAccessConnector(this, vpcAccessConnectorName, {
        name: vpcAccessConnectorName,
        network: netName,
        ipCidrRange: vpcAccessConnectorCidrRange,
        region,
        minThroughput: 200,
        maxThroughput: 300,
      });
      this.existingStaticIpVpcSubnets.push(vpcAccessConnectorCidrRange);
    }
  }

  /**
   * Generate secrets manager secrets. These can then be access by application code.
   * This expects an optional secrets.json file to exist in the root of the project.
   */
  private generateSecrets() {
    // Don't generate secrets if there isn't a secrets json file.
    if (!fs.existsSync("./secrets.json")) {
      return;
    }

    const secrets = JSON.parse(fs.readFileSync("./secrets.json").toString()) as string[];
    secrets.forEach(secret => {
      if (typeof secret !== "string") {
        return;
      }

      const gcpSecret = new SecretManagerSecret(this, secret, {
        secretId: secret,
        replication: { automatic: true },
      });

      new SecretManagerSecretVersion(this, secret + "-version", {
        secret: gcpSecret.id,
        secretData: "INITIAL_VALUE_DO_NOT_DELETE",
      });
    });
  }

  private getFunctions(): (RuntimeConfig & { file: string; name: string })[] {
    const contents = fs.readFileSync(path.join(this.options.functionsDir, "../functions.json"));
    return JSON.parse(contents.toString());
  }
}
