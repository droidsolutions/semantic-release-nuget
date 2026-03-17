import SRError from "@semantic-release/error";
import { execa } from "execa";
import { promises } from "fs";
import { resolve } from "path";
import type { Config, VerifyConditionsContext } from "semantic-release";
import { normalizeRegistryConfig } from "./Helper.mjs";
import type { UserConfig } from "./UserConfig.mjs";

export const verify = async (pluginConfig: Config & UserConfig, _context: VerifyConditionsContext): Promise<void> => {
  const errors: Error[] = [];

  const registries = normalizeRegistryConfig(pluginConfig);

  if (registries.length === 0) {
    errors.push(new Error("No NuGet registries configured to publish to."));
  }

  for (const registry of registries) {
    if (!registry.url) {
      if (registry.type === "gitlab_private") {
        if (!process.env.CI_SERVER_URL) {
          errors.push(
            new Error(
              "CI_SERVER_URL environment variable is not set but needed for GitLab registry when url is not set.",
            ),
          );
        }
        if (!process.env.CI_PROJECT_ID) {
          errors.push(new Error("CI_PROJECT_ID environment variable is not set but needed for GitLab registry."));
        }
      } else if (registry.type === "github") {
        if (!process.env.GITHUB_REPOSITORY_OWNER) {
          errors.push(
            new Error("GITHUB_REPOSITORY_OWNER environment variable is not set but needed for GitHub registry."),
          );
        }
      }

      errors.push(new Error(`Registry ${registry.name} has no url configured.`));
    }

    if (registry.type === "github" && !registry.user) {
      if (!process.env.GITHUB_ACTOR) {
        errors.push(new Error("GITHUB_ACTOR environment variable is not set but needed for GitHub registry."));
      }
    }

    if (!registry.tokenEnvVar) {
      if (registry.type === "gitlab_private") {
        if (!process.env.CI_JOB_TOKEN && !process.env.NUGET_TOKEN) {
          errors.push(new Error("Environment variable CI_JOB_TOKEN or NUGET_TOKEN must be set for GitLab registry."));
        }
      } else if (!process.env.NUGET_TOKEN) {
        errors.push(
          new Error(
            `Registry ${registry.name} has no token environment variable configured and NUGET_TOKEN is not set.`,
          ),
        );
      }
    } else if (!process.env[registry.tokenEnvVar]) {
      errors.push(new Error(`Environment variable ${registry.tokenEnvVar} for registry ${registry.name} is not set.`));
    }
  }

  if (pluginConfig.publishToGitLab) {
    if (!pluginConfig.gitlabRegistryProjectId && !process.env["CI_PROJECT_ID"]) {
      errors.push(new Error("Either CI_PROJECT_ID environment variable or gitlabRegistryProjectId must be set."));
    }

    if (pluginConfig.gitlabRegistryProjectId && !pluginConfig.gitlabUser) {
      errors.push(new Error("When a separate GitLab project ID is set, gitlabUser must also be set."));
    }
  }

  pluginConfig.projectPath = Array.isArray(pluginConfig.projectPath)
    ? pluginConfig.projectPath
    : [pluginConfig.projectPath];

  if (pluginConfig.projectPath.length < 1) {
    errors.push(new Error("No project files given."));
  }

  for (const project of pluginConfig.projectPath) {
    const projectPath = resolve(project ?? "");
    try {
      const stats = await promises.stat(projectPath);
      if (!stats.isFile()) {
        throw new Error(`The given project path ${projectPath} is not a file.`);
      }
    } catch (_) {
      errors.push(new Error(`The given project path ${projectPath} could not be found.`));
    }
  }

  const dotnet = pluginConfig.dotnet ?? "dotnet";

  try {
    await execa(dotnet, ["--info"], { stdio: "inherit" });
  } catch (_) {
    errors.push(new Error(`Unable to find dotnet executable in ${dotnet}`));
  }

  if (errors.length > 0) {
    const message = errors.map((err) => err.message).join("\n");
    // context.logger.error(message);
    throw new SRError("Verify failed", "VERIFY_FAILED", message);
  }
};
