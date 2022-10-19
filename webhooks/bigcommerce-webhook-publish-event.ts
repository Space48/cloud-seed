//BIGCOMMERCE_WEBHOOK_PUBLISHER_FUNCTION//

import { HttpFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";
import { getPubSubTopicName, publish } from "../utils/gcp/pubsub";
import { WebhookPayload } from "./types";

const bigcommerceWebhookPublishEvent: HttpFunction = async (request, response) => {
  const payload: WebhookPayload = request.body;
  if (payload.scope && payload.data?.type && payload.data?.id) {
    const topicName = getPubSubTopicName(payload.scope, "bigcommerce");
    console.log(JSON.stringify(payload));
    try {
      // publish the payload to the relevant pubsub topic for the webhooks scope
      await publish(topicName, payload);
      response.status(200).send();
    } catch (error) {
      response.status(500).send();
    }
  } else {
    console.log("Invalid data.");
    response.status(200).send();
  }
};
export default bigcommerceWebhookPublishEvent;

export const runtimeConfig: GcpConfig = {
  runtime: "nodejs14",
  cloud: "gcp",
  type: "http",
  public: true,
};
