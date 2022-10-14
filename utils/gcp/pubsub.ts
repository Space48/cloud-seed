import { PubSub } from "@google-cloud/pubsub";

const pubSub = new PubSub();

export const publish = async <T>(topic: string, message: T): Promise<string> => {
  return pubSub.topic(topic).publishMessage({ json: message });
};

export function getPubSubTopicName(scope: string, type: string): string {
  return `webhook-${type}-${scope.split("/").slice(0, 2).join("-")}`;
}
