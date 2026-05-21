/** NuGet source as in nuget.config. */
export interface NuGetSource {
  /** The index of the source in the list. */
  index: number;
  /** Whether the source is enabled. */
  enabled: boolean;
  /** The name of the source. */
  source: string;
  /** The URL of the source. */
  url: string;
}
