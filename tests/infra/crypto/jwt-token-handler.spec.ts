import jwt from "jsonwebtoken";

import { JwtTokenHandler } from "@/infra/crypto";

jest.mock("jsonwebtoken");

type SutTypes = {
  sut: JwtTokenHandler;
};

const makeSut = (): SutTypes => {
  const sut = new JwtTokenHandler("any_secret");
  return {
    sut,
  };
};

describe("JwtTokenHandler", () => {
  let fakeJwt: jest.Mocked<typeof jwt>;

  beforeAll(() => {
    fakeJwt = jwt as jest.Mocked<typeof jwt>;
  });

  describe("generateToken", () => {
    const key = "any_key";
    const expirationInMs = 1000;

    test("Should call sign with correct params", async () => {
      const { sut } = makeSut();
      await sut.generateToken({ key, expirationInMs });

      expect(fakeJwt.sign).toHaveBeenCalledWith({ key }, "any_secret", { expiresIn: 1 });
    });

    test("Should return a token", async () => {
      const { sut } = makeSut();
      jest.spyOn(fakeJwt, "sign").mockImplementationOnce(() => "any_token");

      const token = await sut.generateToken({ key, expirationInMs });

      expect(token).toBe("any_token");
    });

    test("Should rethrow if sign throws", async () => {
      const { sut } = makeSut();
      jest.spyOn(fakeJwt, "sign").mockImplementationOnce(() => {
        throw new Error("sign_error");
      });

      const tokenPromise = sut.generateToken({ key, expirationInMs });

      await expect(tokenPromise).rejects.toThrow(new Error("sign_error"));
    });
  });
});
