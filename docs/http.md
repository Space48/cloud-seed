# HTTP Invoked Functions

## Code Sample:

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
  public: true, // Should it be pubically callable?
};
```