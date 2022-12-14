import { AccessToken, FacebookAccount } from "@/domain/entities";
import { AuthenticationError } from "@/domain/errors";
import { FacebookAuthenticationUseCase } from "@/data/use-cases";
import {
  LoadFacebookUserApiSpy,
  TokenGeneratorSpy,
  UserAccountSpy,
} from "@/tests/data/mocks";
import { fbModelMock } from "@/tests/domain/mocks";

jest.mock("@/domain/entities/facebook-account");

type SutTypes = {
  sut: FacebookAuthenticationUseCase;
  loadFacebookUserApiSpy: LoadFacebookUserApiSpy;
  userAccountSpy: UserAccountSpy;
  tokenGeneratorSpy: TokenGeneratorSpy;
};

type SutParams = {
  loadFacebookUserApiSpy?: LoadFacebookUserApiSpy;
  userAccountSpy?: UserAccountSpy;
  tokenGeneratorSpy?: TokenGeneratorSpy;
};

const makeSut = ({
  loadFacebookUserApiSpy = new LoadFacebookUserApiSpy(),
  userAccountSpy = new UserAccountSpy(),
  tokenGeneratorSpy = new TokenGeneratorSpy(),
}: SutParams = {}): SutTypes => {
  const sut = new FacebookAuthenticationUseCase(
    loadFacebookUserApiSpy,
    userAccountSpy,
    tokenGeneratorSpy
  );

  return {
    sut,
    loadFacebookUserApiSpy,
    userAccountSpy,
    tokenGeneratorSpy,
  };
};

describe("FacebookAuthentication UseCase", () => {
  const token = "any_token";
  const facebookUserData = fbModelMock();

  test("Should call LoadFacebookUser with correct params", async () => {
    const { sut, loadFacebookUserApiSpy } = makeSut();

    await sut.perform({ token });

    expect(loadFacebookUserApiSpy.token).toBe(token);
    expect(loadFacebookUserApiSpy.callsCount).toBe(1);
  });

  test("Should throw AuthenticationError if LoadFacebookUser returns undefined", async () => {
    const loadFacebookUserApiSpy = new LoadFacebookUserApiSpy();
    loadFacebookUserApiSpy.result = undefined;

    const { sut } = makeSut({ loadFacebookUserApiSpy });
    const authPromise = sut.perform({ token });

    await expect(authPromise).rejects.toThrow(new AuthenticationError());
  });

  test("Should call LoadUserAccountByEmailRepo when LoadFacebookUser returns data", async () => {
    const { sut, userAccountSpy } = makeSut();

    await sut.perform({ token });

    expect(userAccountSpy.loadEmail).toBe(facebookUserData.email);
    expect(userAccountSpy.loadCallsCount).toBe(1);
  });

  test("Should call SaveFacebookAccountRepo with facebookAccount when LoadFacebookUser returns undefined", async () => {
    const facebookAccountStub = jest.fn().mockImplementation(() => ({
      anyField: "any_value",
    }));
    jest.mocked(FacebookAccount).mockImplementation(facebookAccountStub);

    const { sut, userAccountSpy } = makeSut();
    await sut.perform({ token });

    expect(userAccountSpy.saveWithFacebookData).toEqual({
      anyField: "any_value",
    });
    expect(userAccountSpy.saveWithFacebookCallsCount).toBe(1);
  });

  test("Should call TokenGenerator with correct params", async () => {
    const { sut, tokenGeneratorSpy } = makeSut();

    await sut.perform({ token });

    expect(tokenGeneratorSpy.data).toEqual({
      key: "any_account_id",
      expirationInMs: AccessToken.expirationInMs,
    });
    expect(tokenGeneratorSpy.callsCount).toBe(1);
  });

  test("Should call TokenGenerator with correct params", async () => {
    const { sut } = makeSut();
    const authResult = await sut.perform({ token });

    expect(authResult).toEqual({ accessToken: "any_generated_token" });
  });

  test("Should rethrow if LoadFacebookUser throws", async () => {
    const loadFacebookUserApiSpy = new LoadFacebookUserApiSpy();
    jest
      .spyOn(loadFacebookUserApiSpy, "loadUser")
      .mockRejectedValueOnce(new Error("fb_error"));

    const { sut } = makeSut({ loadFacebookUserApiSpy });
    const authResultPromise = sut.perform({ token });

    await expect(authResultPromise).rejects.toThrow("fb_error");
  });

  test("Should rethrow if LoadUserAccountByEmailRepo throws", async () => {
    const userAccountSpy = new UserAccountSpy();
    jest
      .spyOn(userAccountSpy, "load")
      .mockRejectedValueOnce(new Error("load_error"));

    const { sut } = makeSut({ userAccountSpy });
    const authResultPromise = sut.perform({ token });

    await expect(authResultPromise).rejects.toThrow("load_error");
  });

  test("Should rethrow if SaveFacebookAccountRepo throws", async () => {
    const userAccountSpy = new UserAccountSpy();
    jest
      .spyOn(userAccountSpy, "saveWithFacebook")
      .mockRejectedValueOnce(new Error("save_error"));

    const { sut } = makeSut({ userAccountSpy });
    const authResultPromise = sut.perform({ token });

    await expect(authResultPromise).rejects.toThrow("save_error");
  });

  test("Should rethrow if TokenGenerator throws", async () => {
    const tokenGeneratorSpy = new TokenGeneratorSpy();
    jest
      .spyOn(tokenGeneratorSpy, "generate")
      .mockRejectedValueOnce(new Error("token_error"));

    const { sut } = makeSut({ tokenGeneratorSpy });
    const authResultPromise = sut.perform({ token });

    await expect(authResultPromise).rejects.toThrow("token_error");
  });
});
