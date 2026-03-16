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
    originalEnv = { ...process.env };
    const logMock = jest.fn();
    context = {
      branch: { name: "main" },
      env: {},
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

  it("should report an error when NUGET_TOKEN is not set", async () => {
    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify({ projectPath: "test/fixture/some.csproj" } as UserConfig, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Environment variable NUGET_TOKEN for registry nuget is not set.");
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
    expect(actualErr?.details).toContain(
      "CI_SERVER_URL environment variable is not set but needed for GitLab registry when url is not set.",
    );
    expect(actualErr?.details).toContain("Registry gitlab has no url configured.");
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
    expect(actualErr?.details).toContain("CI_PROJECT_ID environment variable is not set");
    expect(actualErr?.details).toContain(
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
    expect(actualErr?.details).toBe("Environment variable CI_JOB_TOKEN for registry gitlab is not set.");
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
    expect(actualErr?.details).toBe("No NuGet registries configured to publish to.");
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
    expect(actualErr?.details).toBe("No project files given.");
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

  it("should report an error when a registry has no tokenEnvVar configured and NUGET_TOKEN is not set", async () => {
    const config = {
      projectPath: "test/fixture/some.csproj",
      nugetRegistries: [{ name: "my-registry", url: "https://example.com" }],
    } as UserConfig;

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(config, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Environment variable NUGET_TOKEN for registry my-registry is not set.");
  });

  it("should report an error when the token environment variable for a registry is not set", async () => {
    delete process.env.MY_TOKEN;
    const config = {
      projectPath: "test/fixture/some.csproj",
      nugetRegistries: [{ name: "my-registry", url: "https://example.com", tokenEnvVar: "MY_TOKEN" }],
    } as UserConfig;

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(config, context);
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toBe("Environment variable MY_TOKEN for registry my-registry is not set.");
  });

  it("should report an error when no URL is set and GitLab CI env vars are missing", async () => {
    delete process.env.CI_SERVER_URL;
    const config = {
      projectPath: "test/fixture/some.csproj",
      nugetRegistries: [{ name: "gitlab-registry", type: "gitlab" }],
    } as UserConfig;

    let actuallErr: SemanticReleaseError | undefined;
    try {
      await verify(config, context);
    } catch (err) {
      actuallErr = err as SemanticReleaseError;
    }

    expect(actuallErr).toBeDefined();
    expect(actuallErr?.details).toContain(
      "CI_SERVER_URL environment variable is not set but needed for GitLab registry when url is not set.",
    );
  });

  it("should resolve environment variables in GitLab registry configuration", async () => {
    process.env.CI_SERVER_URL = "https://gitlab.example.com";
    process.env.CI_PROJECT_ID = "132";
    process.env.CI_JOB_TOKEN = "a3lhjli";

    const config = {
      projectPath: "test/fixture/some.csproj",
      nugetRegistries: [
        {
          name: "gitlab",
          type: "gitlab",
        },
      ],
    } as UserConfig;

    await expect(verify(config, context)).resolves.toBeUndefined();
  });

  it("should report an error when GitHub registry is configured but no GITHUB_REPOSITORY_OWNER is set", async () => {
    delete process.env.GITHUB_REPOSITORY_OWNER;
    process.env.GITHUB_TOKEN = "104E2";

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(
        {
          projectPath: "test/fixture/some.csproj",
          nugetRegistries: [{ type: "github" }],
        } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toContain(
      "GITHUB_REPOSITORY_OWNER environment variable is not set but needed for GitHub registry.",
    );
  });

  it("should report an error when GitHub registry is configured but no GITHUB_ACTOR is set and no user provided", async () => {
    process.env.GITHUB_REPOSITORY_OWNER = "droidsolutions";
    process.env.GITHUB_TOKEN = "104E2";
    delete process.env.GITHUB_ACTOR;

    let actualErr: SemanticReleaseError | undefined;
    try {
      await verify(
        {
          projectPath: "test/fixture/some.csproj",
          nugetRegistries: [{ type: "github" }],
        } as UserConfig,
        context,
      );
    } catch (err) {
      actualErr = err as SemanticReleaseError;
    }

    expect(actualErr).toBeDefined();
    expect(actualErr?.details).toContain(
      "GITHUB_ACTOR environment variable is not set but needed for GitHub registry.",
    );
  });

  it("should verify successfully when GitHub registry is configured with all environment variables", async () => {
    process.env.GITHUB_REPOSITORY_OWNER = "droidsolutions";
    process.env.GITHUB_TOKEN = "104E2";
    process.env.GITHUB_ACTOR = "somebody";

    const config = {
      projectPath: "test/fixture/some.csproj",
      nugetRegistries: [{ type: "github" }],
    } as UserConfig;

    await expect(verify(config, context)).resolves.toBeUndefined();
  });
});
