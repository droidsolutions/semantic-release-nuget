import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { ExecaChildProcess, ExecaError, execa } from "execa";
import { resolve } from "path";
import type { PrepareContext } from "semantic-release";
import type { prepare as prepareType } from "../src/prepare.mjs";

jest.unstable_mockModule("execa", () => ({
  execa: jest.fn(),
}));

describe("prepare", () => {
  let context: PrepareContext;
  let prepare: typeof prepareType;
  let execaMock: jest.Mock<typeof execa>;

  beforeAll(async () => {
    const logMock = jest.fn();
    context = {
      branch: { name: "main" },
      env: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { log: logMock, error: logMock } as any,
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    } as PrepareContext;

    const execaImport = await import("execa");
    execaMock = execaImport.execa as unknown as jest.Mock<typeof execa>;

    const prepareImport = await import("../src/prepare.mjs");
    prepare = prepareImport.prepare;
  });

  afterEach(async () => {
    execaMock.mockReset();
  });

  it("should call pack with the correct arguments", async () => {
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaChildProcess<Buffer>);

    await prepare({ dotnet: "a", projectPath: "b" }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "a",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out"]),
      { stdio: "inherit" },
    ]);
  });

  it("should use default dotnet command if not given", async () => {
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaChildProcess<Buffer>);

    await prepare({ projectPath: "b" }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out"]),
      { stdio: "inherit" },
    ]);
  });

  it("should add include-source flag if set", async () => {
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaChildProcess<Buffer>);

    await prepare({ projectPath: "b", includeSource: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out", "--include-source"]),
      { stdio: "inherit" },
    ]);
  });

  it("should add include-symbols flag if set", async () => {
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaChildProcess<Buffer>);

    await prepare({ projectPath: "b", includeSymbols: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining([
        "pack",
        resolve("b"),
        "-c",
        "Release",
        "-o",
        "out",
        "--include-symbols",
        "-p:SymbolPackageFormat=snupkg",
      ]),
      { stdio: "inherit" },
    ]);
  });

  it("should throw when command throws", async () => {
    execaMock.mockImplementationOnce(() => {
      throw new Error("Something went wrong.");
    });

    await expect(prepare({ projectPath: "b", includeSymbols: true }, context)).rejects.toThrow("dotnet pack failed");
  });

  it("should throw when command fails", async () => {
    execaMock.mockImplementationOnce(() => {
      const result: Partial<ExecaError> = {
        command: "dotnet pack",
        exitCode: 1,
      };
      throw result;
    });

    await expect(prepare({ projectPath: "b", includeSymbols: true }, context)).rejects.toThrow(
      "dotnet pack failed with exit code 1",
    );
  });

  it("should add PackageVersion argument when usePackageVersion is set to true", async () => {
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaChildProcess<Buffer>);

    await prepare({ projectPath: "src/SomeProject/SomeProject.csproj", usePackageVersion: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining([
        "pack",
        resolve("src/SomeProject/SomeProject.csproj"),
        "-c",
        "Release",
        "-o",
        "out",
        "-p:PackageVersion=1.0.0",
      ]),
      { stdio: "inherit" },
    ]);
  });
});
