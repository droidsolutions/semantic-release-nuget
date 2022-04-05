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
      env: {},
      logger: { log: logMock, error: logMock },
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    };
    execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;

    process.env.CI_REGISTRY_USER = "its-a-me-mario";
    process.env.CI_REGISTRY_PASSWORD = "hunter2";
    process.env.NUGET_TOKEN = "104E4";
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
});
