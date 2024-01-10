## [2.0.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v2.0.0...v2.0.1) (2024-01-10)


### Bug Fixes

* [#777](https://github.com/droidsolutions/semantic-release-nuget/issues/777) check for existing NuGet source before adding ([e3047bb](https://github.com/droidsolutions/semantic-release-nuget/commit/e3047bb3b0d84a69a36524d6a36b4d9959478f66))

# [2.0.0](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.4.1...v2.0.0) (2023-10-19)


### Bug Fixes

* update exports in package.json ([651e34b](https://github.com/droidsolutions/semantic-release-nuget/commit/651e34bafe2ed7c6a9f525b2f771fc0ad907eab1))
* use OS agnostic path separator ([3cb4c0a](https://github.com/droidsolutions/semantic-release-nuget/commit/3cb4c0a40e65afa3bcc98dd703f20252e19fd62a)), closes [#686](https://github.com/droidsolutions/semantic-release-nuget/issues/686)


### Features

* convert library to ESM ([1429d96](https://github.com/droidsolutions/semantic-release-nuget/commit/1429d96997d3ae6ae32dec3173b328af13aa9ae6)), closes [#678](https://github.com/droidsolutions/semantic-release-nuget/issues/678) [#634](https://github.com/droidsolutions/semantic-release-nuget/issues/634)


### BREAKING CHANGES

* this library is now build and published as ESM package to follow official Semantic
Release plugins

# [2.0.0-beta.2](https://github.com/droidsolutions/semantic-release-nuget/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2023-10-18)


### Bug Fixes

* update exports in package.json ([651e34b](https://github.com/droidsolutions/semantic-release-nuget/commit/651e34bafe2ed7c6a9f525b2f771fc0ad907eab1))

# [2.0.0-beta.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.4.1...v2.0.0-beta.1) (2023-10-18)


### Bug Fixes

* use OS agnostic path separator ([3cb4c0a](https://github.com/droidsolutions/semantic-release-nuget/commit/3cb4c0a40e65afa3bcc98dd703f20252e19fd62a)), closes [#686](https://github.com/droidsolutions/semantic-release-nuget/issues/686)


### Features

* convert library to ESM ([1429d96](https://github.com/droidsolutions/semantic-release-nuget/commit/1429d96997d3ae6ae32dec3173b328af13aa9ae6)), closes [#678](https://github.com/droidsolutions/semantic-release-nuget/issues/678) [#634](https://github.com/droidsolutions/semantic-release-nuget/issues/634)


### BREAKING CHANGES

* this library is now build and published as ESM package to follow official Semantic
Release plugins

## [1.4.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.4.0...v1.4.1) (2023-10-10)


### Bug Fixes

* **publish:** don't give invalid -v argument to dotnet nuget push ([9b7ea6e](https://github.com/droidsolutions/semantic-release-nuget/commit/9b7ea6e6f7ea0cb4e9157107724d3b91c7fd4e51))

# [1.4.0](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.3.0...v1.4.0) (2023-10-10)


### Features

* add dotnetVerbosity option ([7971c60](https://github.com/droidsolutions/semantic-release-nuget/commit/7971c60f540fd9c9ede05c35d22ca72294972720))

# [1.3.0](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.2.0...v1.3.0) (2023-09-18)


### Features

* add gitlabRegistryProjectId config ([e2c29aa](https://github.com/droidsolutions/semantic-release-nuget/commit/e2c29aa4e9ebf486ece0bf079ff80ca4112a8696))
* **GitLab:** allow to provide a username when publishing to separate GitLab project ([49de3d1](https://github.com/droidsolutions/semantic-release-nuget/commit/49de3d18df6eb5d0f792681e843cc5d939152ae2)), closes [#624](https://github.com/droidsolutions/semantic-release-nuget/issues/624)

# [1.3.0-beta.2](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.3.0-beta.1...v1.3.0-beta.2) (2023-09-11)


### Features

* **GitLab:** allow to provide a username when publishing to separate GitLab project ([49de3d1](https://github.com/droidsolutions/semantic-release-nuget/commit/49de3d18df6eb5d0f792681e843cc5d939152ae2)), closes [#624](https://github.com/droidsolutions/semantic-release-nuget/issues/624)

# [1.3.0-beta.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.2.0...v1.3.0-beta.1) (2023-08-09)


### Features

* add gitlabRegistryProjectId config ([e2c29aa](https://github.com/droidsolutions/semantic-release-nuget/commit/e2c29aa4e9ebf486ece0bf079ff80ca4112a8696))

# [1.2.0](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.1.2...v1.2.0) (2022-08-22)


### Bug Fixes

* **deps:** update vulnerable deps via npm audit fix ([a9b79b7](https://github.com/droidsolutions/semantic-release-nuget/commit/a9b79b707a8452b9b6ebef55893827aa0d6270f4))
* **verify:** use SemanticReleaseError in verify ([a749358](https://github.com/droidsolutions/semantic-release-nuget/commit/a7493581492a904bf80e14e422ddf1642efea6fd))


### Features

* allow to skip publish to official NuGet ([53eb0e7](https://github.com/droidsolutions/semantic-release-nuget/commit/53eb0e7ad6cd22afe65e401f976c07ab2c438e90))

# [1.2.0-beta.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.1.2...v1.2.0-beta.1) (2022-07-13)


### Bug Fixes

* **deps:** update vulnerable deps via npm audit fix ([a9b79b7](https://github.com/droidsolutions/semantic-release-nuget/commit/a9b79b707a8452b9b6ebef55893827aa0d6270f4))
* **verify:** use SemanticReleaseError in verify ([a749358](https://github.com/droidsolutions/semantic-release-nuget/commit/a7493581492a904bf80e14e422ddf1642efea6fd))


### Features

* allow to skip publish to official NuGet ([53eb0e7](https://github.com/droidsolutions/semantic-release-nuget/commit/53eb0e7ad6cd22afe65e401f976c07ab2c438e90))

## [1.1.2](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.1.1...v1.1.2) (2022-07-13)

### Bug Fixes

- **publish:** prevent NuGet token from leaking in logs ([9e3c005](https://github.com/droidsolutions/semantic-release-nuget/commit/9e3c0052963cc67c33df20803d83dc5e0e7da5ad))

## [1.1.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.1.0...v1.1.1) (2022-04-05)

### Bug Fixes

- prepare failed when projectPath was string ([f3297b7](https://github.com/droidsolutions/semantic-release-nuget/commit/f3297b74e694e2fe89f0875bbeb0d409fc2fb5a8))

# [1.1.0](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.0.3...v1.1.0) (2022-03-18)

### Features

- allow to build multiple NuGet packages in one Repo ([39c5fa3](https://github.com/droidsolutions/semantic-release-nuget/commit/39c5fa39021b6d4c3ecfdf1a7e636c605a20f7a8))

# [1.1.0-beta.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.0.3...v1.1.0-beta.1) (2022-03-15)

### Features

- allow to build multiple NuGet packages in one Repo ([39c5fa3](https://github.com/droidsolutions/semantic-release-nuget/commit/39c5fa39021b6d4c3ecfdf1a7e636c605a20f7a8))

## [1.0.3](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.0.2...v1.0.3) (2022-01-27)

### Bug Fixes

- **publish:** use NuGet API url and snupkg ([6c64590](https://github.com/droidsolutions/semantic-release-nuget/commit/6c64590d6cdb02048b91bc11f03c81cacf81a6a5))

## [1.0.2](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.0.1...v1.0.2) (2022-01-27)

### Bug Fixes

- **publish:** use nuget.org as default push source ([d0c7016](https://github.com/droidsolutions/semantic-release-nuget/commit/d0c7016c112d1891ef900dc3efe0b6f7f8b9d28d))

## [1.0.1](https://github.com/droidsolutions/semantic-release-nuget/compare/v1.0.0...v1.0.1) (2022-01-20)

### Bug Fixes

- **release:** mark package as publicly accessible ([f787f4b](https://github.com/droidsolutions/semantic-release-nuget/commit/f787f4bf7b7429fa67d80006022e38cef6da08b0))

# 1.0.0 (2022-01-20)

### Features

- initial release ([3df0305](https://github.com/droidsolutions/semantic-release-nuget/commit/3df0305eb8c336d804784f816ff2fd2a6127d8f7))
