# semantic-release-nuget

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to create and publish a [NuGet](https://www.nuget.org/) package.

| Step               | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `verifyConditions` | Verify the presence of the NUGET_TOKEN environment variable and the presence of the dotnet executable.   |
| `prepare`          | Creates a NuGet package.                                                                                 |
| `publish`          | Publish a [NuGet package](https://docs.microsoft.com/en-us/nuget/what-is-nuget) to the given registries. |

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

**Hint**: you can use the `@droidsolutions-oss/semantic-release-update-file` plugin to update the version number in a project or `Directory.Build.props` file before.

## Configuration

### NuGet server authentication

The NuGet server authentication is **required** and can be set via [environment variables](#environment-variables).

### Environment Variables

| Variable        | Description                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NUGET_TOKEN`   | NuGet token of the NuGet server you want to publish to, created on the [NuGet API keys page](https://www.nuget.org/account/apikeys). |
| `CI_SERVER_URL` | If you want to publish to your GitLab server, this needs to be set. When running in GitLab CI this is already set by GitLab.         |
| `CI_PROJECT_ID` | If you want to publish to your GitLab server, this needs to be set. When running in GitLab CI this is already set by GitLab.         |
| `CI_JOB_TOKEN`  | If you want to publish to your GitLab server, this needs to be set. When running in GitLab CI this is already set by GitLab.         |

### Options

| Options                   | Description                                                                                                                                                                               | Default           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `nugetServer`             | The URL of the NuGet server to push the package to.                                                                                                                                       | `nuget.org`       |
| `projectPath`             | The relative path to the project file to pack. Can also be an array including multiple projects.                                                                                          |                   |
| `includeSymbols`          | If true Debug symbols will be included in the package.                                                                                                                                    | `false`           |
| `includeSource`           | If true source code will be included in the package.                                                                                                                                      | `false`           |
| `dotnet`                  | The path to the dotnet executable if not in PATH.                                                                                                                                         | `dotnet`          |
| `publishToGitLab`         | If true, package will also be published to the GitLab registry.                                                                                                                           | `false`           |
| `usePackageVersion`       | If true, version is directly set via dotnet pack argument.                                                                                                                                | `false`           |
| `skipPublishToNuget`      | If true, the NuGet package will not be published to the `nugetServer`. You can use this together with `publishToGitLab` to **only** publish your package to the GitLab registry.          | `false`           |
| `gitlabRegistryProjectId` | Can be set to publish the package to a different GitLab project. Only used when `publishToGitLab` is set to true.                                                                         | `CI_PROJECT_ID`   |
| `gitlabUser`              | Needed when publishing to a separate GitLab project. If using a deploy token, to name of the token must be given, when using a personal access token, the name of the user must be given. | `gitlab-ci-token` |

**Note**: If `usePackageVersion` is set the version from Semantic Release is given directly to the `dotnet pack` command via the `-p:PackageVersion=<version>` argument. In this case any existing version in project files are ignored.

**Note**: If `publishToGitLab` is set the environment variables for `CI_SERVER_URL`, `CI_PROJECT_ID` and `CI_JOB_TOKEN` must be set. If you are running in GitLab CI this is automatically set by GitLab for you.

**Note**: If `skipPublishToNuget` is set the package will not be published to the nuget server even if you specified an alternative via `nugetServer`. This only makes sense in combination with `publishToGitLab`.

**Note**: When you add the [NPM plugin](https://raw.githubusercontent.com/semantic-release/npm) to update your `package.json` you should set `npmPublish` to `false` to prevent Semantic Release from trying to publish an NPM package.

**Note**: When you want to publish your package to a different GitLab project with `gitlabRegistryProjectId` make sure the NUGET_TOKEN to a token that has access to it and also `gitlabUser` must be set to the user the token belongs to.

## Versioning

There are two ways how the version is set in the created NuGet package. The easiest way (e.g. in that it does not require any additional configuration) is to set `usePackageVersion` to true. This will give the version that Semantic Release calculated as the next one directly as an argument to the `dotnet pack` command. However this has the downside of your version not being persisted in your repository files.

The recommended way to have your package versioned is to have the version in your project file (you can also use a [Directory.Build.props](https://docs.microsoft.com/en-us/visualstudio/msbuild/customize-your-build) file in your repostiory). Add a `VersionPrefix` (or `Version`) tag to it and use the [Update file plugin](https://github.com/droidsolutions/semantic-release-update-file) to update the version prior to creating the package. Make sure this plugins is before the git plugin in the plugins list and add the project file or the `Directory.Build.props` to the assets list. See [example config](#example-config) below.

## Example config

The following is an example how to use this plugin to build semantic versioned NuGet packages. Add a `Directory.Build.props` to your project, depending if you want to share the values it can be anywhere from project root to next to your csproj file. This file can and should contain some metadata about your NuGet package.

**Note**: Instead of this special file you can also add those properties directly in your csproj file. If you do so, make sure you change the path for the update file plugin accordingly.

```xml
<Project>
  <PropertyGroup>
    <VersionPrefix>1.12.0</VersionPrefix>
    <Authors>Stefan Ißmer</Authors>
    <Company>DroidSolutions GmbH</Company>
    <Description>Contains tools to help work with semantic version numbers.</Description>
    <SymbolPackageFormat>snupkg</SymbolPackageFormat>
    <RepositoryUrl>https://github.com/droidsolutions/semantic-release-nuget.git</RepositoryUrl>
    <RepositoryBranch>main</RepositoryBranch>
    <RepositoryCommit>e5d0dbf09c927044556a876eff07b81296da8976</RepositoryCommit>
  </PropertyGroup>
</Project>
```

No configure Semantic Release and use the update file plugin to update values in the file. Apart from the Version you can also update the commit hash and others. Refer to the [Semantic Release documentation](https://semantic-release.gitbook.io/semantic-release/developer-guide/js-api#result) for a list of values you can use.

```jsonc
{
  // order of plugins is important, because it is the execution order
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@droidsolutions-oss/semantic-release-update-file", // update version in Directory.Build.props
    "@semantic-release/npm",
    "@droidsolutions-oss/semantic-release-nuget", // create nuget package
    [
      "@semantic-release/git",
      {
        "assets": [
          "package.json",
          "package-lock.json",
          "CHANGELOG.md",
          "Directory.Build.props" // add updated file to the Semantic Release commit
        ],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/gitlab"
  ],
  "npmPublish": false, // prevent creating NPM package
  "nugetServer": "https://nuget.mycomapny.com/v3/index.json", // custom (private) NuGet server
  "projectPath": "src/DroidSolutions.SemanticVersion/DroidSolutions.SemanticVersion.csproj", // path to the project file
  "includeSymbols": true,
  "publishToGitLab": true, // also publish the package to your GitLab server
  "files": [
    {
      "path": ["Directory.Build.props"], // configure update-file pluginn to update fields in Directory.Build.props
      "type": "xml",
      "replacements": [
        {
          "key": "VersionPrefix",
          "value": "${nextRelease.version}"
        },
        {
          "key": "RepositoryCommit",
          "value": "${CI_COMMIT_SHA}"
        }
      ]
    }
  ]
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

All NuGet packages will be in the `out` directory in project root.
