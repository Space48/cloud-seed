import { Management } from "@space48/bigcommerce-api";
import { GetWebhookPayload } from "../webhooks/types";
import { readFileSync } from "fs";

const bigCommerce = new Management.Client({
  accessToken: process.env.BC_API_TOKEN!,
  storeHash: process.env.BC_STORE_HASH!,
});

async function main() {
  const { destinationUrl, scopes } = JSON.parse(
    readFileSync(".build/webhooks/bigcommerceWebhooks.json").toString(),
  );

  const allExistingWebhooks = (await bigCommerce.v3.get("/hooks")) as GetWebhookPayload[];

  const centralizedHooks = allExistingWebhooks.filter(
    webhook => webhook.destination === destinationUrl,
  );

  const requiredScopes = scopes as string[];

  const deletions = centralizedHooks
    .filter(webhook => !requiredScopes.includes(webhook.scope))
    .map(webhook => bigCommerce.v3.delete("/hooks/{id}", { path: { id: String(webhook.id) } }));

  const activations = centralizedHooks
    .filter(webhook => !webhook.is_active && requiredScopes.includes(webhook.scope))
    .map(webhook =>
      bigCommerce.v3.put("/hooks/{id}", {
        path: { id: String(webhook.id) },
        body: {
          scope: webhook.scope,
          destination: webhook.destination,
          is_active: true,
          headers: {},
        },
      }),
    );

  const existingWebhookScopes = new Set(centralizedHooks.map(webhook => webhook.scope));
  const creations = requiredScopes
    .filter(scope => !existingWebhookScopes.has(scope))
    .map(scope =>
      bigCommerce.v3.post("/hooks", {
        body: {
          destination: destinationUrl,
          scope,
          is_active: true,
          headers: {},
        },
      }),
    );

  await Promise.all(deletions).then(deletedHooks =>
    deletedHooks
      .map(hook => hook as GetWebhookPayload)
      .map(hook => console.log(`Deleted ${hook.scope}`)),
  );

  await Promise.all(creations).then(createdHooks =>
    createdHooks
      .map(hook => hook as GetWebhookPayload)
      .map(hook => console.log(`Created ${hook.scope}`)),
  );

  await Promise.all(activations).then(activated =>
    activated
      .map(hook => hook as GetWebhookPayload)
      .map(hook => console.log(`Activated ${hook.scope}`)),
  );
}

void main();
