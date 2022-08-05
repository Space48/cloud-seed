import { HttpFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";
import { bigCommerceClient } from "../utils/bigcommerce";
import { GetWebhookPayload } from "./types";

const configureBigcommerceWebhooks: HttpFunction = async (request, response) => {
  const { destination, requiredScopesList } = request.query as Record<string, string>;

  const bigCommerce = await bigCommerceClient;

  const allExistingWebhooks = (await bigCommerce.v3.get("/hooks")) as GetWebhookPayload[];

  const centralizedHooks = allExistingWebhooks.filter(
    webhook => webhook.destination === destination,
  );

  const requiredScopes = requiredScopesList.split(",");

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
          destination,
          scope,
          is_active: true,
          headers: {},
        },
      }),
    );

  await Promise.all([...deletions, ...activations, ...creations]);

  response.json({
    activations: activations.length,
    creations: creations.length,
    deletions: deletions.length,
  });
};

export default configureBigcommerceWebhooks;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "http",
  public: true,
};
