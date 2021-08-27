# Configuring Bigcommerce Webhooks

If you need to trigger your functions from a BigCommerce Webhook then you can do so by adding small piece of configuration into the `runtimeConfig` export. See below:

```diff
export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  public: true,
+  webhook: {
+    type: "bigcommerce",
+    scopes: ["store/customer/created"],
+  },
};
```

As you can see the `webhook` object supports two properties: `type` and `scopes`.

Currently the only supported value for `type` is `bigcommerce`.

`scopes` is an array of BigCommerce event scopes you wish to listen for! Refer to the BigCommerce API documentation for more details.

## Configuring the BigCommerce store

To configure which BigCommerce store the webhooks are created for you will need to define the following environment variables:

- `BIGCOMMERCE_STORE_HASH`
- `BIGCOMMERCE_CLIENT_ID`
- `BIGCOMMERCE_ACCESS_TOKEN`

These environment variables will need to available when the `terraform plan` and `terraform apply` commands are executed as part of your deployment pipeline.



### Complete code example:

```typescript
import { GcpConfig } from "@space48/cloud-seed";
import { HttpFunction } from "@google-cloud/functions-framework/build/src/functions";

const handler: HttpFunction = (req, res) => {
  return res.status(200).send(JSON.stringify({ message: "ok" }));
};

export default handler;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  public: true,
  webhook: {
    type: "bigcommerce",
    scopes: ["store/customer/created"],
  },
};

```