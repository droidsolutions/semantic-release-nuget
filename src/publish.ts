/* eslint-disable @typescript-eslint/no-non-null-assertion */
import execa from "execa";
import { resolve, dirname } from "path";
import { Config, Context } from "semantic-release";
import { UserConfig } from "./UserConfig";

export const publish = async (pluginConfig: Config & UserConfig, context: Context): Promise<void> => {
  const dotnet = pluginConfig.dotnet || "dotnet";
  const registry = pluginConfig.nugetServer;
  const project = resolve(dirname(resolve(pluginConfig.projectPath)), "bin", "Release");
  const baseCliArgs: string[] = ["nuget", "push"];

  try {
    const cliArgs = [...baseCliArgs, "-k", process.env.NUGET_TOKEN!];
    if (registry) {
      cliArgs.push("-s", registry);
    }

    cliArgs.push(`${project}/*.nupkg`);

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

    const cliArgs = [...baseCliArgs, "--source", "gitlab", `${project}/*.nupkg`];

    context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

    await execa(dotnet, cliArgs, { stdio: "inherit" });
  } catch (error) {
    context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);
    throw error;
  }
};
