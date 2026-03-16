/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { join, resolve } from "path";
import type { Config, PublishContext } from "semantic-release";
import { extractNugetSourcesFromListOutput, isExecaError, normalizeRegistryConfig, publishFailed } from "./Helper.mjs";
import type { NuGetSource } from "./NuGetSource.mjs";
import type { UserConfig } from "./UserConfig.mjs";

export const publish = async (pluginConfig: Config & UserConfig, context: PublishContext): Promise<void> => {
  const dotnet = pluginConfig.dotnet ?? "dotnet";
  const packagePath = resolve("out");
  const baseCliArgs: string[] = ["nuget", "push"];

  const registries = normalizeRegistryConfig(pluginConfig);

  let sources: NuGetSource[] = [];
  try {
    const { stdout } = await execa(dotnet, ["nuget", "list", "source"]);
    sources = extractNugetSourcesFromListOutput(stdout);
  } catch (err) {
    context.logger.error(`Failed to list NuGet sources: ${(err as Error).message}`);
  }

  for (const registryConfig of registries) {
    const token: string = process.env[registryConfig.tokenEnvVar!]!;

    try {
      // if (registryConfig.type === "nuget") {
      //   const cliArgs: string[] = [...baseCliArgs, "-s", registryConfig.url!, "-k", token];

      //   cliArgs.push(join(packagePath, "*.nupkg"));

      //   const argStrings = cliArgs.join(" ");
      //   context.logger.log(redactToken(`running command "${dotnet} ${argStrings}" ...`, token));

      //   await execa(dotnet, cliArgs, {stdio: "inherit"});
      //   continue;
      // }

      const source = sources?.find((s) => s.url === registryConfig.url);
      let sourceName = registryConfig.name!;
      let sourceAction: "add" | "update" = "add";
      const sourceSpecificArgs: string[] = [];

      if (source) {
        if (source.enabled) {
          context.logger.log(`A NuGet source with the needed url already exists, using source ${source.source}.`);
          sourceName = source.source;
        } else {
          context.logger.log(`Enabling the existing NuGet source ${source.source}.`);
          await execa(dotnet, ["nuget", "enable", "source", source.source], { stdio: "inherit" });
          sourceName = source.source;
        }

        sourceAction = "update";
        sourceSpecificArgs.push(sourceName, "-s", registryConfig.url!);
      } else {
        context.logger.log(`Adding a NuGet source for ${registryConfig.url}`);
        sourceAction = "add";
        sourceSpecificArgs.push(registryConfig.url!, "--name", sourceName);
      }

      const sourceAddOrUpdateArgs = ["nuget", sourceAction, "source", ...sourceSpecificArgs];

      if (registryConfig.user) {
        sourceAddOrUpdateArgs.push("--username", registryConfig.user);
      }

      sourceAddOrUpdateArgs.push("--password", token, "--store-password-in-clear-text");
      await execa(dotnet, sourceAddOrUpdateArgs, { stdio: "inherit" });

      const cliArgs: string[] = [...baseCliArgs, "-s", sourceName, "-k", token, join(packagePath, "*.nupkg")];

      context.logger.log(redactToken(`running command "${dotnet} ${cliArgs.join(" ")}" ...`, token));

      await execa(dotnet, cliArgs, { stdio: "inherit" });
    } catch (error) {
      const message = redactToken(`${dotnet} push failed: ${(error as Error).message}`, token);
      context.logger.error(message);

      if (isExecaError(error)) {
        const description = redactToken(error.command, token);

        throw new SemanticReleaseError(
          `publish to registry ${registryConfig.url} failed with exit code ${error.exitCode}`,
          publishFailed,
          description,
        );
      }

      throw new SemanticReleaseError(`publish to registry ${registryConfig.url} failed`, publishFailed, message);
    }
  }
};

const redactToken = (message: string, token: string): string => {
  return message.replaceAll(token, "[REDACTED]");
};
