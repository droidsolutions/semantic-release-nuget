## Semantic Release NuGet Plugin

This project is a Semantic Release plugin that helps building and publishing NuGet packages. It uses TypeScript that transpiles to ESM and jest for testing.
Since it uses the dotnet CLI for many things it relies on the execa package.
The user can configure the plugin to give paths to .NET projects that should be used to build a package as well as to where the package should be published.
Currently it supports the official nuget.org and (private) GitLab registries but it is planned to also support (private) GitHub registries.

The project itself uses Semantic release, so commits should follow a style which is enforced by commitlint and husky.
Code style should adhere to the ESLint rules and is formatted with prettier.

## Additional Project Context

- **Hosting**: The project is hosted on GitHub and utilizes GitHub Actions for CI/CD.
- **CI Pipelines**: Workflows in `.github/workflows/` handle:
  - Linting (ESLint)
  - Building (TypeScript compilation)
  - Testing (Jest with Node.js 22 & 24 matrix)
- **Language**: TypeScript targeting ES2022 with Node16 module resolution.
- **Output**: Compiled artifacts are output to the `dist/` directory.
- **Testing**:
  - Framework: Jest with `ts-jest`.
  - Configuration: Uses experimental VM modules for ESM support (`node --experimental-vm-modules`).
  - Test files are located in `test/` and typically use the `.test.mts` extension.
- **Entry Point**: The main entry point is `dist/index.mjs` (ESM).
- **Dependencies**: The only runtime dependency is `execa`.
