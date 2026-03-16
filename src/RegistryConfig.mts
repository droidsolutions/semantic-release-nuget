/** Configuration for a single NuGet registry. */
export interface RegistryConfig {
  /**
   * The name of the registry to push to.
   * If you have a nuget.config with configured sources, this should match the name of one of the sources.
   * @example "nuget.org", "myget", "gitlab"
   **/
  name?: string;
  /**
   * The URL to the registry to push to.
   * @example "https://api.nuget.org/v3/index.json"
   */
  url?: string;

  /**
   * The name of the environment variable that contains the token to authenticate with the registry.
   * @example "NUGET_TOKEN"
   */
  tokenEnvVar?: string;

  /**
   * The username to use when authenticating with the registry, if required. If not set, the token will be used as
   * username and password for authentication.
   */
  user?: string;

  /**
   * The type of the registry, used to determine the command arguments to use when pushing to it.
   * If not set, "nuget" will be used as default.
   */
  type: "nuget" | "gitlab" | "github" | "generic";
}
