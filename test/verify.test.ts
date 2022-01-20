import execa, { ExecaReturnBase } from "execa";
import { Context } from "semantic-release";
import { UserConfig } from "../src/UserConfig";
import { verify } from "../src/verify";

jest.mock("execa");

describe("verify", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let context: Context;
  let execaMock: jest.Mock<ExecaReturnBase<string>, unknown[]>;

  beforeAll(() => {
    originalEnv = process.env;
    const logMock = jest.fn<void, unknown[]>();
    context = {
      env: {},
      logger: { log: logMock, error: logMock },
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    };
    execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, unknown[]>;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should report an error when NUGET_TOKEN is no set", async () => {
    let actualErr: AggregateError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toBe("Environment variable NUGET_TOKEN is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_SERVER_URL is set", async () => {
    delete process.env.CI_SERVER_URL;
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: AggregateError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toBe("GitLab environment variable CI_SERVER_URL is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_PROJECT_ID is set", async () => {
    delete process.env.CI_PROJECT_ID;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";

    let actualErr: AggregateError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toBe("GitLab environment variable CI_PROJECT_ID is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_JOB_TOKEN is set", async () => {
    delete process.env.CI_JOB_TOKEN;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";
    process.env.CI_PROJECT_ID = "132";

    let actualErr: AggregateError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toBe("GitLab environment variable CI_JOB_TOKEN is not set.");
  });

  it("should report an error if path to non existing project file is given", async () => {
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: AggregateError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some-missing.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toMatch(
      /The given project path.*test\/fixture\/some-missing.csproj could not be found./,
    );
  });

  it("should report an error if dotnet executable can not be found", async () => {
    process.env.NUGET_TOKEN = "104E2";
    execaMock.mockImplementationOnce(() => {
      throw new Error("Some error");
    });

    let actualErr: AggregateError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as AggregateError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.errors[0].message).toBe("Unable to find dotnet executable in dotnet");
  });
});
