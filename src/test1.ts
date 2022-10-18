import { CloudEventFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";

const test: CloudEventFunction = async event => {
  console.log("product created!");
};
export default test;

export const runtimeConfig: GcpConfig = {
  runtime: "nodejs14",
  cloud: "gcp",
  type: "webhook",
  webhook: {
    type: "bigcommerce",
    scope: "store/product/created",
  },
};