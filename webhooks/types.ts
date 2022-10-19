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

export interface CreateWebhookPayload {
  scope: string;
  destination: string;
}

export interface GetWebhookPayload {
  id: number;
  client_id: string;
  store_hash: string;
  scope: string;
  destination: string;
  headers: any;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}
