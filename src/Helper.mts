import { ExecaError } from "execa";

/**
 * Checks if the given object is an {@link ExecaError}.
 * @param err The error to check.
 * @returns True if the error is an ExecaError, false otherwise.
 */
export const isExecaError = (err: unknown): err is ExecaError => {
  return (err as ExecaError).exitCode !== undefined && (err as ExecaError).command !== undefined;
};

export interface NuGetSource {
  index: number;
  enabled: boolean;
  source: string;
  url: string;
}

/**
 * Extracts the NuGet sources from the given output.
 * @param output The output from the "dotnet nuget sources list" command.
 * @returns The extracted sources.
 */
export const extractNugetSourcesFromListOutput = (output: string): NuGetSource[] => {
  const regex = new RegExp(/^\s+(\d+).\s+(.+)\s\[(Enabled|Disabled)\]\s+([^\s]+)$/, "gm");

  // check in each matches if one contains the given url
  let match: RegExpExecArray | null;
  const sources: NuGetSource[] = [];
  while ((match = regex.exec(output)) !== null) {
    if (match.length !== 5) {
      continue;
    }

    const index = parseInt(match[1]!, 10);

    sources.push({ index, source: match[2]!, enabled: match[3] === "Enabled", url: match[4]! });
  }

  return sources;
};

export const packFailed = "EDOTNET_PACK_FAILED";
export const publishFailed = "EFAILED_TO_PUBLISH_NUGET_PACKAGE";
