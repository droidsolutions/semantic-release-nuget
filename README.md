# semantic-release-nuget

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to create and publish [NuGet](https://www.nuget.org/) packages.

![NPM Version](https://img.shields.io/npm/v/%40droidsolutions-oss%2Fsemantic-release-nuget?style=flat)

| Step               | Description                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `verifyConditions` | Verify the correctness of the provided plugin config.                                                                 |
| `prepare`          | Creates NuGet packages.                                                                                               |
| `publish`          | Publishes the created [NuGet packages](https://docs.microsoft.com/en-us/nuget/what-is-nuget) to the given registries. |

## Install

Install the plugin as a development dependency with

```bash
npm i -D @droidsolutions-oss/semantic-release-nuget
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@droidsolutions-oss/semantic-release-update-file",
    "@semantic-release/npm",
    "@droidsolutions-oss/semantic-release-nuget",
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "package-lock.json", "CHANGELOG.md", "Directory.Build.props"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/gitlab"
  ]
}
```

**Hint**: you can use the [@droidsolutions-oss/semantic-release-update-file](https://github.com/droidsolutions/semantic-release-update-file) plugin to update the version number in a project or `Directory.Build.props` file before creating the NuGet package.

## Configuration

### NuGet server authentication

The NuGet server authentication is **required** and can be set via [environment variables](#environment-variables).

### Environment Variables

| Variable        | Description                                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NUGET_TOKEN`   | NuGet token of the NuGet server you want to publish to, created on the [NuGet API keys page](https://www.nuget.org/account/apikeys).                                                                             |
| `CI_SERVER_URL` | If you want to publish to your GitLab server, this needs to be set to the main url of the GitLab instance you are using. When running in GitLab CI this is already set by GitLab.                                |
| `CI_PROJECT_ID` | If you want to publish to your GitLab server, this needs to be set to the Id of the project you want to publish to. When running in GitLab CI this is already set to the project the pipleine runs in by GitLab. |
| `CI_JOB_TOKEN`  | If you want to publish to your GitLab server, this needs to be set. When running in GitLab CI this is already set by GitLab, but it only works when publishing to the same project the pipeline runs in.         |

### Options

| Options                         | Description                                                                                                                                                                                                                   | Default                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `nugetRegistries`               | A list of NuGet registry configurations to publish to.                                                                                                                                                                        | see below                                   |
| `nugetRegistries[].type`        | The type of the NuGet registry. Possible values are `nuget`, `gitlab_private`, `github`.                                                                                                                                      | `nuget`                                     |
| `nugetRegistries[].name`        | Name of the source for logging and recognition from nuget.config.                                                                                                                                                             | `nuget`                                     |
| `nugetRegistries[].url`         | The URL to the NuGet registry.                                                                                                                                                                                                | `https://api.nuget.org/v3/index.json`       |
| `nugetRegistries[].user`        | The user to login to the NuGet registry.                                                                                                                                                                                      |                                             |
| `nugetRegistries[].tokenEnvVar` | The name of the environment variable that contains the password or token to authenticate against the NuGet registry.                                                                                                          | `NUGET_TOKEN` or `CI_JOB_TOKEN` for GitLab. |
| `projectPath`                   | The relative path to the project file to pack. Can also be an array including multiple projects.                                                                                                                              |                                             |
| `nugetServer`                   | **Deprecated**, use nugetRegistries[].url instead. The URL of the NuGet server to push the package to.                                                                                                                        | `https://api.nuget.org/v3/index.json`       |
| `includeSymbols`                | If true an extra package with debug symbols will be created.                                                                                                                                                                  | `false`                                     |
| `includeSource`                 | If true source code will be included in the package which helps when consumers need to debug your library.                                                                                                                    | `false`                                     |
| `dotnet`                        | The path to the dotnet executable if not in PATH.                                                                                                                                                                             | `dotnet`                                    |
| `publishToGitLab`               | **Deprecated**, use nugetRegistries instead. If true, package will also be published to the GitLab registry.                                                                                                                  | `false`                                     |
| `usePackageVersion`             | If true, the new version from Semantic Release is directly given to `dotnet pack` command, else the version set in `csproj` or `Directory.Build.props` is used for the NuGet package.                                         | `false`                                     |
| `skipPublishToNuget`            | **Deprecated**, use nugetRegistries instead. If true, the NuGet package will not be published to the `nugetServer`. You can use this together with `publishToGitLab` to **only** publish your package to the GitLab registry. | `false`                                     |
| `gitlabRegistryProjectId`       | Can be set to publish the package to a different GitLab project. Only used when `publishToGitLab` is set to true.                                                                                                             | `CI_PROJECT_ID`                             |
| `gitlabUser`                    | Needed when publishing to a separate GitLab project. If using a deploy token, to name of the token must be given, when using a personal access token, the name of the user must be given.                                     | `gitlab-ci-token`                           |
| `dotnetVerbosity`               | Optional string to pass to the dotnet pack command as verbosity argument. See [verbosity argument](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-pack) for valid values.                                         |                                             |

With 2.1.0 configuration approach changed. Now a `nugetRegistries` array can be given to configure each registry the packages should be published to.

An empty config will lead to this default config:

```json
{
  "nugetRegistries": [
    {
      "name": "nuget",
      "url": "https://api.nuget.org/v3/index.json",
      "tokenEnvVar": "NUGET_TOKEN",
      "type": "nuget"
    }
  ]
}
```

**Note**: If `publishToGitLab` is set the environment variables for `CI_SERVER_URL`, `CI_PROJECT_ID` and `CI_JOB_TOKEN` must be set. If you are running in GitLab CI this is automatically set by GitLab for you. The nugetRegistries config will be appended with this:

```json
{
  "name": "gitlab",
  "url": "${CI_SERVER_URL}/api/v4/projects/${CI_PROJECT_ID}/packages/nuget/index.json",
  "tokenEnvVar": "CI_JOB_TOKEN",
  "type": "gitlab_private"
}
```

**Note**: If `skipPublishToNuget` is set the package will not be published to the official nuget server. This only makes sense in combination with `publishToGitLab`. This is now deprecated, you should instead configure your registries via the `nugetRegistries` config.

**Note**: When you add the [NPM plugin](https://raw.githubusercontent.com/semantic-release/npm) to update your `package.json` you should set `npmPublish` to `false` to prevent Semantic Release from trying to publish an NPM package.

**Note**: When you want to publish your package to a different GitLab project with `gitlabRegistryProjectId` make sure the NUGET_TOKEN is a token that has access to it and also `gitlabUser` must be set to the user the token belongs to.

See config examples below for more info.

## Versioning

There are two ways how the version is set in the created NuGet package. The easiest way (e.g. in that it does not require any additional configuration) is to set `usePackageVersion` to true. This will give the version that Semantic Release calculated as the next one directly as an argument to the `dotnet pack` command (via the `-p:PackageVersion=<version>` argument). However this has the downside of your version not being persisted in your repository files.

The recommended way to have your package versioned is to have the version in your project file. You can use a [Directory.Build.props](https://docs.microsoft.com/en-us/visualstudio/msbuild/customize-your-build) file to set the same version for all projects in your repository. Add a `VersionPrefix` (or `Version`) tag to it and use the [Semantic Release Update file plugin](https://github.com/droidsolutions/semantic-release-update-file) to update the version prior to creating the package. Make sure the `update-file` plugin is before the `git` plugin in the `plugins` list and add the project file or the `Directory.Build.props` to the assets list. See [example config](#example-config) below.

## Config examples

### Simple publish to nuget.org

You don't need any config, just make sure the `NUGET_TOKEN` environment variable contains a valid token to publish to nuget.org.

If you want to use another environment variable or just explicitly configure it, you can use this:

```json
{
  "nugetRegistries": [
    {
      "name": "nuget",
      "url": "https://api.nuget.org/v3/index.json",
      "tokenEnvVar": "NUGET_TOKEN",
      "type": "nuget"
    }
  ]
}
```

### Publish to current GitLab project

If you want to publish to the current GitLab project without special permissions you can use the following minimal example:

```json
{
  "nugetRegistries": [
    {
      "type": "gitlab_private"
    }
  ]
}
```

This will resolve the GitLab registry url from variables that are set in the GitLab CI:
`${CI_SERVER_URL}/api/v4/projects/${CI_PROJECT_ID}/packages/nuget/index.json`. It will set `tokenEnvVar` to `CI_JOB_TOKEN` which is sufficient to publish packages to the current project.

### Publish to a different GitLab project

If you want to publish to a different GitLab project you probably need a GitLab token with the correct rights. Add the project id to the general config:

```json
{
  "gitlabRegistryProjectId": 123,
  "nugetRegistries": [
    {
      "type": "gitlab_private"
    }
  ]
}
```

This will resolve the GitLab registry url from variables that are set in the GitLab CI:
`${CI_SERVER_URL}/api/v4/projects/123/packages/nuget/index.json`. It will set `tokenEnvVar` to `NUGET_TOKEN` which is sufficient to publish packages to the current project. You can also set `tokenEnvVar` yourself if you want to use a different environment variable.

### Publish to GitHub Packages

To publish to GitHub Packages you can use the `github` type.

```json
{
  "nugetRegistries": [
    {
      "type": "github"
    }
  ]
}
```

This will automatically resolve the registry URL to `https://nuget.pkg.github.com/${GITHUB_REPOSITORY_OWNER}/index.json`.
It will use `GITHUB_TOKEN` environment variable for authentication and `GITHUB_ACTOR` as username.
Make sure your workflow has `packages: write` permission.

### Publish to multiple registries

If you want to publish to different registries you should set tokenEnvVar for each:

```json
{
  "nugetRegistries": [
    {
      "name": "nuget",
      "tokenEnvVar": "NUGET_TOKEN",
      "type": "nuget"
    },
    {
      "name": "gitlab_private",
      "tokenEnvVar": "CI_JOB_TOKEN",
      "type": "gitlab_private"
    }
  ]
}
```

### Persist version changes in Directory.Build.props

The following is an example how to use this plugin to build semantic versioned NuGet packages and persist the version in the project files. Add a `Directory.Build.props` to your project, depending if you want to share the values in multiple projects of the same repository it can be anywhere from project root to next to your csproj file. This file can and should contain some metadata about your NuGet package.

**Note**: Instead of this special file you can also add those properties directly in your csproj file. If you do so, make sure you change the path for the update file plugin accordingly.

```xml
<Project>
  <PropertyGroup>
    <Authors>Stefan Ißmer</Authors>
    <Description>Library for working with jobs that may be recurring in distributed systems and microservices.</Description>
    <Company>DroidSolutions GmbH</Company>
    <PackageLicenseFile>LICENSE</PackageLicenseFile>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <PackageReleaseNotes>https://github.com/droidsolutions/job-service/blob/main/CHANGELOG.md</PackageReleaseNotes>
    <SymbolPackageFormat>snupkg</SymbolPackageFormat>
    <RepositoryUrl>https://github.com/droidsolutions/job-service.git</RepositoryUrl>
    <PublishRepositoryUrl>true</PublishRepositoryUrl>
    <RepositoryType>git</RepositoryType>
    <RepositoryBranch>main</RepositoryBranch>
    <RepositoryCommit>209982581960ec4e7361ec556e51be4ebbee2052</RepositoryCommit>
    <Version>3.0.1</Version>
  </PropertyGroup>
</Project>
```

Now configure Semantic Release and use the update file plugin to update values in the file. Apart from the Version you can also update the commit hash and others. Refer to the [update-file plugin documentation](https://github.com/droidsolutions/semantic-release-update-file#configuration-options) for a list of values you can use.

```jsonc
{
  // order of plugins is important, because it is the execution order
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@droidsolutions-oss/semantic-release-update-file", // update version in Directory.Build.props
    "@semantic-release/npm", // update package.json
    "@droidsolutions-oss/semantic-release-nuget", // create nuget package
    [
      "@semantic-release/git",
      {
        "assets": [
          "package.json",
          "package-lock.json",
          "CHANGELOG.md",
          "Directory.Build.props", // add updated file to the Semantic Release commit
        ],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/gitlab",
  ],
  "npmPublish": false, // prevent creating NPM package
  "nugetRegistries": [
    {
      "name": "custom-nuget",
      "url": "https://nuget.mycomapny.com/v3/index.json", // custom (private) NuGet server, uses NUGET_TOKEN for auth
      "type": "nuget",
    },
  ],
  "projectPath": [
    "src/DroidSolutions.Oss.JobService/DroidSolutions.Oss.JobService.csproj", // path to the project files
  ],
  "includeSymbols": true, // include Debug symbols for easier debugging
  "files": [
    {
      "path": ["Directory.Build.props"], // configure update-file plugin to update fields in Directory.Build.props
      "type": "xml",
      "replacements": [
        {
          "key": "Version",
          "value": "${nextRelease.version}",
        },
        {
          "key": "RepositoryCommit",
          "value": "${CI_COMMIT_SHA}",
        },
      ],
    },
  ],
}
```

### Multiple packages

You can build multiple NuGet packages from one repositories. To do this, specify the relative paths to the projects. Instead of

```json
{
  "projectPath": "src/DroidSolutions.SemanticVersion/DroidSolutions.SemanticVersion.csproj"
}
```

you could also use something like this:

```json
{
  "projectPath": [
    "src/DroidSolutions.Oss.JobService/DroidSolutions.Oss.JobService.csproj",
    "src/DroidSolutions.Oss.JobService.EFCore/DroidSolutions.Oss.JobService.EFCore.csproj",
    "src/DroidSolutions.Oss.JobService.Postgres/DroidSolutions.Oss.JobService.Postgres.csproj"
  ]
}
```
