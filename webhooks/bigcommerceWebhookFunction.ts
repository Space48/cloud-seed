import { HttpFunction } from "@google-cloud/functions-framework";
import { GcpConfig } from "../types/runtime";
import { getPubSubTopicName, publish } from "../utils/pubsub";

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
  cloud: "gcp",
  type: "http",
  public: true,
};

export interface WebhookPayload {
  store_id: number;
  producer: string;
  scope: string;
  data: {
    type: string;
    id: number;
    orderId?: number;
    status?: {
      previous_status_id: number;
      new_status_id: number;
    };
  };
  hash: string;
  created_at: number;
}
