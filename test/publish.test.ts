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
      ["nuget", "push", "-k", "104E4", expect.stringMatching(/^[\w\\/-]+\/src\/MyProject\/bin\/Release\/\*.nupkg$/)],
      { stdio: "inherit" },
    ]);
  });

  it("should add argument for special NuGet server", async () => {
    await publish(
      {
        nugetServer: "a",
        projectPath: "RootProject.csproj",
      },
      context,
    );

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      ["nuget", "push", "-k", "104E4", "-s", "a", expect.stringMatching(/^[\w\\/-]+\/bin\/Release\/\*.nupkg$/)],
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
      ["nuget", "push", "-k", "104E4", expect.stringMatching(/^[\w\\/-]+\/MyProject\/bin\/Release\/\*.nupkg$/)],
      { stdio: "inherit" },
    ]);
  });
});
