import { Management } from "@space48/bigcommerce-api";
import { getSecrets } from "./gcp/secret-manager";

export const bigCommerceClient: Promise<Management.Client> = getSecrets([
  "BC_API_TOKEN" || // REMOVE
    "bigcommerce-access-token",
]).then(
  ([accessToken]) =>
    new Management.Client({
      accessToken,
      storeHash: process.env.BC_STORE_HASH!,
    }),
);
