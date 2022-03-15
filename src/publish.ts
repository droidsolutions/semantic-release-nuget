/* eslint-disable @typescript-eslint/no-non-null-assertion */
import execa from "execa";
import { resolve } from "path";
import { Config, Context } from "semantic-release";
import { UserConfig } from "./UserConfig";

export const publish = async (pluginConfig: Config & UserConfig, context: Context): Promise<void> => {
  const dotnet = pluginConfig.dotnet || "dotnet";
  const registry = pluginConfig.nugetServer ?? "https://api.nuget.org/v3/index.json";
  const packagePath = resolve("out");
  const baseCliArgs: string[] = ["nuget", "push"];

  try {
    const cliArgs = [...baseCliArgs, "-s", registry, "-k", process.env.NUGET_TOKEN!];

    cliArgs.push(`${packagePath}/*.nupkg`);

    context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

    await execa(dotnet, cliArgs, { stdio: "inherit" });
  } catch (error) {
    context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);
    throw error;
  }

  if (pluginConfig.publishToGitLab !== true) {
    return;
  }

  try {
    const url = `${process.env.CI_SERVER_URL!}/api/v4/projects/${process.env.CI_PROJECT_ID!}/packages/nuget/index.json`;
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
        process.env.CI_JOB_TOKEN!,
        "--store-password-in-clear-text",
      ],
      { stdio: "inherit" },
    );

    const cliArgs = [...baseCliArgs, "--source", "gitlab", `${packagePath}/*.nupkg`];

    context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

    await execa(dotnet, cliArgs, { stdio: "inherit" });
  } catch (error) {
    context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);
    throw error;
  }
};
