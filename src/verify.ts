import execa from "execa";
import { promises } from "fs";
import { resolve } from "path";
import { Config, Context } from "semantic-release";
import { UserConfig } from "./UserConfig";

export const verify = async (pluginConfig: Config & UserConfig, _: Context): Promise<void> => {
  const errors: Error[] = [];
  for (const envVar of ["NUGET_TOKEN"]) {
    if (!process.env[envVar]) {
      errors.push(new Error(`Environment variable ${envVar} is not set.`));
    }
  }

  if (pluginConfig.publishToGitLab) {
    for (const envVar of ["CI_SERVER_URL", "CI_PROJECT_ID", "CI_JOB_TOKEN"]) {
      if (!process.env[envVar]) {
        errors.push(new Error(`GitLab environment variable ${envVar} is not set.`));
      }
    }
  }

  pluginConfig.projectPath = Array.isArray(pluginConfig.projectPath)
    ? pluginConfig.projectPath
    : [pluginConfig.projectPath];

  if (pluginConfig.projectPath.length < 1) {
    errors.push(new Error("No project files given"));
  }

  for (const project of pluginConfig.projectPath) {
    const projectPath = resolve(project ?? "");
    try {
      const stats = await promises.stat(projectPath);
      if (!stats.isFile()) {
        throw new Error(`The given project path ${projectPath} is not a file.`);
      }
    } catch (err) {
      errors.push(new Error(`The given project path ${projectPath} could not be found.`));
    }
  }

  const dotnet = pluginConfig.dotnet || "dotnet";

  try {
    await execa(dotnet, ["--info"], { stdio: "inherit" });
  } catch (err) {
    errors.push(new Error(`Unable to find dotnet executable in ${dotnet}`));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};
