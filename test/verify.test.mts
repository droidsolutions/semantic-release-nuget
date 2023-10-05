import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type SemanticReleaseError from "@semantic-release/error";
import type { execa as execaType } from "execa";
import type { VerifyConditionsContext } from "semantic-release";
import type { UserConfig } from "../src/UserConfig.mjs";

jest.unstable_mockModule("execa", () => ({
  execa: jest.fn(),
}));

describe("verify", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let context: VerifyConditionsContext;
  let execaMock: jest.Mock<typeof execaType>;
  let verify: (pluginConfig: UserConfig, _context: VerifyConditionsContext) => Promise<void>;

  beforeAll(async () => {
    originalEnv = process.env;
    const logMock = jest.fn();
    context = {
      branch: { name: "main" },
      env: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { log: logMock, error: logMock } as any,
    } as VerifyConditionsContext;
    const { execa } = await import("execa");
    execaMock = execa as unknown as jest.Mock<typeof execaType>;
    const verifyImport = await import("../src/verify.mjs");
    verify = verifyImport.verify;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should report an error when NUGET_TOKEN is no set", async () => {
    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Environment variable NUGET_TOKEN is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_SERVER_URL is set", async () => {
    delete process.env.CI_SERVER_URL;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_PROJECT_ID = "132";
    process.env.CI_JOB_TOKEN = "a3lhjli";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("GitLab environment variable CI_SERVER_URL is not set.");
  });

  it("should report an error when publishToGitLab is true and no CI_PROJECT_ID is set", async () => {
    delete process.env.CI_PROJECT_ID;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe(
      "Either CI_PROJECT_ID environment variable or gitlabRegistryProjectId must be set.",
    );
  });

  it("should report an error when separate GitLab rpoject id is set but gitlabUser is missing", async () => {
    delete process.env.CI_PROJECT_ID;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(
        { publishToGitLab: true, projectPath: "test/fixture/some.csproj", gitlabRegistryProjectId: 42 } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("When a separate GitLab project ID is set, gitlabUser must also be set.");
  });

  it("should report an error when publishToGitLab is true and no CI_JOB_TOKEN is set", async () => {
    delete process.env.CI_JOB_TOKEN;
    process.env.NUGET_TOKEN = "104E2";
    process.env.CI_SERVER_URL = "gitlab.com";
    process.env.CI_PROJECT_ID = "132";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ publishToGitLab: true, projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("GitLab environment variable CI_JOB_TOKEN is not set.");
  });

  it("should report an error when publishToGitlab is false and skipPublishToNuget is true", async () => {
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(
        { publishToGitLab: false, skipPublishToNuget: true, projectPath: "test/fixture/some.csproj" } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe(
      "skipPublishToNuget is set to true, but publishToGitLab is not set to true so the package will not be published anywhere.",
    );
  });

  it("should report an error if path to non existing project file is given", async () => {
    process.env.NUGET_TOKEN = "104E2";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(
        { projectPath: ["test/fixture/some-missing.csproj", "test/fixture/some.csproj"] } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaseError;
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

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Unable to find dotnet executable in dotnet");
  });

  it("should complain when projectPath is an empty array", async () => {
    delete process.env.NUGET_TOKEN;
    process.env.CI_SERVER_URL = "gitlab.com";
    process.env.CI_PROJECT_ID = "132";
    process.env.CI_JOB_TOKEN = "a3lhjli";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ projectPath: [], skipPublishToNuget: true, publishToGitLab: true } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("No project files given");
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
