# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/Space48/cloud-seed/compare/v3.0.0...HEAD)

### Breaking changes

- The package no longer supports deprecated Node.js engine versions. Upgrade your project to Node.js v20 or later.
- Esbuild, which is used to build and bundle the source code for functions, has been upgraded through several breaking versions. Ensure you complete full regression testing of your functions after upgrading.

### Changed

- Updated package dependencies

## [v3.0.0](https://github.com/Space48/cloud-seed/compare/v2.1.0...v3.0.0)

### Breaking changes

- `GCP_PROJECT` environment variable added by Cloud Seed has been renamed to `CLOUD_SEED_PROJECT`. Update any references to it in function code.
- `GCP_REGION` environment variable added by Cloud Seed has been renamed to `CLOUD_SEED_REGION`. Update any references to it in function code.
- `NODE_ENV` environment variable added by Cloud Seed has been renamed to `CLOUD_SEED_ENVIRONMENT`. Update any references to it in function code. Note: GCP always sets the `NODE_ENV` environment variable to `production` for deployed functions, which may affect how any NPM dependencies you have installed function.

### Added

- Environment-level function configuration overrides in `runtimeConfig`

### Fixed

- `GCP_PROJECT` and `NODE_ENV` environment variables are reserved in GCP and can not be set by the user

## [v2.1.0](https://github.com/Space48/cloud-seed/compare/v2.0.1...v2.1.0) - 2024-07-08

### Added

- Support for specifying timezones for cloud scheduler jobs in `runtimeConfig`

## [v2.0.1](https://github.com/Space48/cloud-seed/compare/v2.0.0...v2.0.1) - 2024-06-10

### Fixed

- Public http functions on gen2 are now correctly exposed without authentication

## [v2.0.0](https://github.com/Space48/cloud-seed/compare/v1.3.0...v2.0.0) - 2024-06-10

### Breaking changes

- Functions will use gen2 by default and will cause any existing functions to be redeployed as gen2. To keep existing functions on gen1, add `version: "gen1"` to the `runtimeConfig`.

### Added

- Support GCP Cloud Functions (2nd gen)

## [v1.3.0](https://github.com/Space48/cloud-seed/compare/v1.2.2...v1.3.0) - 2022-09-05

### Breaking changes

- The `--env` command line option is now required for `cloud-seed build`. Update any pipelines to `--env dev` to retain existing functionality.
- GCP functions now require a runtime to be specified. Any existing functions that previously used the default value for the runtime will require `runtime: "nodejs14"` to be added to their `runtimeConfig`.

### Added

- Support for GCP Functions triggered by Cloud Tasks queues

### Changed

- `cloud-seed build` command now requires the `--env` command line option to be specified
- GCP functions now require a runtime to be specified and no longer default to using Node v14
- CDKTF providers are now added as NPM dependencies and their versions are controlled in `package.json`

## [v1.2.2](https://github.com/Space48/cloud-seed/compare/v1.2.1...v1.2.2) - 2022-08-16

### Fixed

- Fixed race condition where public permissions for functions were created before the function itself

## [v1.2.1](https://github.com/Space48/cloud-seed/compare/v1.2.0...v1.2.1) - 2022-07-19

### Added

- Added `minInstances` and `maxInstances` options to `runtimeConfig`

## [v1.2.0](https://github.com/Space48/cloud-seed/compare/1.1.1...v1.2.0) - 2022-05-05

### Fixed

- Fixes for critical bugs introduced in 1.1.x releases

## [v1.1.1](https://github.com/Space48/cloud-seed/compare/1.1.0...1.1.1) - 2022-05-04

### Fixed

- Changed the length of VPC access connector names to comply with naming regex

## [v1.1.0](https://github.com/Space48/cloud-seed/compare/1.0.1...1.1.0) - 2022-04-27

### Fixed

- Handle conflicts with source code bucket names

## [v1.0.1](https://github.com/Space48/cloud-seed/compare/1.0.0...1.0.1) - 2022-04-08

### Added

- Added `retryOnFailure` option to `runtimeConfig`

## [v1.0.0](https://github.com/Space48/cloud-seed/tree/v1.0.0-rc) - 2022-04-04

### Added

- Initial full release
