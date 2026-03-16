import { ExecaError } from "execa";
import type { NuGetSource } from "./NuGetSource.mjs";
import type { RegistryConfig } from "./RegistryConfig.mjs";
import type { UserConfig } from "./UserConfig.mjs";

/**
 * Checks if the given object is an {@link ExecaError}.
 * @param err The error to check.
 * @returns True if the error is an ExecaError, false otherwise.
 */
export const isExecaError = (err: unknown): err is ExecaError => {
  return (err as ExecaError).exitCode !== undefined && (err as ExecaError).command !== undefined;
};

/**
 * Extracts the NuGet sources from the given output.
 * @param output The output from the "dotnet nuget sources list" command.
 * @returns The extracted sources.
 */
export const extractNugetSourcesFromListOutput = (output: string): NuGetSource[] => {
  const regex = new RegExp(/^\s+(\d+).\s+(.+)\s\[(Enabled|Disabled)\]\s+([^\s]+)$/, "gm");

  // check in each matches if one contains the given url
  let match: RegExpExecArray | null;
  const sources: NuGetSource[] = [];
  while ((match = regex.exec(output)) !== null) {
    if (match.length !== 5) {
      continue;
    }

    const index = parseInt(match[1]!, 10);

    sources.push({ index, source: match[2]!, enabled: match[3] === "Enabled", url: match[4]! });
  }

  return sources;
};

export const normalizeRegistryConfig = (config: UserConfig): RegistryConfig[] => {
  // Todo use CI_API_V4_URL instead of CI_SERVER_URL in the future. Possible breaking change.
  if (config.nugetRegistries && config.nugetRegistries.length > 0) {
    return config.nugetRegistries.map((registry) => {
      const normalized: RegistryConfig = { ...registry };
      if (normalized.type === undefined || normalized.type === null || (normalized.type as unknown as string) === "") {
        normalized.type = "nuget";
      }

      if (typeof normalized.name === "string") {
        normalized.name = normalized.name.trim();
      }

      if (typeof normalized.url === "string") {
        normalized.url = normalized.url.trim();
      }

      if (normalized.type === "nuget") {
        normalized.name ??= "nuget";
        normalized.url ??= "https://api.nuget.org/v3/index.json";
        normalized.tokenEnvVar ??= "NUGET_TOKEN";
      } else if (normalized.type === "gitlab") {
        // resolve url from env vars
        let projectId = process.env.CI_PROJECT_ID;
        let defaultEnvVar = "CI_JOB_TOKEN";

        if (config.gitlabRegistryProjectId) {
          projectId = config.gitlabRegistryProjectId.toString();
          defaultEnvVar = "NUGET_TOKEN";
        }

        normalized.name ??= "gitlab";
        normalized.tokenEnvVar ??= defaultEnvVar;
        normalized.url ??= `${process.env.CI_SERVER_URL}/api/v4/projects/${projectId}/packages/nuget/index.json`;
      }

      return normalized;
    });
  }

  // Legacy handling, to be removed in next major version
  const registries: RegistryConfig[] = [];

  if (config.skipPublishToNuget !== true) {
    registries.push({
      name: "nuget",
      url: config.nugetServer ?? "https://api.nuget.org/v3/index.json",
      tokenEnvVar: "NUGET_TOKEN",
      type: "nuget",
    });
  }

  if (config.publishToGitLab === true) {
    let projectId = process.env.CI_PROJECT_ID;

    if (config.gitlabRegistryProjectId) {
      projectId = config.gitlabRegistryProjectId.toString();
    }

    const url =
      process.env.CI_SERVER_URL && projectId
        ? `${process.env.CI_SERVER_URL}/api/v4/projects/${projectId}/packages/nuget/index.json`
        : "";

    // If user provides different GitLab project, CI_JOB_TOKEN may not be used, so we fall back to NUGET_TOKEN
    registries.push({
      name: "gitlab",
      url,
      tokenEnvVar: config.gitlabRegistryProjectId ? "NUGET_TOKEN" : "CI_JOB_TOKEN",
      user: config.gitlabRegistryProjectId ? config.gitlabUser : (config.gitlabUser ?? "gitlab-ci-token"),
      type: "gitlab",
    });
  }

  return registries;
};

export const packFailed = "EDOTNET_PACK_FAILED";
export const publishFailed = "EFAILED_TO_PUBLISH_NUGET_PACKAGE";
