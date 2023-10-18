import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { resolve, sep } from "path";
import { Config, PublishContext } from "semantic-release";
import { isExecaError, publishFailed } from "./Helper.mjs";
import { UserConfig } from "./UserConfig.mjs";

export const publish = async (pluginConfig: Config & UserConfig, context: PublishContext): Promise<void> => {
  const dotnet = pluginConfig.dotnet || "dotnet";
  const registry = pluginConfig.nugetServer ?? "https://api.nuget.org/v3/index.json";
  const packagePath = resolve("out");
  const baseCliArgs: string[] = ["nuget", "push"];
  const token: string = process.env.NUGET_TOKEN!;

  if (pluginConfig.skipPublishToNuget) {
    context.logger.log("Skipping publish to NuGet server because skipPublishToNuget is set to true.");
  } else {
    try {
      const cliArgs = [...baseCliArgs, "-s", registry, "-k", token];

      cliArgs.push(`${packagePath}${sep}*.nupkg`);

      const argStrings = cliArgs.map((value) => (value === token ? "[redacted]" : value)).join(" ");
      context.logger.log(`running command "${dotnet} ${argStrings}" ...`);

      await execa(dotnet, cliArgs, { stdio: "inherit" });
    } catch (error) {
      context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);

      if (isExecaError(error)) {
        let description = error.command;

        // hide token from SR output
        if (error.command && error.command.includes(token)) {
          description = description.replace(token, "[redacted]");
        }

        throw new SemanticReleaseError(
          `publish to registry ${registry} failed with exit code ${error.exitCode}`,
          publishFailed,
          description,
        );
      }

      throw new SemanticReleaseError(`publish to registry ${registry} failed`, publishFailed, (error as Error).message);
    }
  }

  if (pluginConfig.publishToGitLab !== true) {
    return;
  }

  try {
    let projectId = parseInt(process.env.CI_PROJECT_ID as string, 10);
    let gitlabToken = process.env.CI_JOB_TOKEN as string;
    let gitlabUser = "gitlab-ci-token";

    if (pluginConfig.gitlabRegistryProjectId) {
      projectId = pluginConfig.gitlabRegistryProjectId;
      gitlabToken = token;
      gitlabUser = pluginConfig.gitlabUser!;
    }

    const url = `${process.env.CI_SERVER_URL!}/api/v4/projects/${projectId}/packages/nuget/index.json`;
    context.logger.log(`Adding GitLab as NuGet source ${url}`);
    await execa(
      dotnet,
      [
        "nuget",
        "add",
        "source",
        url,
        "--name",
        "gitlab",
        "--username",
        gitlabUser,
        "--password",
        gitlabToken,
        "--store-password-in-clear-text",
      ],
      { stdio: "inherit" },
    );

    const cliArgs = [...baseCliArgs, "--source", "gitlab", `${packagePath}/*.nupkg`];

    context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

    await execa(dotnet, cliArgs, { stdio: "inherit" });
  } catch (error) {
    context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);
    if (isExecaError(error)) {
      throw new SemanticReleaseError(
        `publish to GitLab failed with exit code ${error.exitCode}`,
        publishFailed,
        error.command,
      );
    }

    throw new SemanticReleaseError("publish to GitLab failed", publishFailed, (error as Error).message);
  }
};
