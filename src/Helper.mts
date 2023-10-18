import { ExecaError } from "execa";

/**
 * Checks if the given object is an {@link ExecaError}.
 * @param err The error to check.
 * @returns True if the error is an ExecaError, false otherwise.
 */
export const isExecaError = (err: unknown): err is ExecaError<string> => {
  return (err as ExecaError<string>).exitCode !== undefined && (err as ExecaError<string>).command !== undefined;
};

export const packFailed = "EDOTNET_PACK_FAILED";
export const publishFailed = "EFAILED_TO_PUBLISH_NUGET_PACKAGE";
