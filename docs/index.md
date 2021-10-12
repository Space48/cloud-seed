# Cloud Seed Documentation

Welcome to Cloud Seed! A CLI tool for building serverless applications.

## Getting started:

```
# Install globally on your machine:
npm install -g @space48/cloud-seed

# Install as a dev dependency.
npm install -D @space48/cloud-seed
```

## Starting a new project:

Add required dependencies:

```
npm init
npm install -D @space48/cloud-seed @types/express @types/jest @types/node typescript
npm install @google-cloud/functions-framework @google-cloud/secret-manager
```

Add build script to `package.json`:

```diff
  scripts: {
+    "build": "rimraff .build && cloud-seed build . --project=[YOUR_PROJECT_NAME]",
    ...
  },
```

Create your first function: `src/helloWorldHttp.ts`

```typescript
import { GcpConfig } from "@space48/cloud-seed";
import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";

const handler: HttpFunction = (req, res) => {
  return res.status(200).send(JSON.stringify({ message: "Hello World!" }));
};

export default handler;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  public: true,
};
```

More information, see:

- [Creating HTTP Functions](./http.md)
- [Creating BigCommerce Webhooks invoked Functions](./webhooks.md)
- [Creating PubSub Topics and Subscriptions](./pubsub.md)
- [Creating Scheduled Functions](./scheduled.md)
- [Creating Firestore triggered Functions](./firestore.md)
- [Creating Cloud Storage triggered Functions](./storage.md)
- [Creating Secrets](./secrets.md)