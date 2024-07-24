import { readFileSync } from "fs";
import { join } from "path";
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import {
  cloudfunctionsFunction,
  cloudfunctions2Function,
  cloudfunctionsFunctionIamMember,
  cloudfunctions2FunctionIamMember,
  cloudSchedulerJob,
  cloudTasksQueue,
  computeAddress,
  computeNetwork,
  computeRouter,
  computeRouterNat,
  provider as googleProvider,
  pubsubTopic,
  secretManagerSecret,
  secretManagerSecretVersion,
  storageBucket,
  storageBucketObject,
  vpcAccessConnector,
  cloudRunServiceIamMember,
} from "@cdktf/provider-google";
import { provider as archiveProvider, dataArchiveFile } from "@cdktf/provider-archive";
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
    new googleProvider.GoogleProvider(this, "Google", {
      project: this.options.gcpOptions.project,
      region: this.options.gcpOptions.region,
    });

    const functions = this.getFunctions();

    if (functions.length) {
      // Configure the Archive Provider if archives need to be generated
      new archiveProvider.ArchiveProvider(this, "Archive");
      // Creates a storage bucket for the functions source to be uploaded to.
      const bucket = new storageBucket.StorageBucket(this, "FuncSourceBucket", {
        name:
          options.gcpOptions.sourceCodeStorage?.bucket?.name ||
          `${options.gcpOptions.project}-functions`,
        location: this.options.gcpOptions.region.toUpperCase(),
      });
      functions.forEach(func => this.generateFunction(func, bucket));
    }

    this.generateSecrets();
  }

  private generateFunction(func: GcpFunction, bucket: storageBucket.StorageBucket) {
    const functionDir = join(this.options.outDir, "functions", func.name);
    const artifactPath = join(this.options.outDir, "artifacts", `${func.name}.zip`);

    const archive = new dataArchiveFile.DataArchiveFile(this, func.name + "-zip", {
      type: "zip",
      outputPath: artifactPath,
      sourceDir: functionDir,
    });

    const object = new storageBucketObject.StorageBucketObject(this, func.name + "-storage-zip", {
      bucket: bucket.name,
      name: `${func.name}-${archive.outputMd5}.zip`,
      source: artifactPath,
    });

    const envVars = this.options.envVars ?? {};

    let cloudFunc;
    let scheduledTopic;
    // Create cloud scheduler pubsub topic.
    if (func.type === "schedule") {
      scheduledTopic = new pubsubTopic.PubsubTopic(this, func.name + "-schedule", {
        name: "scheduled-" + func.name,
      });
    }

    const environmentVariables = {
      CLOUD_SEED_ENVIRONMENT: this.options.environment,
      CLOUD_SEED_PROJECT: this.options.gcpOptions.project,
      CLOUD_SEED_REGION: this.options.gcpOptions.region,
      ...envVars,
    };

    if (func.version === "gen1") {
      cloudFunc = new cloudfunctionsFunction.CloudfunctionsFunction(this, func.name, {
        name: func.name,
        runtime: func.runtime,
        timeout: func.timeout ?? 60,
        sourceArchiveBucket: bucket.name,
        sourceArchiveObject: object.name,
        availableMemoryMb: func.memory ?? 256,
        entryPoint: "default",
        maxInstances: func.maxInstances,
        minInstances: func.minInstances,
        environmentVariables,

        ...this.generateFunctionTriggerConfig(func),
      });
      if (func.type === "http") {
        this.configureHttpFunction(func, cloudFunc);
      }
    } else {
      cloudFunc = new cloudfunctions2Function.Cloudfunctions2Function(this, func.name, {
        name: func.name,
        buildConfig: {
          runtime: func.runtime,
          source: { storageSource: { bucket: bucket.name, object: object.name } },
          environmentVariables,
          entryPoint: "default",
        },
        serviceConfig: {
          availableMemory: func.memory?.toString().concat("M") ?? "256M",
          timeoutSeconds: func.timeout ?? 60,
          maxInstanceCount: func.maxInstances,
          minInstanceCount: func.minInstances,
          environmentVariables,
        },
        location: this.options.gcpOptions.region,
        ...this.generateFunction2TriggerConfig(func, scheduledTopic),
      });
      if (func.type === "http") {
        this.configureHttpFunction2(func, cloudFunc);
      }
      if (func.type === "scheduledJob") {
        this.configureScheduledHttpFunction2(func, cloudFunc);
      }
    }

    // Create pubsub topics if they don't exist already.
    if (func.type === "event" && !this.existingTopics.includes(func.topicName)) {
      new pubsubTopic.PubsubTopic(this, func.topicName, {
        name: func.topicName,
        messageRetentionDuration: func.topicConfig?.messageRetentionDuration,
      });
      this.existingTopics.push(func.topicName);
    }

    // Create cloud scheduler job.
    if (func.type === "schedule" && scheduledTopic) {
      new cloudSchedulerJob.CloudSchedulerJob(this, "scheduler-" + func.name, {
        name: func.name,
        schedule: func.schedule,
        timeZone: func.timeZone,
        pubsubTarget: {
          topicName: `projects/${this.options.gcpOptions.project}/topics/${scheduledTopic.name}`,
          data: "c2NoZWR1bGU=",
        },
      });
    }

    if (func.type === "scheduledJob" && func.version !== "gen1") {
      new cloudSchedulerJob.CloudSchedulerJob(this, "scheduler-" + func.name, {
        name: func.name,
        schedule: func.schedule,
        attemptDeadline: func.attemptDeadline || "3m",
        timeZone: func.timeZone,
        httpTarget: {
          uri: (cloudFunc as cloudfunctions2Function.Cloudfunctions2Function).serviceConfig.uri,
          httpMethod: "POST",
        },
      });
    }

    // Create Cloud Tasks queue if it doesn't exist already
    if (func.type === "queue" && !this.existingQueues.includes(func.name)) {
      new cloudTasksQueue.CloudTasksQueue(this, func.name + "-queue", {
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
      if (cloudFunc instanceof cloudfunctionsFunction.CloudfunctionsFunction) {
        cloudFunc.vpcConnector = vpcAccessConnectorName;
        cloudFunc.vpcConnectorEgressSettings = "ALL_TRAFFIC";
      } else {
        cloudFunc.serviceConfig.vpcConnector = vpcAccessConnectorName;
        cloudFunc.serviceConfig.vpcConnectorEgressSettings = "ALL_TRAFFIC";
      }
      if (!this.existingStaticIpVpcSubnets.length) {
        this.configureStaticIpResources(vpcAccessConnectorName, vpcAccessConnectorCidrRange);
      }
    }
  }

  private configureHttpFunction2(
    config: GcpFunction,
    func: cloudfunctions2Function.Cloudfunctions2Function,
  ) {
    if (config.type !== "http") {
      return;
    }

    // Configure if the http function is publically invokable.
    if (config.public) {
      new cloudfunctions2FunctionIamMember.Cloudfunctions2FunctionIamMember(
        this,
        config.name + "-http-invoker",
        {
          cloudFunction: func.name,
          role: "roles/cloudfunctions.invoker",
          member: "allUsers",
        },
      );

      new cloudRunServiceIamMember.CloudRunServiceIamMember(
        this,
        config.name + "-http-run-invoker",
        {
          service: func.serviceConfig.service,
          role: "roles/run.invoker",
          member: "allUsers",
        },
      );
    }
  }

  private configureScheduledHttpFunction2(
    config: GcpFunction,
    func: cloudfunctions2Function.Cloudfunctions2Function,
  ) {
    if (config.type !== "scheduledJob") {
      return;
    }

    // Configure invoke permissions for the http function.
    new cloudfunctions2FunctionIamMember.Cloudfunctions2FunctionIamMember(
      this,
      config.name + "-http-invoker",
      {
        cloudFunction: func.name,
        role: "roles/cloudfunctions.invoker",
        member: "allUsers",
      },
    );

    new cloudRunServiceIamMember.CloudRunServiceIamMember(this, config.name + "-http-run-invoker", {
      service: func.serviceConfig.service,
      role: "roles/run.invoker",
      member: "allUsers",
    });
  }

  private configureHttpFunction(
    config: GcpFunction,
    func: cloudfunctionsFunction.CloudfunctionsFunction,
  ) {
    if (config.type !== "http") {
      return;
    }

    // Configure if the http function is publically invokable.
    if (config.public) {
      new cloudfunctionsFunctionIamMember.CloudfunctionsFunctionIamMember(
        this,
        config.name + "-http-invoker",
        {
          cloudFunction: func.name,
          role: "roles/cloudfunctions.invoker",
          member: "allUsers",
        },
      );
    }
  }

  private generateFunction2TriggerConfig(
    config: GcpFunction,
    scheduledTopic?: pubsubTopic.PubsubTopic,
  ): Pick<cloudfunctions2Function.Cloudfunctions2FunctionConfig, "eventTrigger"> {
    const retryPolicy =
      config.retryOnFailure === undefined
        ? "RETRY_POLICY_UNSPECIFIED"
        : config.retryOnFailure
        ? "RETRY_POLICY_RETRY"
        : "RETRY_POLICY_DO_NOT_RETRY";

    switch (config.type) {
      case "queue":
      case "http":
      case "scheduledJob":
        return {};
      case "storage":
        return {
          eventTrigger: {
            eventType: `google.cloud.storage.object.v1.${this.updateCloudStorageTriggerKeyWordsTo2ndGen(
              config.storageEvent,
            )}`,
            retryPolicy,
            eventFilters: [
              {
                attribute: "bucket",
                value:
                  config.bucket.environmentSpecific?.[this.options.environment] ||
                  config.bucket.default,
              },
            ],
          },
        };

      case "firestore":
        return {
          eventTrigger: {
            eventType: `google.cloud.firestore.document.v1.${this.updateFirestoreTriggerKeyWordsTo2ndGen(
              config.firestoreEvent,
            )}`,
            retryPolicy,
            eventFilters: [
              {
                attribute: "database",
                value: config.document,
              },
            ],
          },
        };

      case "event":
        return {
          eventTrigger: {
            eventType: "google.cloud.pubsub.topic.v1.messagePublished",
            retryPolicy,
            pubsubTopic: `projects/${this.options.gcpOptions.project}/topics/${config.topicName}`,
          },
        };

      case "schedule":
        return {
          eventTrigger: {
            eventType: "google.cloud.pubsub.topic.v1.messagePublished",
            retryPolicy,
            pubsubTopic: `projects/${this.options.gcpOptions.project}/topics/${scheduledTopic?.name}`,
          },
        };
    }
  }

  private updateFirestoreTriggerKeyWordsTo2ndGen(actionKey?: string) {
    switch (actionKey) {
      case "create":
        return "created";
      case "update":
        return "updated";
      case "delete":
        return "deleted";
      case "write":
        return "written";
      default:
        return "written";
    }
  }

  private updateCloudStorageTriggerKeyWordsTo2ndGen(actionKey?: string) {
    switch (actionKey) {
      case "finalize":
        return "finalized";
      case "archive":
        return "archived";
      case "delete":
        return "deleted";
      case "metadataUpdate":
        return "metadataUpdated";
      default:
        return "finalized";
    }
  }

  private generateFunctionTriggerConfig(
    config: GcpFunction,
  ): Pick<cloudfunctionsFunction.CloudfunctionsFunctionConfig, "triggerHttp" | "eventTrigger"> {
    if (config.type === "http" || config.type === "queue") {
      return {
        triggerHttp: true,
      };
    }

    let eventType = "providers/cloud.pubsub/eventTypes/topic.publish";
    let resource = "";
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
      const network = new computeNetwork.ComputeNetwork(this, netName, {
        name: netName,
        autoCreateSubnetworks: false,
      });
      const staticIp = new computeAddress.ComputeAddress(this, "static-ip", {
        name: "static-ip",
        addressType: "EXTERNAL",
        region,
      });
      const router = new computeRouter.ComputeRouter(this, "static-ip-router", {
        name: "static-ip-router",
        network: network.id,
        region,
      });
      new computeRouterNat.ComputeRouterNat(this, "static-ip-nat", {
        name: "static-ip-nat",
        router: router.name,
        region: router.region,
        natIpAllocateOption: "MANUAL_ONLY",
        sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
        natIps: [staticIp.selfLink],
      });
    }
    if (!this.existingStaticIpVpcSubnets.includes(vpcAccessConnectorCidrRange)) {
      new vpcAccessConnector.VpcAccessConnector(this, vpcAccessConnectorName, {
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
      const gcpSecret = new secretManagerSecret.SecretManagerSecret(this, secret, {
        secretId: secret,
        replication: { auto: {} },
      });

      new secretManagerSecretVersion.SecretManagerSecretVersion(this, secret + "-version", {
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
