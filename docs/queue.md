# Queue Functions

If you want your function to be triggered by a Cloud Tasks queue, you can use the `queue` type in the runtimeConfig.

## Code sample

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
