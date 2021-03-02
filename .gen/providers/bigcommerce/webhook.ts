// https://www.terraform.io/docs/providers/bigcommerce/r/webhook.html
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface WebhookConfig extends cdktf.TerraformMetaArguments {
  readonly destination: string;
  readonly isActive: boolean;
  readonly scope: string;
  /** header block */
  readonly header?: WebhookHeader[];
}
export interface WebhookHeader {
  readonly key: string;
  readonly value: string;
}

function webhookHeaderToTerraform(struct?: WebhookHeader): any {
  if (!cdktf.canInspect(struct)) { return struct; }
  return {
    key: cdktf.stringToTerraform(struct!.key),
    value: cdktf.stringToTerraform(struct!.value),
  }
}


// Resource

export class Webhook extends cdktf.TerraformResource {

  // ===========
  // INITIALIZER
  // ===========

  public constructor(scope: Construct, id: string, config: WebhookConfig) {
    super(scope, id, {
      terraformResourceType: 'bigcommerce_webhook',
      terraformGeneratorMetadata: {
        providerName: 'bigcommerce'
      },
      provider: config.provider,
      dependsOn: config.dependsOn,
      count: config.count,
      lifecycle: config.lifecycle
    });
    this._destination = config.destination;
    this._isActive = config.isActive;
    this._scope = config.scope;
    this._header = config.header;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // client_id - computed: true, optional: false, required: false
  public get clientId() {
    return this.getStringAttribute('client_id');
  }

  // created_at - computed: true, optional: false, required: false
  public get createdAt() {
    return this.getNumberAttribute('created_at');
  }

  // destination - computed: false, optional: false, required: true
  private _destination: string;
  public get destination() {
    return this.getStringAttribute('destination');
  }
  public set destination(value: string) {
    this._destination = value;
  }
  // Temporarily expose input value. Use with caution.
  public get destinationInput() {
    return this._destination
  }

  // id - computed: true, optional: false, required: false
  public get id() {
    return this.getStringAttribute('id');
  }

  // is_active - computed: false, optional: false, required: true
  private _isActive: boolean;
  public get isActive() {
    return this.getBooleanAttribute('is_active');
  }
  public set isActive(value: boolean) {
    this._isActive = value;
  }
  // Temporarily expose input value. Use with caution.
  public get isActiveInput() {
    return this._isActive
  }

  // scope - computed: false, optional: false, required: true
  private _scope: string;
  public get scope() {
    return this.getStringAttribute('scope');
  }
  public set scope(value: string) {
    this._scope = value;
  }
  // Temporarily expose input value. Use with caution.
  public get scopeInput() {
    return this._scope
  }

  // store_hash - computed: true, optional: false, required: false
  public get storeHash() {
    return this.getStringAttribute('store_hash');
  }

  // updated_at - computed: true, optional: false, required: false
  public get updatedAt() {
    return this.getNumberAttribute('updated_at');
  }

  // header - computed: false, optional: true, required: false
  private _header?: WebhookHeader[];
  public get header() {
    return this.interpolationForAttribute('header') as any;
  }
  public set header(value: WebhookHeader[] ) {
    this._header = value;
  }
  public resetHeader() {
    this._header = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get headerInput() {
    return this._header
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      destination: cdktf.stringToTerraform(this._destination),
      is_active: cdktf.booleanToTerraform(this._isActive),
      scope: cdktf.stringToTerraform(this._scope),
      header: cdktf.listMapper(webhookHeaderToTerraform)(this._header),
    };
  }
}
