import execa, { ExecaReturnBase } from "execa";
import { Context } from "semantic-release";
import { publish } from "../src/publish";

jest.mock("execa");

describe("publish", () => {
  let context: Context;
  let execaMock: jest.Mock<ExecaReturnBase<string>, never[]>;

  beforeAll(() => {
    const logMock = jest.fn<void, unknown[]>();
    context = {
      branch: { name: "main" },
      env: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { log: logMock, error: logMock } as any,
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    };
    execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;

    process.env.CI_REGISTRY_USER = "its-a-me-mario";
    process.env.CI_REGISTRY_PASSWORD = "hunter2";
    process.env.NUGET_TOKEN = "104E4";
    process.env.CI_PROJECT_ID = "132";
  });

  afterEach(() => {
    execaMock.mockReset();
  });

  it("should call execa with the correct arguments when given minimum config", async () => {
    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      [
        "nuget",
        "push",
        "-s",
        "https://api.nuget.org/v3/index.json",
        "-k",
        "104E4",
        expect.stringMatching(/^[\w\\/-]+\/out\/\*.nupkg$/),
      ],
      { stdio: "inherit" },
    ]);
  });

  it("should add argument for special NuGet server", async () => {
    await publish(
      {
        nugetServer: "https://gitlab.com/mygroup/myproject",
        projectPath: "RootProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      [
        "nuget",
        "push",
        "-s",
        "https://gitlab.com/mygroup/myproject",
        "-k",
        "104E4",
        expect.stringMatching(/^[\w\\/-]+\/out\/\*.nupkg$/),
      ],
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

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "/usr/lib64/dotnet",
      [
        "nuget",
        "push",
        "-s",
        "https://api.nuget.org/v3/index.json",
        "-k",
        "104E4",
        expect.stringMatching(/^[\w\\/-]+\/out\/\*.nupkg$/),
      ],
      { stdio: "inherit" },
    ]);
  });

  it("should report error when pushing fails and mask nuget token", async () => {
    execaMock.mockImplementationOnce(() => {
      const result: Partial<ExecaReturnBase<void>> = {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 1,
      };
      throw result;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let thrown: any | undefined = undefined;
    try {
      await publish({ projectPath: ["a/path/to/project"] }, context);
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).not.toBeUndefined();
    expect(thrown.message).toBe("publish to registry https://api.nuget.org/v3/index.json failed");
    expect(thrown.code).toBe(1);
    expect(thrown.details).toBe("dotnet nuget push -s https://api.nuget.org/v3/index.json -k [redacted] out/*.nupkg");

    expect(execaMock).toHaveBeenCalledTimes(1);
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

    expect(execaMock).not.toHaveBeenCalled();
  });

  it("should publish to nugetServer when skipPublishToNuget is false", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as ExecaReturnBase<string>;
    });

    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        skipPublishToNuget: false,
        publishToGitLab: false,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
  });

  it("should publish to nugetServer when skipPublishToNuget is not set", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as ExecaReturnBase<string>;
    });

    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        publishToGitLab: false,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
  });

  it("should redact nuget token from command output", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        command: "dotnet nuget push -s https://api.nuget.org/v3/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as ExecaReturnBase<string>;
    });

    (context.logger.log as jest.Mock<void, unknown[]>).mockReset();

    await publish({ projectPath: ["a/path/to/project"] }, context);
    expect(context.logger.log).toHaveBeenCalledWith(expect.stringContaining("-k [redacted]"));

    // check that token is still in args passed to execa
    expect(execaMock).toHaveBeenCalledWith("dotnet", expect.arrayContaining(["104E4"]), { stdio: "inherit" });
  });

  it("should use gitlabRegistryProjectId over CI_PROJECT_ID if set", async () => {
    execaMock.mockImplementationOnce(() => {
      return {
        command:
          "dotnet nuget push -s https://gitlab.com/api/v4/projects/12345/packages/nuget/index.json -k 104E4 out/*.nupkg",
        exitCode: 0,
      } as ExecaReturnBase<string>;
    });

    process.env.CI_SERVER_URL = "https://gitlab.example.com";

    await publish(
      {
        projectPath: "src/MyProject/MyProject.csproj",
        publishToGitLab: true,
        gitlabRegistryProjectId: "12345",
        skipPublishToNuget: true,
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(2);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      [
        "nuget",
        "add",
        "source",
        "https://gitlab.example.com/api/v4/projects/12345/packages/nuget/index.json",
        "--name",
        "gitlab",
        "--username",
        "gitlab-ci-token",
        "--password",
        process.env.NUGET_TOKEN, // use NuGet token in this case
        "--store-password-in-clear-text",
      ],
      { stdio: "inherit" },
    ]);
  });
});
