# Contribution Guidelines

These are guidelines to help you if you want to contribute to this project. Below explained are some guidelines to follow to keep the project clean.

## Commit

This project uses [Commit Lint](https://commitlint.js.org/#/) to enforce a consistent commit message style. Every commit message must begin with a subject like `fix`, `feat`, `chore`, etc, and optional scope in brackets followed by a colon and the commit message. This message style is needed for automatic release (see below).

A typical commit could look like `git commit -m "feat: add special feature" -m "closes #1 and introduces special feature"` or `git commit -m "ci(github): configure github actions"`.

On `npm install` a tool named [Husky](https://github.com/typicode/husky) is installed which is used to distribute git hooks to enforce the commit lint policy or run ESLint on staged files (see below). This prevents you from accidentally making commits that don't apply to the style. To activate those run `npx husky install` the first time you ran `npm install` after cloning the repo.

## Style

This project uses [ESLint](https://eslint.org/) to enforce a certain code style and detect errors in the code. It is feasable to integrate it in your IDE, for example with extensions [like this one for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

To enforce consistent code style [Prettier](https://prettier.io/) is used. This will reformat any TypeScript/JavaScript files.

Also [Husky](https://github.com/typicode/husky) is used to set up git hooks to run these tools before commits. Both tools will run as pre-commit hook on staged files. If any ESLint errors occur the commit is aborted and you need to fix them first.

## Release

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically determine a new version and update the project accordingly. This is integrated into the CI process and will generate and tag a new container image also.

The release version is determined by analyzing the commits since the last release, commits that start with `fix:` will trigger a patch, commits with `feat:` a minor and commits that contain `BREAKING CHANGE` will trigger a major release.

## Tests

For testing [Jest](https://jestjs.io) is used. Since the library uses [TypeScript](https://www.typescriptlang.org/) that transpiles to ESM code some configuration is needed for `Jest` to work properly.

`Jest` config can be found in `jest.config.cjs`. To transpile the code, [ts-jest](https://kulshekhar.github.io/ts-jest/docs/) is used which transforms the files to JS that can be used by `Jest`. Tests are written in TypeScript and using ES Modules mocking is difficult.

To mock `execa`, which is the main thing the plugin uses, the following must be given:

- `Jest` has to be imported as a static import from `@jest/globals`
- `jest.unstable_mockModule` has to be called wit ha factory function
- `execa` must not be statically import (e.g. with `import {execa} from "execa"`) but instead a dynamic import must be used

  `const execaImport = await import("execa");`

- the module to be tested must not be statitcally imported but also via a dynamic import after jest has done the mocking

Example on how this can be setup:

```ts
import { jest } from "@jest/globals";
import type { execa } from "execa";
import type { verify as verifyType } from "../src/verify.mjs";

jest.unstable_mockModule("execa", () => ({
  execa: jest.fn(),
}));

describe("verify", () => {
  let verify: typeof verifyType;
  let execaMock Mock<typeof execa>:

  beforeAll(async () => {
    const execaImport = await import("execa");
    execaMock = execaImport.execa;
    const verifyImport = await import("../src/verify.mjs");
    verify = verifyImport.verify;
  });

  it("test something", async () => {
    const myConfig = {};
    const context = {};
    await verify(myConfig, context);

    // expect(something);
  });
});
```

This way jest can mock the imported `execa` module and the imported `verify` function then also imports the mocked module. Otherwise `verify` would import the unmocked original `execa` which is not what we want.

Also a custom resolver is needed for jest to recognize the generated `.mjs` files. This is located in `test/fixture/JestMjsResolver.cjs`.
