# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the appropriate option with an [x] -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Release preparation

## Reviewers
<!-- Tag relevant people who should review this PR -->
<!-- Example: @username1 @username2 -->


## Release Checklist
<!-- If this is a release PR, please check the following items -->
If this PR is preparing a release, please ensure:

- [ ] The version in `package.json` has been updated following [Semantic Versioning](https://semver.org/) principles
  - [ ] Major version bump for breaking changes
  - [ ] Minor version bump for new features
  - [ ] Patch version bump for bug fixes
- [ ] The CHANGELOG.md has been updated with details of the changes under the [Unreleased] section
  - [ ] Added any new features under "### Added"
  - [ ] Documented any changes under "### Changed"
  - [ ] Documented any bug fixes under "### Fixed"
  - [ ] Documented any breaking changes under "### Breaking changes"
- [ ] All tests pass locally (`npm run test`)
- [ ] Code linting passes (`npm run lint`)
- [ ] The PR title clearly describes the changes

### Post-Merge Automation
After merging to master, the following will happen automatically:
- The package will be published to npm
- A GitHub release will be created with the CHANGELOG content
- The PR will be commented with the release information

## Testing
<!-- Describe the tests you've performed to verify your changes -->

## Additional Notes
<!-- Add any other context about the PR here -->
