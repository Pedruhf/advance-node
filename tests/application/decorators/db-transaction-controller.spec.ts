import { Controller } from "@/application/controllers";
import { DbTransactionControllerDecorator } from "@/application/decorators";
import { ControllerStub, DbTransactionSpy } from "@/tests/application/mocks";

type SutTypes = {
  sut: DbTransactionControllerDecorator;
  decorateeSpy: ControllerStub;
  dbTransactionSpy: DbTransactionSpy;
};

const makeSut = (): SutTypes => {
  const dbTransactionSpy = new DbTransactionSpy();
  const decorateeSpy = new ControllerStub();
  const sut = new DbTransactionControllerDecorator(decorateeSpy, dbTransactionSpy);

  return {
    sut,
    decorateeSpy,
    dbTransactionSpy,
  };
};

describe("DbTransactionControllerDecorator", () => {
  test("Should extend Controller", async () => {
    const { sut } = makeSut();

    expect(sut).toBeInstanceOf(Controller);
  });

  test("Should open transaction", async () => {
    const { sut, dbTransactionSpy } = makeSut();
    const openTransactionSpy = jest.spyOn(dbTransactionSpy, "openTransaction");
    await sut.perform({ any: "any" });

    expect(openTransactionSpy).toHaveBeenCalled();
    expect(openTransactionSpy).toHaveBeenCalledTimes(1);
  });

  test("Should execute decoratee", async () => {
    const { sut, decorateeSpy } = makeSut();
    const decorateePerformSpy = jest.spyOn(decorateeSpy, "perform");
    await sut.perform({ any: "any" });

    expect(decorateePerformSpy).toHaveBeenCalled();
    expect(decorateePerformSpy).toHaveBeenCalledTimes(1);
  });

  test("Should call commit and close transactions on success", async () => {
    const { sut, dbTransactionSpy } = makeSut();
    const commitTransactionSpy = jest.spyOn(dbTransactionSpy, "commitTransaction");
    const rollbackTransactionSpy = jest.spyOn(dbTransactionSpy, "rollbackTransaction");
    const closeTransactionSpy = jest.spyOn(dbTransactionSpy, "closeTransaction");
    await sut.perform({ any: "any" });

    expect(commitTransactionSpy).toHaveBeenCalled();
    expect(commitTransactionSpy).toHaveBeenCalledTimes(1);
    expect(rollbackTransactionSpy).not.toHaveBeenCalled();
    expect(closeTransactionSpy).toHaveBeenCalled();
    expect(closeTransactionSpy).toHaveBeenCalledTimes(1);
  });

  test("Should call rollback and close transactions on failure", async () => {
    const { sut, dbTransactionSpy, decorateeSpy } = makeSut();
    jest.spyOn(decorateeSpy, "perform").mockRejectedValueOnce(new Error("decoratee_error"));
    const commitTransactionSpy = jest.spyOn(dbTransactionSpy, "commitTransaction");
    const rollbackTransactionSpy = jest.spyOn(dbTransactionSpy, "rollbackTransaction");
    const closeTransactionSpy = jest.spyOn(dbTransactionSpy, "closeTransaction");
    await sut.perform({ any: "any" }).catch(() => {
      expect(commitTransactionSpy).not.toHaveBeenCalled();
      expect(rollbackTransactionSpy).toHaveBeenCalled();
      expect(rollbackTransactionSpy).toHaveBeenCalledTimes(1);
      expect(closeTransactionSpy).toHaveBeenCalled();
      expect(closeTransactionSpy).toHaveBeenCalledTimes(1);
    });
  });

  test("Should return the same result as decoratee on success", async () => {
    const { sut, decorateeSpy } = makeSut();
    jest.spyOn(decorateeSpy, "perform").mockResolvedValueOnce({
      statusCode: 200,
      data: { anyField: "any_value" },
    });
    const httpResponse = await sut.perform({ any: "any" });

    expect(httpResponse).toEqual({
      statusCode: 200,
      data: { anyField: "any_value" },
    });
  });

  test("Should rethrow if decoratee throws", async () => {
    const { sut, decorateeSpy } = makeSut();
    jest.spyOn(decorateeSpy, "perform").mockRejectedValueOnce(new Error("decoratee_error"));
    const httpResponsePromise = sut.perform({ any: "any" });

    await expect(httpResponsePromise).rejects.toThrow(new Error("decoratee_error"));
  });
});
