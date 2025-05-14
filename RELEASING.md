# Release Process

This document outlines the process for releasing new versions of `@space48/cloud-seed` to npm.

> **Note:** Versions prior to 4.1.2 were published to GitHub Packages. Starting with version 4.1.2, all versions are published to npm, as per the [Space48 package publishing guidelines](https://codex.s48.dev/docs/PackageManagement/Publishing/npm).

## Regular Releases

For regular releases to npm:

1. **Update Version**: 
   - Update the version in `package.json` following [Semantic Versioning](https://semver.org/) principles

2. **Create Pull Request**:
   - Create a pull request with these changes
   - Ensure all tests pass and the PR is reviewed

3. **Merge to Master**:
   - Once approved, merge the PR to the `master` branch
   - This will automatically trigger the GitHub Actions workflow to:
     - Build the package
     - Run tests
     - Publish to npm with the version from package.json
     - Create a GitHub release

## Beta Releases

For beta releases:

1. **Development Work**:
   - Make your changes in a feature branch or on the `develop` branch

2. **Beta Publishing Options**:
   - **From develop branch**: Pushing to the `develop` branch automatically publishes a beta version with the format: `x.y.z-beta.[commit-hash].[timestamp]`
   - **From pull requests to master**: Opening a PR to `master` automatically publishes a beta version with the format: `x.y.z-beta.pr.[pr-number].[timestamp]`

3. **Using Beta Versions**:
   - Beta versions can be installed with: `npm install @space48/cloud-seed@[beta-version]`
   - Beta versions are published with the `beta` tag, so you can also use: `npm install @space48/cloud-seed@beta`

## Version Numbering

Follow [Semantic Versioning](https://semver.org/) for version numbers:

- **Major version** (`x.0.0`): Breaking changes
- **Minor version** (`0.x.0`): New features, backward compatible
- **Patch version** (`0.0.x`): Bug fixes, backward compatible
