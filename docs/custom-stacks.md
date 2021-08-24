# Custom Stacks.

Custom stacks allows a developer on a project to create their own stacks and produce terraform code. This could be used to fulfil business-specific requirements that Cloud Seed cannot. For example, more bespoke alerts could be configured here.

## How it works.

You'll need to create a `stacks` directory, and within here your custom stacks will live.

Below is an example of a custom stack, which creates a GCS bucket:

```typescript
// filename: stacks/MyStack.ts
import CustomStack, { StackOptions } from "@space48/cloud-seed/dist/stacks/CustomStack";
import { GoogleProvider, StorageBucket } from "@space48/cloud-seed/.gen/providers/google"
import { Construct } from "constructs";

export default class MyStack extends CustomStack {
  constructor(scope: Construct, name: string, options: StackOptions) {
    super(scope, name, options);
    // Configure the Google Provider.
    new GoogleProvider(this, "GoogleAuth", {
      region: options.region,
      project: options.project,
    });

    new StorageBucket(this, "my-bucket", {
      name: "ashs-test-bucket-yo",
    });
  }
}
```

When you run the cloud-seed build command you'll see the `.build/stacks` directory, which will now contain two directories one for the main project and another for your custom stack:

```
.build
└── stacks
    ├── garden-trading-staging
    │   └── cdk.tf.json
    └── garden-trading-staging-MyStack
        └── cdk.tf.json
```

Each of these directories contain a `cdk.tf.json` which you can plan/apply terraform against:

```
# Plan for main cloud seed project:
terraform -chdir=.build/stacks/garden-trading-staging init -backend-config="prefix=terraform/clients/garden-trading-staging"
terraform -chdir=.build/stacks/garden-trading-staging plan -out=plan

# Plan for custom stack project:
terraform -chdir=.build/stacks/garden-trading-staging-MyStack init -backend-config="prefix=terraform/clients/garden-trading-staging-MyStack"
terraform -chdir=.build/stacks/garden-trading-staging-MyStack plan -out=plan
```

Note the backend-config prefix MUST be different to the main cloud seed project:
```
# Added -MyStack to the prefix value.
-backend-config="prefix=terraform/clients/garden-trading-staging-MyStack"
```