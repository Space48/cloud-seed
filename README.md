# Cloud Seed

## Using on a project:

Add the package as a dev dependency (note you'll need to authenticate with github packages).
```
npm install -D @space48/cloud-seed
```

Define your first cloud function:

`src/myFirstFunction.ts`
```typescript
import { HttpFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "@space48/cloud-seed";

const myFunction: HttpFunction = (req, res) => {
  console.log("Hello World");
  return res.sendStatus(200);
};

export default myFunction;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  public: true,
};
```

Then run your build command:
```
npx @space48/cloud-seed build
```

To apply the terraform config you'll be able to run the following:

```
terraform chdir=[buildDir] init
terraform chdir=[buildDir] plan -out=plan
terraform chdir=[buildDir] apply plan
```

# How does this work?

Each Cloud Function you wish to define can live anywhere within the `src` directory, how you structure this is up to you.

The only thing you need to define for your function to work is the named export: `runtimeConfig`. Take a look at the `RuntimeConfig` type to see what options you have (thats in runtime.ts).


## Supported function types:

### HTTP Functions:

```typescript
import { HttpFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const myFunction: HttpFunction = (req, res) => {
  console.log("Hello World");
  return res.sendStatus(200);
};

export default myFunction;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  // Configure if the cloud function should be publically executable or not.
  public: true,
};
```

### PubSub topic subscriptions:

```typescript
import { CloudEventFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const fn: CloudEventFunction (data) => {
  console.log("This is a event triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "event",
  // By defining the topicName it will create the topic for you.
  topicName: "hello-world",
};
```

### Scheduled functions:

```typescript
import { CloudEventFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const fn: CloudEventFunction = (data) => {
  console.log("This is a scheduled triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "schedule",
  schedule: "* * * * *",
};
```

### Queues:

```typescript
import { HttpFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const fn: HttpFunction = (req, res) => {
  console.log(req.body);
  return res.sendStatus(200);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "queue",
};
```

### Firestore document triggers:

```typescript
import { CloudEventFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const fn: CloudEventFunction = (data) => {
  console.log("This is a firestore triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "firestore",
  document: "collection/{doc}",
  // Optional event type (defaults to 'write').
  firestoreEvent: "create"
};
```

### Cloud Storage triggers

```typescript
import { CloudEventFunction } from "@google-cloud/functions-framework";
import type { GcpConfig } from "@space48/cloud-seed";

const fn: CloudEventFunction = (data) => {
  console.log("This is a cloud storage triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "storage",
  bucket: {
    default: "myBucket",
    // optional environment-specific buckets
    environmentSpecific: {
      production: "myProdBucket",
      ...
    },
  },
  // Optional event type (defaults to 'finalize').
  storageEvent: "finalize"
};
```

## Setting up a config file:

You can set the cloud seed config by adding a `cloudseed.json` file in the project root directory. An example is provided below:
```json
{
  "$schema": "./node_modules/@space48/cloud-seed/schemas/cloudseed.schema.json",
  "default": {
    "cloud": {
      "gcp": {
        "region": "europe-west2"
      }
    },
    "buildConfig": {
      "dir": "./src",
      "outDir": "./.build",
    },
    "secretVariableNames": [
      "apiKey1",
      "apiKey2"
    ]
  },
  "environmentOverrides": {
    "staging": {
      "cloud": {
        "gcp": {
          "project": "example-project-staging"
        }
      },
      "tfConfig": {
        "backend": {
          "type": "gcs",
          "backendOptions": {
            "bucket": "example-backend-bucket",
            "prefix": "path/to/staging/statefile/directory"
          }
        }
      },
      "runtimeEnvironmentVariables": {
        "FOO": "Staging1",
        "BAR": "Staging2"
      }
    },
    "production": {
      "cloud": {
        "gcp": {
          "project": "example-project-production"
        }
      },
      "tfConfig": {
        "backend": {
          "type": "gcs",
          "backendOptions": {
            "bucket": "example-backend-bucket",
            "prefix": "path/to/production/statefile/directory"
          }
        }
      },
      "runtimeEnvironmentVariables": {
        "FOO": "Prod1",
        "BAR": "Prod2"
      }
    }
  }
}
```

## JavaScript API

This package can also be called via a JS API.

```typescript
import { build, BaseConfig } from "@space48/cloud-seed";
import GoogleProvider from "@cdktf/provider-google";
import { GcsBackend, TerraformStack } from "cdktf";
import { Construct } from "constructs";

class CustomStack extends TerraformStack {
  constructor(scope: Construct, id: string, options: BaseConfig) {
    super(scope, id);
    options.tfConfig.backend.type === "gcs" && new GcsBackend(this, {
      bucket: options.tfConfig.backend.backendOptions.bucket,
      prefix: options.tfConfig.backend.backendOptions.prefix + "-custom-stack",
    });
    new GoogleProvider.GoogleProvider(this, "Google", {
      region: options.cloud.gcp.region,
      project: options.cloud.gcp.project,
    });

    /**
     * Example infrastructure
     */
    new GoogleProvider.StorageBucket(this, "CustomBucket", {
      name: `my-custom-bucket-${process.env.ENVIRONMENT}`,
      location: options.cloud.gcp.region.toUpperCase(),
      storageClass: "STANDARD",
      uniformBucketLevelAccess: true,
    });
  }
}

// build() is the same as per the CLI command, and returns the parsed Cloud Seed config and the app construct
const { config, app } = build({ environment: process.env.ENVIRONMENT });

new CustomStack(app, "CustomStack", config);

app.synth();
```
# Cloud functions gen 2
It is recommended by google to use the [gen 2](https://cloud.google.com/functions/docs/concepts/version-comparison) functions wherever possible.

The cloud-seed `v1.3.6-alpha` is an upgraded version to use gen 2 functions, which is still in alpha stage. This is currently being used in [Sneakers-n-stuff](https://bitbucket.org/space48/sneakersnstuff-backend).

If you upgrade a project, that is using an older version of cloud-seed (ex:`v1.3.0` is the latest stable version) to the `1.3.6-alpha` version, all the existing cloud functions (which use older `csktf` npm modules) will be deleted and recreated. This can lead to an issue as functions/topics/secrets can't be created with the same name for 7 days, when they get deleted. Therefore upgrading a project that uses cloud-seed, has to be done cautiously.

But for a new project it is recommended to use the `1.3.6-alpha` version with gen 2 functions support.

### Add a cloud 2 function
The structure is similar to what is explained above. But in runtime config add `version: "gen2"`

```typescript
export const runtimeConfig: GcpConfig = {
  runtime: "nodejs18",
  cloud: "gcp",
  type: "schedule",
  schedule: "0 0 * * *",
  memory: 2048,
  timeout: 540,
  version: "gen2",
};
```

If a version is not given, the function will be automatically added as a gen 1.

### prerequisites

- __`python` and `make` should be installed in the build server__

1. add to the bitbucket pipeline build step

```yaml
 - step: &build
        name: "Build"
        caches:
          - npm
        script:
          # Install Python and Make
          - chmod +x ./bitbucket-pipelines/install_python_and_make.sh
          - ./bitbucket-pipelines/install_python_and_make.sh
```

2. Add a new bash script: `install_python_and_make.sh`

```bash
#!/bin/bash
apt update && apt -y install python3 && apt -y install build-essential
```


# Licence and acknowledgements

This project is licenced under the MIT License.

The authors wish to acknowledge our collaboration with the open-source Cloud Seed project by user `MNahad`, and that certain features in our project are derived from it.
