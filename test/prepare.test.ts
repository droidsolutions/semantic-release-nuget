import execa, { ExecaReturnBase } from "execa";
import { Context } from "semantic-release";
import { prepare } from "../src/prepare";
import { resolve } from "path";

jest.mock("execa");

describe("prepare", () => {
  let context: Context;

  beforeAll(() => {
    const logMock = jest.fn<void, unknown[]>();
    context = {
      env: {},
      logger: { log: logMock, error: logMock },
      nextRelease: { gitTag: "v1.0.0", notes: "", type: "major", gitHead: "", version: "1.0.0" },
    };
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
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release"]),
      { stdio: "inherit" },
    ]);
  });

  it("should use default dotnet commandi fn ot given", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "b" }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release"]),
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
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "--include-source"]),
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
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "--include-symbols"]),
      { stdio: "inherit" },
    ]);
  });

  it("should throw when command fails", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockImplementationOnce(() => {
      throw new Error("Something went wrong.");
    });

    await expect(prepare({ projectPath: "b", includeSymbols: true }, context)).rejects.toThrowError(
      "Something went wrong.",
    );
  });

  it("should add PackageVersion argument when usePackageVersion is set to true", async () => {
    const execaMock = execa as unknown as jest.Mock<ExecaReturnBase<string>, never[]>;
    execaMock.mockReturnValue({ exitCode: 0 } as ExecaReturnBase<string>);

    await prepare({ projectPath: "b", usePackageVersion: true }, context);

    expect(execaMock).toHaveBeenCalledTimes(1);
    expect(execaMock.mock.calls[0]).toEqual([
      "dotnet",
      expect.arrayContaining(["pack", resolve("b"), "-c", "Release", "-p:PackageVersion=1.0.0"]),
      { stdio: "inherit" },
    ]);
  });
});
