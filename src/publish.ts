/* eslint-disable @typescript-eslint/no-non-null-assertion */
import execa, { ExecaReturnBase } from "execa";
import { resolve } from "path";
import { Config, Context } from "semantic-release";
import { UserConfig } from "./UserConfig";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SemanticReleaseError = require("@semantic-release/error");

export const publish = async (pluginConfig: Config & UserConfig, context: Context): Promise<void> => {
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

      cliArgs.push(`${packagePath}/*.nupkg`);

      const argStrings = cliArgs.map((value) => (value === token ? "[redacted]" : value)).join(" ");
      context.logger.log(`running command "${dotnet} ${argStrings}" ...`);

      await execa(dotnet, cliArgs, { stdio: "inherit" });
    } catch (error) {
      context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);

      if (typeof error === "object" && (error as ExecaReturnBase<void>).exitCode) {
        const err = error as ExecaReturnBase<void>;
        let description = err.command;

        // hide token from SR output
        if (err.command && err.command.includes(token)) {
          description = description.replace(token, "[redacted]");
        }

        throw new SemanticReleaseError(`publish to registry ${registry} failed`, err.exitCode, description);
      }
    }
  }

  if (pluginConfig.publishToGitLab !== true) {
    return;
  }

  try {
    let projectId = process.env.CI_PROJECT_ID as string;
    let gitlabToken = process.env.CI_JOB_TOKEN as string;

    if (pluginConfig.gitlabRegistryProjectId) {
      projectId = pluginConfig.gitlabRegistryProjectId;
      gitlabToken = token;
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
        "gitlab-ci-token",
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
    throw new SemanticReleaseError(
      "publish to GitLab failed",
      (error as ExecaReturnBase<void>).exitCode,
      (error as ExecaReturnBase<void>).command,
    );
  }
};
