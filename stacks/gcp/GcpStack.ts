import { readFileSync } from "fs";
import { join } from "path";
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import {
  CloudfunctionsFunction,
  CloudfunctionsFunctionConfig,
  CloudfunctionsFunctionIamMember,
  CloudSchedulerJob,
  CloudTasksQueue,
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
} from "@cdktf/provider-google";
import { ArchiveProvider, DataArchiveFile } from "@cdktf/provider-archive";
import { StackOptions, GcpFunction } from "./types";

export default class GcpStack extends TerraformStack {
  private options: StackOptions;
  private existingTopics: string[] = [];
  private existingQueues: string[] = [];
  private existingStaticIpVpcSubnets: string[] = [];
  constructor(scope: Construct, id: string, options: StackOptions) {
    super(scope, id);

    this.options = {
      ...options,
    };

    // Configure the Google Provider.
    new GoogleProvider(this, "Google", {
      project: this.options.gcpOptions.project,
      region: this.options.gcpOptions.region,
    });

    const functions = this.getFunctions();

    if (functions.length) {
      // Configure the Archive Provider if archives need to be generated
      new ArchiveProvider(this, "Archive");
      // Creates a storage bucket for the functions source to be uploaded to.
      const bucket = new StorageBucket(this, "FuncSourceBucket", {
        name:
          options.gcpOptions.sourceCodeStorage?.bucket?.name ||
          `${options.gcpOptions.project}-functions`,
        location: this.options.gcpOptions.region.toUpperCase(),
      });
      functions.forEach(func => this.generateFunction(func, bucket));
    }

    this.generateSecrets();
  }

  private generateFunction(func: GcpFunction, bucket: StorageBucket) {
    const functionDir = join(this.options.outDir, "functions", func.name);
    const artifactPath = join(this.options.outDir, "artifacts", `${func.name}.zip`);

    const archive = new DataArchiveFile(this, func.name + "-zip", {
      type: "zip",
      outputPath: artifactPath,
      sourceDir: functionDir,
    });

    const object = new StorageBucketObject(this, func.name + "-storage-zip", {
      bucket: bucket.name,
      name: `${func.name}-${archive.outputMd5}.zip`,
      source: artifactPath,
    });

    const envVars = this.options.envVars ?? {};

    const cloudFunc = new CloudfunctionsFunction(this, func.name, {
      name: func.name,
      runtime: func.runtime,
      timeout: func.timeout ?? 60,
      sourceArchiveBucket: bucket.name,
      sourceArchiveObject: object.name,
      availableMemoryMb: func.memory ?? 256,
      entryPoint: "default",
      maxInstances: func.maxInstances,
      minInstances: func.minInstances,
      environmentVariables: {
        NODE_ENV: this.options.environment,
        GCP_PROJECT: this.options.gcpOptions.project,
        GCP_REGION: this.options.gcpOptions.region,
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
        messageRetentionDuration: func.topicConfig?.messageRetentionDuration,
      });
      this.existingTopics.push(func.topicName);
    }

    // Create cloud scheduler job + pubsub topic.
    if (func.type === "schedule") {
      const scheduledTopic = new PubsubTopic(this, func.name + "-schedule", {
        name: "scheduled-" + func.name,
      });
      new CloudSchedulerJob(this, "scheduler-" + func.name, {
        name: func.name,
        schedule: func.schedule,
        timeZone: func.timeZone,
        pubsubTarget: {
          topicName: `projects/${this.options.gcpOptions.project}/topics/${scheduledTopic.name}`,
          data: "c2NoZWR1bGU=",
        },
      });
    }

    // Create Cloud Tasks queue if it doesn't exist already
    if (func.type === "queue" && !this.existingQueues.includes(func.name)) {
      new CloudTasksQueue(this, func.name + "-queue", {
        name: func.name,
        location: this.options.gcpOptions.region,
        rateLimits: {
          maxConcurrentDispatches: func.queueConfig?.maxConcurrentDispatches,
          maxDispatchesPerSecond: func.queueConfig?.maxDispatchesPerSecond,
        },
        retryConfig: {
          maxAttempts: func.queueConfig?.maxAttempts,
          minBackoff: func.queueConfig?.minBackoff,
          maxBackoff: func.queueConfig?.maxBackoff,
          maxDoublings: func.queueConfig?.maxDoublings,
          maxRetryDuration: func.queueConfig?.maxRetryDuration,
        },
      });
      this.existingQueues.push(func.name);
    }

    // Configure static IP constraint
    if (func.staticIp) {
      const vpcAccessConnectorCidrRange = "10.1.1.0/28";
      const vpcAccessConnectorName =
        "connector-" + vpcAccessConnectorCidrRange.replace(/\./g, "-").replace(/\/.*/, "");
      cloudFunc.vpcConnector = vpcAccessConnectorName;
      cloudFunc.vpcConnectorEgressSettings = "ALL_TRAFFIC";
      if (!this.existingStaticIpVpcSubnets.length) {
        this.configureStaticIpResources(vpcAccessConnectorName, vpcAccessConnectorCidrRange);
      }
    }
  }

  private configureHttpFunction(config: GcpFunction, func: CloudfunctionsFunction) {
    if (config.type !== "http") {
      return;
    }

    // Configure if the http function is publically invokable.
    if (config.public) {
      new CloudfunctionsFunctionIamMember(this, config.name + "-http-invoker", {
        cloudFunction: func.name,
        role: "roles/cloudfunctions.invoker",
        member: "allUsers",
      });
    }
  }

  private generateFunctionTriggerConfig(
    config: GcpFunction,
  ): Pick<CloudfunctionsFunctionConfig, "triggerHttp" | "eventTrigger"> {
    if (config.type === "http" || config.type === "queue") {
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
          config.firestoreEvent || "write"
        }`;
        resource = config.document;
        break;
      case "storage":
        eventType = `google.storage.object.${config.storageEvent || "finalize"}`;
        resource =
          config.bucket.environmentSpecific?.[this.options.environment] || config.bucket.default;
        break;
    }

    return {
      eventTrigger: {
        eventType,
        resource,
        failurePolicy: config.retryOnFailure ? { retry: config.retryOnFailure } : undefined,
      },
    };
  }

  private configureStaticIpResources(
    vpcAccessConnectorName: string,
    vpcAccessConnectorCidrRange: string,
  ) {
    const region = this.options.gcpOptions.region;
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
      });
      this.existingStaticIpVpcSubnets.push(vpcAccessConnectorCidrRange);
    }
  }

  private generateSecrets() {
    const secrets = this.options.secretNames?.filter(secret => secret.length);

    secrets?.forEach(secret => {
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

  private getFunctions(): GcpFunction[] {
    const contents = readFileSync(join(this.options.outDir, "functions.json"));
    return JSON.parse(contents.toString());
  }
}
