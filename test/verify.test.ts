import execa, { ExecaReturnBase } from "execa";
import { Context } from "semantic-release";
import { UserConfig } from "../src/UserConfig";
import { verify } from "../src/verify";

type SemanticReleaeError = { details: string };

jest.mock("execa");

describe("verify", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let context: Context;
  let execaMock: jest.Mock<ExecaReturnBase<string>, unknown[]>;

  beforeAll(() => {
    originalEnv = process.env;
    const logMock = jest.fn<void, unknown[]>();
    context = {
      branch: { name: "main" },
      env: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { log: logMock, error: logMock } as any,
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    };
    execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, unknown[]>;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should report an error when NUGET_TOKEN is no set", async () => {
    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Environment variable NUGET_TOKEN is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_SERVER_URL is set", async () => {
    delete process.env.CI_SERVER_URL;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_PROJECT_ID = "132";
    process.env.CI_JOB_TOKEN = "a3lhjli";

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("GitLab environment variable CI_SERVER_URL is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_PROJECT_ID is set", async () => {
    delete process.env.CI_PROJECT_ID;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe(
      "Either CI_PROJECT_ID environment variable or gitlabRegistryProjectId must be set.",
    );
  });

  it("should report an error when publishToGitLab is true and no CI_JOB_TOKEN is set", async () => {
    delete process.env.CI_JOB_TOKEN;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";
    process.env.CI_PROJECT_ID = "132";

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("GitLab environment variable CI_JOB_TOKEN is not set.");
  });

  it("should report an error when publishToGitlab is false and skipPublishToNuget is true", async () => {
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify(
        { publishToGitLab: false, skipPublishToNuget: true, projectPath: "test/fixture/some.csproj" } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe(
      "skipPublishToNuget is set to true, but publishToGitLab is not set to true so the package will not be published anywhere.",
    );
  });

  it("should report an error if path to non existing project file is given", async () => {
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify(
        { projectPath: ["test/fixture/some-missing.csproj", "test/fixture/some.csproj"] } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toMatch(
      /The given project path.*test\/fixture\/some-missing.csproj could not be found./,
    );
  });

  it("should report an error if dotnet executable can not be found", async () => {
    process.env.NUGET_TOKEN = "104E2";
    execaMock.mockImplementationOnce(() => {
      throw new Error("Some error");
    });

    let actualErr: SemanticReleaeError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaeError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Unable to find dotnet executable in dotnet");
  });

  it("should not complain about missing NUGET_TOKEN when skipPublishToNuget is true", async () => {
    delete process.env.NUGET_TOKEN;
    process.env.CI_SERVER_URL = "gitlab.com";
    process.env.CI_PROJECT_ID = "132";
    process.env.CI_JOB_TOKEN = "a3lhjli";

    const promise = verify(
      { projectPath: "test/fixture/some.csproj", skipPublishToNuget: true, publishToGitLab: true } as UserConfig,
      context,
    );

    await expect(promise).resolves.toBeUndefined();
  });
});
