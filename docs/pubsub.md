# PubSub invoked Functions

If you want your function to be subscribed to a pubsub topic, you can use the `event` type in the runtimeConfig, which requires the `topicName` property which is a string defining the name of the topic you'd like to subscribe to. The pubsub topic will be created in terraform so should not already exist (unless theres another function subscribing to the same topic).

## Code sample

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
