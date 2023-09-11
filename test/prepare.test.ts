import execa, { ExecaReturnBase } from "execa";
import { PrepareContext } from "semantic-release";
import { prepare } from "../src/prepare";
import { resolve } from "path";

jest.mock("execa");

describe("prepare", () => {
  let context: PrepareContext;

  beforeAll(() => {
    const logMock = jest.fn<void, unknown[]>();
    context = {
      branch: { name: "main" },
      env: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { log: logMock, error: logMock } as any,
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    } as PrepareContext;
  });

  afterEach(() => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReset();
  });

  it("should call pack with the correct arguments", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ dotnet: "a", projectPath: "b" }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "a",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out"]),
      { stdio: "inherit" },
    ]);
  });

  it("should use default dotnet command if not given", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "b" }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out"]),
      { stdio: "inherit" },
    ]);
  });

  it("should add include-source flag if set", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "b", includeSource: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-o", "out", "--include-source"]),
      { stdio: "inherit" },
    ]);
  });

  it("should add include-symbols flag if set", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "b", includeSymbols: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining([
        "pack",
        resolve("b"),
        "-c",
        "Release",
        "-o",
        "out",
        "--include-symbols",
        "-p:SymbolPackageFormat=snupkg",
      ]),
      { stdio: "inherit" },
    ]);
  });

  it("should throw when command fails", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockImplementationOnce(() => {
      throw new Error("Something went wrong.");
    });

    await expect(prepare({ projectPath: "b", includeSymbols: true }, context)).rejects.toThrow("dotnet pack failed");
  });

  it("should add PackageVersion argument when usePackageVersion is set to true", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "src/SomeProject/SomeProject.csproj", usePackageVersion: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining([
        "pack",
        resolve("src/SomeProject/SomeProject.csproj"),
        "-c",
        "Release",
        "-o",
        "out",
        "-p:PackageVersion=1.0.0",
      ]),
      { stdio: "inherit" },
    ]);
  });
});
