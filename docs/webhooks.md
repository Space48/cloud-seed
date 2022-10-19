# Functions to be triggered by webhooks

If you want your function to be triggered by a webhook, you can use the `webhook` type in the runtimeConfig. This requires the `webhook` property which is an object defining 
- webhook type (eg bigcommerce)
- webhook scope

## Code Sample:

```typescript
import { CloudEventFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";

const test: CloudEventFunction = async event => {
  console.log("success");
};
export default test;

export const runtimeConfig: GcpConfig = {
  runtime: "nodejs14",
  cloud: "gcp",
  type: "webhook",
  webhook: {
    type: "bigcommerce",
    scope: "store/category/created",
  },
};
```