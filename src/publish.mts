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
    const token = process.env[registryConfig.tokenEnvVar]!;

    try {
      if (registryConfig.type === "nuget") {
        const cliArgs = [...baseCliArgs, "-s", registryConfig.url, "-k", token];

        cliArgs.push(join(packagePath, "*.nupkg"));

        const argStrings = cliArgs.map((value) => (value === token ? "[redacted]" : value)).join(" ");
        context.logger.log(`running command "${dotnet} ${argStrings}" ...`);

        await execa(dotnet, cliArgs, { stdio: "inherit" });
        continue;
      }

      const source = sources?.find((s) => s.url === registryConfig.url);
      let sourceName = registryConfig.name;

      if (source) {
        if (source.enabled) {
          context.logger.log(`A NuGet source with the needed url already exists, using source ${source.source}.`);
          sourceName = source.source;
        } else {
          context.logger.log(`Enabling the existing NuGet source ${source.source}.`);
          await execa(dotnet, ["nuget", "enable", "source", source.source], { stdio: "inherit" });
          sourceName = source.source;
        }
      } else {
        context.logger.log(`Adding a NuGet source for ${registryConfig.url}`);
        const sourceArgs = [
          "nuget",
          "add",
          "source",
          registryConfig.url,
          "--name",
          sourceName,
          "--store-password-in-clear-text",
          "--password",
          token,
        ];

        if (registryConfig.user) {
          sourceArgs.push("--username", registryConfig.user);
        }

        await execa(dotnet, sourceArgs, { stdio: "inherit" });
      }

      const cliArgs = [...baseCliArgs, "--source", sourceName, join(packagePath, "*.nupkg")];

      context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

      await execa(dotnet, cliArgs, { stdio: "inherit" });
    } catch (error) {
      context.logger.error(`${dotnet} push failed: ${(error as Error).message}`);

      if (isExecaError(error)) {
        let description = error.command;

        // hide token from SR output
        if (error.command?.includes(token)) {
          description = description.replace(token, "[redacted]");
        }

        throw new SemanticReleaseError(
          `publish to registry ${registryConfig.url} failed with exit code ${error.exitCode}`,
          publishFailed,
          description,
        );
      }

      throw new SemanticReleaseError(
        `publish to registry ${registryConfig.url} failed`,
        publishFailed,
        (error as Error).message,
      );
    }
  }
};
