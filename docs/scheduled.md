# Scheduled Functions

If you wish to have a function that is triggered by cron, you can use the `"schedule"` type for runtimeConfig which required the `schedule` property. The `schedule` property accepts a valid cron expression.

## Code sample

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/cloud-seed";

const fn: EventFunction = (data) => {
  console.log("This is a scheduled triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "schedule",
  schedule: "* * * * *",
};
```
