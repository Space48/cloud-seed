# Cloud Storage invoked Functions

This allows you to invoke functions in response to events within Google Cloud Storage such as: finalize, delete, archive or metadataUpdate.

Parameters:

- `type` must be `"storage"`
- `bucket` the name of the bucket.
- Optional: `event` can be one of: `finalize` (default), `delete`, `archive` or `metadataUpdate`

## Code sample

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/cloud-seed";

const fn: EventFunction = (data) => {
  console.log("This is a cloud storage triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "storage",
  bucket: "myBucket",
  // Optional event type (defaults to 'finalize').
  storageEvent: "finalize"
};
```