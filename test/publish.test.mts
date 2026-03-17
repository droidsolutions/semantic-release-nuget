/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { execa, type ExecaError, type Options, type Result, type ResultPromise } from "execa";
import { PublishContext } from "semantic-release";
import { publishFailed } from "../src/Helper.mjs";
import type { publish as publishType } from "../src/publish.mjs";

jest.unstable_mockModule("execa", () => ({
  execa: jest.fn(),
}));

describe("publish", () => {
  let context: PublishContext;
  let execaMock: jest.Mock<typeof execa>;
  let publish: typeof publishType;
  const emptyResult: Partial<Result<Options>> = { stdout: "" };

  beforeAll(async () => {
    const logMock = jest.fn();
    context = {
      branch: { name: "main" },
      env: {},
      logger: { log: logMock, error: logMock } as any,
      nextRelease: {
        channel: "main",
        gitTag: "v1.0.0",
        name: "",
        notes: "",
        type: "major",
        gitHead: "",
        version: "1.0.0",
      },
    } as PublishContext;
    const execaImport = await import("execa");
    execaMock = execaImport.execa as unknown as jest.Mock<typeof execa>;

    const publishImport = await import("../src/publish.mjs");
    publish = publishImport.publish;

    process.env.CI_REGISTRY_USER = "its-a-me-mario";
    process.env.CI_REGISTRY_PASSWORD = "hunter2";
    process.env.NUGET_TOKEN = "104E4";
    process.env.CI_JOB_TOKEN = "some-ci-token";
    process.env.CI_PROJECT_ID = "132";
  });

  afterEach(() => {
    execaMock.mockReset();
  });

  beforeEach(() => {
    execaMock.mockResolvedValue(emptyResult as Result<Options>);
  });

  it("should call execa with the correct arguments when given minimum config", async () => {
    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
    expect(execaMock.mock.calls[2]).toEqual([
      "dotnet",
      ["nuget", "push", "-s", "nuget", "-k", "104E4", expect.stringMatching(/^[\w\\/-]+\/out\/\*.nupkg$/)],
      { stdio: "inherit" },
    ]);
  });

  it("should add argument for special NuGet server", async () => {
    await publish(
      {
        nugetRegistries: [
          {
            name: "special",
            url: "https://gitlab.com/mygroup/myproject",
            type: "nuget",
          },
        ],
        projectPath: "RootProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
    expect(execaMock.mock.calls[1]).toEqual([
      "dotnet",
      ["nuget", "add", "source", "https://gitlab.com/mygroup/myproject", "--name", "special"],
      { stdio: "inherit" },
    ]);
  });

  it("should use custom path to net if given", async () => {
    await publish(
      {
        dotnet: "/usr/lib64/dotnet",
        projectPath: "MyProject/MyProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
    expect(execaMock.mock.calls[2]).toEqual([
      "/usr/lib64/dotnet",
      ["nuget", "push", "-s", "nuget", "-k", "104E4", expect.stringMatching(/^[\w\\/-]+\/out\/\*.nupkg$/)],
      { stdio: "inherit" },
    ]);
  });

  it("should report error when pushing fails and mask nuget token", async () => {
    execaMock.mockResolvedValueOnce(emptyResult as Result<Options>);
    execaMock.mockImplementationOnce(() => {
      const result: Partial<ExecaError> = {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 1,
      };

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw result as ExecaError;
    });

    let thrown: any | undefined = undefined;
    try {
      await publish({ projectPath: ["a/path/to/project"] }, context);
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).not.toBeUndefined();
    expect(thrown.message).toBe("publish to registry https://api.nuget.org/v3/index.json failed with exit code 1");
    expect(thrown.code).toBe(publishFailed);
    expect(thrown.details).toBe("dotnet nuget push -s https://api.nuget.org/v3/index.json -k [REDACTED] out/*.nupkg");

    expect(execaMock).toHaveBeenCalledTimes(2);
  });

  it("should report error when execa throws", async () => {
    execaMock.mockResolvedValueOnce(emptyResult as Result<Options>);
    execaMock.mockImplementationOnce(() => {
      throw new Error();
    });

    let thrown: any | undefined = undefined;
    try {
      process.env.CI_SERVER_URL = "https://gitlab.example.com";
      await publish({ projectPath: ["a/path/to/project"], skipPublishToNuget: true, publishToGitLab: true }, context);
    } catch (err) {
      thrown = err as ExecaError;
    }

    expect(thrown).not.toBeUndefined();
    expect(thrown!.message).toBe(
      "publish to registry https://gitlab.example.com/api/v4/projects/132/packages/nuget/index.json failed",
    );
    expect(thrown!.code).toBe(publishFailed);
  });

  it("should not publish to nugetServer when skipPublishToNuget is true", async () => {
    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        skipPublishToNuget: true,
        publishToGitLab: false,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual(["dotnet", ["nuget", "list", "source", "--format", "Detailed"]]);
  });

  it("should publish to nugetServer when skipPublishToNuget is false", async () => {
    execaMock.mockResolvedValueOnce(emptyResult as Result<Options>);
    execaMock.mockImplementationOnce((_f: any, _a?: any, _o?: any) => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });

    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        skipPublishToNuget: false,
        publishToGitLab: false,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
  });

  it("should publish to nugetServer when skipPublishToNuget is not set", async () => {
    execaMock.mockResolvedValueOnce(emptyResult as Result<Options>);
    execaMock.mockImplementationOnce(() => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });

    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        publishToGitLab: false,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
  });

  it("should redact nuget token from command output", async () => {
    execaMock.mockResolvedValueOnce(emptyResult as Result<Options>);
    execaMock.mockImplementationOnce(() => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });

    (context.logger.log as jest.Mock).mockReset();

    await publish({ projectPath: ["a/path/to/project"] }, context);
    expect(context.logger.log).toHaveBeenCalledWith(expect.stringContaining("-k [REDACTED]"));

    // check that token is still in args passed to execa
    expect(execaMock).toHaveBeenCalledWith("dotnet", expect.arrayContaining(["104E4"]), { stdio: "inherit" });
  });

  it("should use gitlabRegistryProjectId over CI_PROJECT_ID if set", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        stdout:
          "dotnet nuget push -s https://gitlab.com/api/v4/projects/12345/packages/nuget/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<Result> as never;
    });
    execaMock.mockImplementationOnce(() => {
      return {
        command:
          "dotnet nuget push -s https://gitlab.com/api/v4/projects/12345/packages/nuget/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });

    process.env.CI_SERVER_URL = "https://gitlab.example.com";

    await publish(
      {
        gitlabRegistryProjectId: 12345,
        gitlabUser: "deploy-user",
        projectPath: "src/MyProject/MyProject.csproj",
        publishToGitLab: true,
        skipPublishToNuget: true,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
    expect(execaMock.mock.calls[1]).toEqual([
      "dotnet",
      [
        "nuget",
        "add",
        "source",
        "https://gitlab.example.com/api/v4/projects/12345/packages/nuget/index.json",
        "--name",
        "gitlab",
        "--username",
        "deploy-user",
        "--password",
        "104E4", // use NUGET_TOKEN when project ID is given, since CI_JOB_TOKEN can only push to the current project
        "--store-password-in-clear-text",
      ],
      { stdio: "inherit" },
    ]);
  });

  it("should update existing NuGet source", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        stdout: "Registered Sources:\n  1.  nuget [Enabled]\nhttps://api.nuget.org/v3/index.json\n",
        exitCode: 0,
      } as Partial<Result> as never;
    });
    execaMock.mockImplementationOnce(() => {
      return {
        command:
          "dotnet nuget push -s https://gitlab.com/api/v4/projects/12345/packages/nuget/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });
    execaMock.mockImplementationOnce(() => {
      return {
        command:
          "dotnet nuget push -s https://gitlab.com/api/v4/projects/12345/packages/nuget/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as Partial<ResultPromise> as never;
    });

    process.env.NUGET_TOKEN = "B00BF";

    await publish(
      {
        nugetRegistries: [
          {
            name: "nuget",
            url: "https://api.nuget.org/v3/index.json",
            type: "nuget",
          },
        ],
        projectPath: "src/MyProject/MyProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(3);
    expect(execaMock.mock.calls[1]).toEqual([
      "dotnet",
      ["nuget", "update", "source", "nuget", "-s", "https://api.nuget.org/v3/index.json"],
      { stdio: "inherit" },
    ]);
  });
});
