// https://www.terraform.io/docs/providers/bigcommerce/r/bigcommerce_provider.html
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface BigcommerceProviderConfig {
  readonly accessToken?: string;
  readonly clientId?: string;
  readonly storeHash?: string;
  /** Alias name */
  readonly alias?: string;
}

// Resource

export class BigcommerceProvider extends cdktf.TerraformProvider {

  // ===========
  // INITIALIZER
  // ===========

  public constructor(scope: Construct, id: string, config: BigcommerceProviderConfig = {}) {
    super(scope, id, {
      terraformResourceType: 'bigcommerce',
      terraformGeneratorMetadata: {
        providerName: 'bigcommerce',
        providerVersionConstraint: '~> 0.1.0'
      },
      terraformProviderSource: 'ashsmith/bigcommerce'
    });
    this._accessToken = config.accessToken;
    this._clientId = config.clientId;
    this._storeHash = config.storeHash;
    this._alias = config.alias;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // access_token - computed: false, optional: true, required: false
  private _accessToken?: string;
  public get accessToken() {
    return this._accessToken;
  }
  public set accessToken(value: string  | undefined) {
    this._accessToken = value;
  }
  public resetAccessToken() {
    this._accessToken = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get accessTokenInput() {
    return this._accessToken
  }

  // client_id - computed: false, optional: true, required: false
  private _clientId?: string;
  public get clientId() {
    return this._clientId;
  }
  public set clientId(value: string  | undefined) {
    this._clientId = value;
  }
  public resetClientId() {
    this._clientId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get clientIdInput() {
    return this._clientId
  }

  // store_hash - computed: false, optional: true, required: false
  private _storeHash?: string;
  public get storeHash() {
    return this._storeHash;
  }
  public set storeHash(value: string  | undefined) {
    this._storeHash = value;
  }
  public resetStoreHash() {
    this._storeHash = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get storeHashInput() {
    return this._storeHash
  }

  // alias - computed: false, optional: true, required: false
  private _alias?: string;
  public get alias() {
    return this._alias;
  }
  public set alias(value: string  | undefined) {
    this._alias = value;
  }
  public resetAlias() {
    this._alias = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get aliasInput() {
    return this._alias
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      access_token: cdktf.stringToTerraform(this._accessToken),
      client_id: cdktf.stringToTerraform(this._clientId),
      store_hash: cdktf.stringToTerraform(this._storeHash),
      alias: cdktf.stringToTerraform(this._alias),
    };
  }
}
