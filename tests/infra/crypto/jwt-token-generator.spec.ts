import jwt from "jsonwebtoken";

import { TokenGenerator } from "@/data/contracts/crypto";

jest.mock("jsonwebtoken");

class JwtTokenGenerator {
  constructor(private readonly secretKey: string) {}

  async generate(
    params: TokenGenerator.Params
  ): Promise<TokenGenerator.Result> {
    const expirationInSeconds = params.expirationInMs / 1000;
    const token = jwt.sign({ key: params.key }, this.secretKey, {
      expiresIn: expirationInSeconds,
    });

    return token;
  }
}

type SutTypes = {
  sut: JwtTokenGenerator;
};

const makeSut = (): SutTypes => {
  const sut = new JwtTokenGenerator("any_secret");
  return {
    sut,
  };
};

describe("JwtTokenGenerator", () => {
  let fakeJwt: jest.Mocked<typeof jwt>;

  beforeAll(() => {
    fakeJwt = jwt as jest.Mocked<typeof jwt>;
  });

  test("Should call sign with correct params", async () => {
    const { sut } = makeSut();
    await sut.generate({ key: "any_key", expirationInMs: 1000 });

    expect(fakeJwt.sign).toHaveBeenCalledWith(
      { key: "any_key" },
      "any_secret",
      { expiresIn: 1 }
    );
  });

  test("Should return a token", async () => {
    const { sut } = makeSut();
    jest.spyOn(fakeJwt, "sign").mockImplementationOnce(() => "any_token");

    const token = await sut.generate({ key: "any_key", expirationInMs: 1000 });

    expect(token).toBe("any_token");
  });

  test("Should rethrow if sign throws", async () => {
    const { sut } = makeSut();
    jest.spyOn(fakeJwt, "sign").mockImplementationOnce(() => {
      throw new Error("sign_error");
    });

    const tokenPromise = sut.generate({ key: "any_key", expirationInMs: 1000 });

    await expect(tokenPromise).rejects.toThrow(new Error("sign_error"));
  });
});
