# Space48 Functions CLI


## Using on a project:


Add the package as a dev dependency (note you'll need to authenticate with github packages).
```
npm install -D @space48/terraformer
```

Modify your build command in package.json:

```diff
-  "build": "tsc"
+  "build": "tsc && s48-terraformer build . --project=[your-project-name]"
```

Modify your `tsconfig.json` to set the outDir to `.build/dist`:
```diff
  "compilerOptions": {
+    "outDir": ".build/dist",
```

Define your first cloud function:

`src/myFirstFunction.ts`
```typescript
import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";
import type { GcpConfig } from "@space48/terraformer/dist/runtime";

const myFunction: HttpFunction = (req, res) => {
  console.log("Hello World");
  return res.sendStatus(200);
};

export default myFunction;

export const runtimeConfig: GcpConfig = {
  type: "http",
  public: true,
};
```

Then run your build command:
```
npm run build
```

To apply the terraform config you'll be able to run the following:

```
terraform init -backend-config="prefix=terraform/clients/[your-project-name]-[environment]" .build
terraform plan .build -out=plan
terraform apply plan
```

# How does this work?

Each Cloud Function you wish to define can live anywhere within the `src` directory, how you structure this is up to you.

The only thing you need to define for your function to work is the named export: `runtimeConfig`. Take a look at the `RuntimeConfig` type to see what options you have (thats in runtime.ts).


## Supported function types:

### HTTP Functions:

```typescript
import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";
import type { GcpConfig } from "@space48/terraformer/dist/runtime";

const myFunction: HttpFunction = (req, res) => {
  console.log("Hello World");
  return res.sendStatus(200);
};

export default myFunction;

export const runtimeConfig: GcpConfig = {
  type: "http",
  // Configure if the cloud function should be publically executable or not.
  public: true,
};
```

### PubSub topic subscriptions:

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/terraformer/dist/runtime";

const fn: EventFunction (data) => {
  console.log("This is a event triggered function", data);
};

export const runtimeConfig: GcpConfig = {
  type: "event",
  // By defining the topicName it will create to the topic for you.
  topicName: "hello-world",
};
```

### Scheduled functions:

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/terraformer/dist/runtime";

const fn: EventFunction = (data) => {
  console.log("This is a scheduled triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  type: "schedule",
  schedule: "* * * * *",
};
```

### Firestore collection triggers:

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/terraformer/dist/runtime";

const fn: EventFunction = (data) => {
  console.log("This is a firestore triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  type: "firestore",
  collection: "myCollection",
  // Optional event type (defaults to 'write').
  event: "create"
};
```
