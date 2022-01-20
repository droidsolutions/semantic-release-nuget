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

  const project = resolve(pluginConfig.projectPath ?? "");
  try {
    const stats = await promises.stat(project);
    if (!stats.isFile()) {
      throw new Error(`The given project path ${project} is not a file.`);
    }
  } catch (err) {
    errors.push(new Error(`The given project path ${project} could not be found.`));
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
