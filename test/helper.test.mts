import { normalizeRegistryConfig } from "../src/Helper.mjs";
import type { UserConfig } from "../src/UserConfig.mjs";

describe("normalizeRegistryConfig", () => {
  const emptyConfig: Partial<UserConfig> = {
    projectPath: "not/relevant",
  };
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return default nuget.org config if no config is provided", () => {
    const result = normalizeRegistryConfig(emptyConfig as UserConfig);
    expect(result).toEqual([
      {
        name: "nuget",
        type: "nuget",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://api.nuget.org/v3/index.json",
      },
    ]);
  });

  it("should return default nuget.org config if an empty array is provided", () => {
    const result = normalizeRegistryConfig({ ...emptyConfig, nugetRegistries: [] } as UserConfig);
    expect(result).toEqual([
      {
        name: "nuget",
        type: "nuget",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://api.nuget.org/v3/index.json",
      },
    ]);
  });

  it("should set default nuget.org url if url is empty", () => {
    const result = normalizeRegistryConfig({ ...emptyConfig, nugetRegistries: [{ type: "nuget" }] } as UserConfig);
    expect(result).toEqual([
      {
        name: "nuget",
        type: "nuget",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://api.nuget.org/v3/index.json",
      },
    ]);
  });

  it("should resolve default GitLab url from environment variables when minimal GitLab config is provided", () => {
    const config = {
      ...emptyConfig,
      nugetRegistries: [
        {
          type: "gitlab",
        },
      ],
    } as UserConfig;

    process.env.CI_SERVER_URL = "https://gitlab.example.com";
    process.env.CI_PROJECT_ID = "132";

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "gitlab",
        type: "gitlab",
        tokenEnvVar: "CI_JOB_TOKEN",
        url: "https://gitlab.example.com/api/v4/projects/132/packages/nuget/index.json",
        user: "gitlab-ci-token",
      },
    ]);
  });

  it("should not override any fields for GitLab type that are already set", () => {
    const config = {
      ...emptyConfig,
      nugetRegistries: [
        {
          name: "my-gitlab",
          tokenEnvVar: "NUGET_TOKEN",
          url: "https://custom.gitlab.com/nuget/index.json",
          type: "gitlab",
        },
      ],
    } as UserConfig;

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "my-gitlab",
        type: "gitlab",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://custom.gitlab.com/nuget/index.json",
        user: "gitlab-ci-token",
      },
    ]);
  });

  it("should resolve default GitLab url from environment variables when minimal GitLab config is provided and extra project id is set", () => {
    const config = {
      ...emptyConfig,
      gitlabRegistryProjectId: 456,
      nugetRegistries: [
        {
          name: "special-gitlab",
          type: "gitlab",
        },
      ],
    } as UserConfig;

    process.env.CI_SERVER_URL = "https://gitlab.example.com";
    process.env.CI_PROJECT_ID = "132";

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "special-gitlab", // should not overwrite name if given
        type: "gitlab",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://gitlab.example.com/api/v4/projects/456/packages/nuget/index.json",
        user: "gitlab-ci-token",
      },
    ]);
  });

  it("should resolve user from config.gitlabUser when config is type gitlab", () => {
    const config = {
      ...emptyConfig,
      gitlabRegistryProjectId: 456,
      gitlabUser: "custom-gitlab-user",
      nugetRegistries: [
        {
          type: "gitlab",
        },
      ],
    } as UserConfig;

    process.env.CI_SERVER_URL = "https://gitlab.example.com";
    process.env.CI_PROJECT_ID = "132";

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "gitlab",
        type: "gitlab",
        tokenEnvVar: "NUGET_TOKEN",
        url: "https://gitlab.example.com/api/v4/projects/456/packages/nuget/index.json",
        user: "custom-gitlab-user",
      },
    ]);
  });

  it("should resolve default GitHub config from environment variables", () => {
    const config = {
      ...emptyConfig,
      nugetRegistries: [
        {
          type: "github",
        },
      ],
    } as UserConfig;

    process.env.GITHUB_REPOSITORY_OWNER = "droidsolutions";
    process.env.GITHUB_ACTOR = "somebody";

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "github",
        type: "github",
        tokenEnvVar: "GITHUB_TOKEN",
        url: "https://nuget.pkg.github.com/droidsolutions/index.json",
        user: "somebody",
      },
    ]);
  });

  it("should not override any fields for GitHub type that are already set", () => {
    const config = {
      ...emptyConfig,
      nugetRegistries: [
        {
          name: "my-github",
          tokenEnvVar: "MY_TOKEN",
          url: "https://nuget.pkg.github.com/other/index.json",
          type: "github",
          user: "other-user",
        },
      ],
    } as UserConfig;

    const result = normalizeRegistryConfig(config);

    expect(result).toEqual([
      {
        name: "my-github",
        type: "github",
        tokenEnvVar: "MY_TOKEN",
        url: "https://nuget.pkg.github.com/other/index.json",
        user: "other-user",
      },
    ]);
  });
});
