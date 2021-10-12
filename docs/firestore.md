# Firestore invoked Functions

This allows you to invoke functions in response to events within Firestore such as: write, create, update or delete.

Parameters:

- `type` must be `"firestore"`
- `collection` the name of the firestore collection.
- Optional: `event` can be one of: `write` (default), `create`, `update` or `delete`

## Code sample

```typescript
import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { GcpConfig } from "@space48/cloud-seed";

const fn: EventFunction = (data) => {
  console.log("This is a firestore triggered function", data);
};

export default fn;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "firestore",
  collection: "myCollection",
  // Optional event type (defaults to 'write').
  firestoreEvent: "create"
};
```