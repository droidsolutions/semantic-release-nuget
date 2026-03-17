import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { readdir } from "node:fs/promises";
import { join, resolve } from "path";
import type { Config, PublishContext, Release, VerifyReleaseContext } from "semantic-release";
import { extractNugetSourcesFromListOutput, isExecaError, normalizeRegistryConfig, publishFailed } from "./Helper.mjs";
import type { NuGetSource } from "./NuGetSource.mjs";
import { RegistryConfig } from "./RegistryConfig.mjs";
import type { UserConfig } from "./UserConfig.mjs";

export const publish = async (pluginConfig: Config & UserConfig, context: PublishContext): Promise<Release | void> => {
  const dotnet = pluginConfig.dotnet ?? "dotnet";
  const packagePath = resolve("out");
  const baseCliArgs: string[] = ["nuget", "push"];

  const packageId = await getFirstPackageNameAync(packagePath, context.nextRelease.version);

  const release: Release = {
    gitHead: context.nextRelease.gitHead,
    gitTag: context.nextRelease.gitTag,
    name: packageId,
    notes: context.nextRelease.notes ?? "NuGet package",
    type: context.nextRelease.type,
    version: context.nextRelease.version,
    pluginName: "@droidsolutions-oss/semantic-release-nuget",
  };

  const registries = normalizeRegistryConfig(pluginConfig);

  // Parse sources from nuget.config
  let sources: NuGetSource[] = [];
  try {
    const { stdout } = await execa(dotnet, ["nuget", "list", "source", "--format", "Detailed"]);
    sources = extractNugetSourcesFromListOutput(stdout);
  } catch (err) {
    context.logger.error(`Failed to list NuGet sources: ${(err as Error).message}`);
  }

  // For each registry, prepare the source and push the package.
  for (const registryConfig of registries) {
    context.logger.log(`Publishing to registry ${registryConfig.url} using config ${registryConfig.name} ...`);
    const token: string = process.env[registryConfig.tokenEnvVar!]!;

    try {
      const sourceName = await prepareSourceAsync(sources, registryConfig, context, dotnet, token);

      const cliArgs: string[] = [...baseCliArgs, "-s", sourceName, "-k", token, join(packagePath, "*.nupkg")];

      context.logger.log(redactToken(`running command "${dotnet} ${cliArgs.join(" ")}" ...`, token));

      await execa(dotnet, cliArgs, { stdio: "inherit" });

      if (registryConfig.type === "nuget") {
        // For NuGet.org we can determine the release URL.
        release.url = `https://www.nuget.org/packages/${packageId}/${context.nextRelease.version}`;
      }

      if (registryConfig.type === "github" && release.url === undefined) {
        // If we don't already have a NuGet package, we can use the GitHub package if there is one.
        // Unfortunately GitHub package links have an arbitrary ID, so we can only link to the general package page.
        // This is something like <orga>/<repo>/pkgs/nuget/<packageId>.
        // Example: https://github.com/droidsolutions/semantic-version/pkgs/nuget/DroidSolutions.Oss.SemanticVersion
        release.url = `https://github.com/${context.env.GITHUB_REPOSITORY_OWNER}/${context.env.GITHUB_REPOSITORY}/pkgs/nuget/${packageId}`;
      }
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

  if (release.url !== undefined) {
    return release;
  }
};

const redactToken = (message: string, token: string): string => {
  return message.replaceAll(token, "[REDACTED]");
};

/**
 * Prepares a NuGet source for publishing by either adding a new source or updating an existing one with the given
 * registry configuration.
 * @param sources A list of sources parsed from 'dotnet nuget list source'.
 * @param registryConfig The registry configurations.
 * @param context The Semantic Release context.
 * @param dotnet The dotnet executable.
 * @param token The authentication token for the NuGet server.
 * @returns The name of the source that was prepared for publish.
 */
async function prepareSourceAsync(
  sources: NuGetSource[],
  registryConfig: RegistryConfig,
  context: VerifyReleaseContext,
  dotnet: string,
  token: string,
) {
  // First check if a source with the given url is already in nuget.config.
  // Try to find an enabled source first, if not possible, use a disabled one.
  let sourceEntry = sources?.find((s) => s.url === registryConfig.url && s.enabled);
  sourceEntry ??= sources?.find((s) => s.url === registryConfig.url);
  let sourceName = registryConfig.name!; // use given name from config as default
  let sourceAction: "add" | "update";
  const sourceSpecificArgs: string[] = [];

  if (sourceEntry) {
    // If a source exists, update it
    if (sourceEntry.enabled) {
      sourceName = sourceEntry.source;
      context.logger.log(`A NuGet source with the needed url already exists, using source ${sourceName}.`);
    } else {
      sourceName = sourceEntry.source;
      context.logger.log(`Temporary enabling the existing NuGet source ${sourceName}.`);
      await execa(dotnet, ["nuget", "enable", "source", sourceName], { stdio: "inherit" });
    }

    sourceAction = "update";
    sourceSpecificArgs.push(sourceName, "-s", registryConfig.url!);
  } else {
    // If no source exists, temporary add one
    context.logger.log(`Adding a NuGet source for ${registryConfig.url}`);
    sourceAction = "add";
    sourceSpecificArgs.push(registryConfig.url!, "--name", sourceName);
  }

  // Command looks like dotnet nuget update <sourceName> -s <sourceUrl> ...
  // or dotnet nuget add <sourceUrl> --name <sourceName> ...
  const sourceAddOrUpdateArgs = ["nuget", sourceAction, "source", ...sourceSpecificArgs];

  // For the official NuGet only API token is needed, so we don't have to update the NuGet source here.
  if (registryConfig.type !== "nuget") {
    if (registryConfig.user) {
      sourceAddOrUpdateArgs.push("--username", registryConfig.user);
    }

    // Add/Update the source with the token as password. --store-password-in-clear-text is required when running in CI,
    // but it should not be persisted anyway.
    sourceAddOrUpdateArgs.push("--password", token, "--store-password-in-clear-text");
  }

  await execa(dotnet, sourceAddOrUpdateArgs, { stdio: "inherit" });

  return sourceName;
}

/**
 * Gets the name of the first NuGet package found in the given path that matches the new version.
 * @param packagePath The path to the NuGet package files.
 * @param newVersion The new Semantic Release version.
 * @returns The name of the package.
 */
async function getFirstPackageNameAync(packagePath: string, newVersion: string): Promise<string | undefined> {
  const files = await readdir(packagePath);
  const nupkg = files.find((f) => f.endsWith(".nupkg") && !f.endsWith(".symbols.nupkg") && f.includes(newVersion));
  if (!nupkg) {
    return undefined;
  }

  // Package name is something like <namespace>.<project>.<version>.nupkg.
  // It could also contain pre-release suffixes, e.g. `DroidSolutions.Oss.SemanticVersion.1.6.0-develop.4.nupkg`.
  // Try to extract the version, and everything before the version is considered the package name.
  // But we already have the version from Semantic Release.
  return nupkg.replace(`.${newVersion}.nupkg`, "");
}
