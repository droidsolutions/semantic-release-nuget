/** The external configuration the user can made via Semantic Release. */
export interface UserConfig {
  /** The relative path to the project to pack. */
  projectPath: string | string[];
  /** If true Debug symbols will be included in the package. */
  includeSymbols?: boolean;
  /** If true source coe will be included in the package. */
  includeSource?: boolean;
  /** The name of the registry to push to. */
  nugetServer?: string;
  /** The path to the dotnet executable if not in PATH. */
  dotnet?: string;
  /** If true, package will also be published to the GitLab registry. */
  publishToGitLab?: boolean;
  /** If true, package version is overriden via PackageVersion argument. */
  usePackageVersion?: boolean;
}
