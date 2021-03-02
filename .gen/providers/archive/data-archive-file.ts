// https://www.terraform.io/docs/providers/archive/r/data_archive_file.html
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface DataArchiveFileConfig extends cdktf.TerraformMetaArguments {
  readonly excludes?: string[];
  readonly outputPath: string;
  readonly sourceContent?: string;
  readonly sourceContentFilename?: string;
  readonly sourceDir?: string;
  readonly sourceFile?: string;
  readonly type: string;
  /** source block */
  readonly source?: DataArchiveFileSource[];
}
export interface DataArchiveFileSource {
  readonly content: string;
  readonly filename: string;
}

function dataArchiveFileSourceToTerraform(struct?: DataArchiveFileSource): any {
  if (!cdktf.canInspect(struct)) { return struct; }
  return {
    content: cdktf.stringToTerraform(struct!.content),
    filename: cdktf.stringToTerraform(struct!.filename),
  }
}


// Resource

export class DataArchiveFile extends cdktf.TerraformDataSource {

  // ===========
  // INITIALIZER
  // ===========

  public constructor(scope: Construct, id: string, config: DataArchiveFileConfig) {
    super(scope, id, {
      terraformResourceType: 'archive_file',
      terraformGeneratorMetadata: {
        providerName: 'archive'
      },
      provider: config.provider,
      dependsOn: config.dependsOn,
      count: config.count,
      lifecycle: config.lifecycle
    });
    this._excludes = config.excludes;
    this._outputPath = config.outputPath;
    this._sourceContent = config.sourceContent;
    this._sourceContentFilename = config.sourceContentFilename;
    this._sourceDir = config.sourceDir;
    this._sourceFile = config.sourceFile;
    this._type = config.type;
    this._source = config.source;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // excludes - computed: false, optional: true, required: false
  private _excludes?: string[];
  public get excludes() {
    return this.getListAttribute('excludes');
  }
  public set excludes(value: string[] ) {
    this._excludes = value;
  }
  public resetExcludes() {
    this._excludes = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get excludesInput() {
    return this._excludes
  }

  // id - computed: true, optional: true, required: false
  public get id() {
    return this.getStringAttribute('id');
  }

  // output_base64sha256 - computed: true, optional: false, required: false
  public get outputBase64Sha256() {
    return this.getStringAttribute('output_base64sha256');
  }

  // output_md5 - computed: true, optional: false, required: false
  public get outputMd5() {
    return this.getStringAttribute('output_md5');
  }

  // output_path - computed: false, optional: false, required: true
  private _outputPath: string;
  public get outputPath() {
    return this.getStringAttribute('output_path');
  }
  public set outputPath(value: string) {
    this._outputPath = value;
  }
  // Temporarily expose input value. Use with caution.
  public get outputPathInput() {
    return this._outputPath
  }

  // output_sha - computed: true, optional: false, required: false
  public get outputSha() {
    return this.getStringAttribute('output_sha');
  }

  // output_size - computed: true, optional: false, required: false
  public get outputSize() {
    return this.getNumberAttribute('output_size');
  }

  // source_content - computed: false, optional: true, required: false
  private _sourceContent?: string;
  public get sourceContent() {
    return this.getStringAttribute('source_content');
  }
  public set sourceContent(value: string ) {
    this._sourceContent = value;
  }
  public resetSourceContent() {
    this._sourceContent = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceContentInput() {
    return this._sourceContent
  }

  // source_content_filename - computed: false, optional: true, required: false
  private _sourceContentFilename?: string;
  public get sourceContentFilename() {
    return this.getStringAttribute('source_content_filename');
  }
  public set sourceContentFilename(value: string ) {
    this._sourceContentFilename = value;
  }
  public resetSourceContentFilename() {
    this._sourceContentFilename = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceContentFilenameInput() {
    return this._sourceContentFilename
  }

  // source_dir - computed: false, optional: true, required: false
  private _sourceDir?: string;
  public get sourceDir() {
    return this.getStringAttribute('source_dir');
  }
  public set sourceDir(value: string ) {
    this._sourceDir = value;
  }
  public resetSourceDir() {
    this._sourceDir = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceDirInput() {
    return this._sourceDir
  }

  // source_file - computed: false, optional: true, required: false
  private _sourceFile?: string;
  public get sourceFile() {
    return this.getStringAttribute('source_file');
  }
  public set sourceFile(value: string ) {
    this._sourceFile = value;
  }
  public resetSourceFile() {
    this._sourceFile = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceFileInput() {
    return this._sourceFile
  }

  // type - computed: false, optional: false, required: true
  private _type: string;
  public get type() {
    return this.getStringAttribute('type');
  }
  public set type(value: string) {
    this._type = value;
  }
  // Temporarily expose input value. Use with caution.
  public get typeInput() {
    return this._type
  }

  // source - computed: false, optional: true, required: false
  private _source?: DataArchiveFileSource[];
  public get source() {
    return this.interpolationForAttribute('source') as any;
  }
  public set source(value: DataArchiveFileSource[] ) {
    this._source = value;
  }
  public resetSource() {
    this._source = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceInput() {
    return this._source
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      excludes: cdktf.listMapper(cdktf.stringToTerraform)(this._excludes),
      output_path: cdktf.stringToTerraform(this._outputPath),
      source_content: cdktf.stringToTerraform(this._sourceContent),
      source_content_filename: cdktf.stringToTerraform(this._sourceContentFilename),
      source_dir: cdktf.stringToTerraform(this._sourceDir),
      source_file: cdktf.stringToTerraform(this._sourceFile),
      type: cdktf.stringToTerraform(this._type),
      source: cdktf.listMapper(dataArchiveFileSourceToTerraform)(this._source),
    };
  }
}
