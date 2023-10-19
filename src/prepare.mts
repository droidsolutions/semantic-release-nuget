import SRError from "@semantic-release/error";
import { execa } from "execa";
import { resolve } from "path";
import { Config, PrepareContext } from "semantic-release";
import { isExecaError, packFailed } from "./Helper.mjs";
import { UserConfig } from "./UserConfig.mjs";

export const prepare = async (pluginConfig: Config & UserConfig, context: PrepareContext): Promise<void> => {
  const dotnet = pluginConfig.dotnet || "dotnet";

  try {
    pluginConfig.projectPath = Array.isArray(pluginConfig.projectPath)
      ? pluginConfig.projectPath
      : [pluginConfig.projectPath];

    for (const projectPath of pluginConfig.projectPath as string[]) {
      const project = resolve(projectPath);

      const cliArgs = ["pack", project, "-c", "Release", "-o", "out"];
      if (pluginConfig.includeSource === true) {
        cliArgs.push("--include-source");
      }
      if (pluginConfig.includeSymbols === true) {
        cliArgs.push("--include-symbols", "-p:SymbolPackageFormat=snupkg");
      }

      if (pluginConfig.usePackageVersion === true) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cliArgs.push(`-p:PackageVersion=${context.nextRelease!.version}`);
      }

      if (pluginConfig.dotnetVerbosity) {
        cliArgs.push("-v", pluginConfig.dotnetVerbosity);
      }

      context.logger.log(`running command "${dotnet} ${cliArgs.join(" ")}" ...`);

      await execa(dotnet, cliArgs, { stdio: "inherit" });
    }
  } catch (err) {
    context.logger.error(`${dotnet} pack failed: ${(err as Error).message}`);
    if (isExecaError(err)) {
      throw new SRError(`${dotnet} pack failed with exit code ${err.exitCode}`, packFailed, err.command);
    }

    throw new SRError(`${dotnet} pack failed: ${(err as Error).message}`, packFailed);
  }
};
