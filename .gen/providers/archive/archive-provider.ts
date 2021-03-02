// https://www.terraform.io/docs/providers/archive/r/archive_provider.html
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface ArchiveProviderConfig {
  /** Alias name */
  readonly alias?: string;
}

// Resource

export class ArchiveProvider extends cdktf.TerraformProvider {

  // ===========
  // INITIALIZER
  // ===========

  public constructor(scope: Construct, id: string, config: ArchiveProviderConfig = {}) {
    super(scope, id, {
      terraformResourceType: 'archive',
      terraformGeneratorMetadata: {
        providerName: 'archive',
        providerVersionConstraint: '~> 2.1.0'
      },
      terraformProviderSource: 'archive'
    });
    this._alias = config.alias;
  }

  // ==========
  // ATTRIBUTES
  // ==========

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
      alias: cdktf.stringToTerraform(this._alias),
    };
  }
}
