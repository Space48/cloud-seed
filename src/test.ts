import { CloudEventFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";

const test: CloudEventFunction = async event => {
  console.log("success");
};
export default test;

export const runtimeConfig: GcpConfig = {
  cloud: "gcp",
  type: "webhook",
  webhook: {
    type: "bigcommerce",
    scope: "store/order/created",
  },
};
