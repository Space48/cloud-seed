// https://www.terraform.io/docs/providers/bigcommerce/r/data_bigcommerce_webhook.html
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface DataBigcommerceWebhookConfig extends cdktf.TerraformMetaArguments {
  readonly id: string;
  /** header block */
  readonly header?: DataBigcommerceWebhookHeader[];
}
export interface DataBigcommerceWebhookHeader {
}

function dataBigcommerceWebhookHeaderToTerraform(struct?: DataBigcommerceWebhookHeader): any {
  if (!cdktf.canInspect(struct)) { return struct; }
  return {
  }
}


// Resource

export class DataBigcommerceWebhook extends cdktf.TerraformDataSource {

  // ===========
  // INITIALIZER
  // ===========

  public constructor(scope: Construct, id: string, config: DataBigcommerceWebhookConfig) {
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
    this._id = config.id;
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

  // destination - computed: true, optional: false, required: false
  public get destination() {
    return this.getStringAttribute('destination');
  }

  // id - computed: false, optional: false, required: true
  private _id: string;
  public get id() {
    return this.getStringAttribute('id');
  }
  public set id(value: string) {
    this._id = value;
  }
  // Temporarily expose input value. Use with caution.
  public get idInput() {
    return this._id
  }

  // is_active - computed: true, optional: false, required: false
  public get isActive() {
    return this.getBooleanAttribute('is_active');
  }

  // scope - computed: true, optional: false, required: false
  public get scope() {
    return this.getStringAttribute('scope');
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
  private _header?: DataBigcommerceWebhookHeader[];
  public get header() {
    return this.interpolationForAttribute('header') as any;
  }
  public set header(value: DataBigcommerceWebhookHeader[] ) {
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
      id: cdktf.stringToTerraform(this._id),
      header: cdktf.listMapper(dataBigcommerceWebhookHeaderToTerraform)(this._header),
    };
  }
}
