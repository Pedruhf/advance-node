import { RequiredFieldError } from "@/application/errors";
import { badRequest, HttpResponse, HttpStatusCode, noContent } from "@/application/helpers";

type HttpRequest = { file: { buffer: Buffer; mimeType: string } };
type Model = Error;

class SaveProfilePicture {
  async handle({ file }: HttpRequest): Promise<HttpResponse<Model>> {
    if (!file) {
      return badRequest(new RequiredFieldError("foto"));
    }
    if (file.buffer.length === 0) {
      return badRequest(new RequiredFieldError("foto"));
    }
    if (!["image/png", "image/jpg", "image/jpeg"].includes(file.mimeType)) {
      return badRequest(new InvalidMymeTypeError(["png", "jpg", "jpeg"]));
    }

    return noContent();
  }
}

class InvalidMymeTypeError extends Error {
  constructor(allowed: string[]) {
    super(`Tipo não suportado. Tipos permitidos: ${allowed.join(", ")}`);
    this.name = "InvalidMymeTypeError";
  }
}

describe("SaveProfilePicture Controller", () => {
  let sut: SaveProfilePicture;
  let buffer: Buffer;
  let mimeType: string;

  beforeAll(() => {
    buffer = Buffer.from("any_buffer");
    mimeType = "image/png";
  });

  beforeEach(() => {
    sut = new SaveProfilePicture();
  });

  test("Should return 400 if file is not provided", async () => {
    const httpResponse = await sut.handle({ file: undefined as any });

    expect(httpResponse).toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new RequiredFieldError("foto"),
    });
  });

  test("Should return 400 if file is not provided", async () => {
    const httpResponse = await sut.handle({ file: null as any });

    expect(httpResponse).toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new RequiredFieldError("foto"),
    });
  });

  test("Should return 400 if file is empty", async () => {
    const httpResponse = await sut.handle({ file: { buffer: Buffer.from(""), mimeType } });

    expect(httpResponse).toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new RequiredFieldError("foto"),
    });
  });

  test("Should return 400 if file type is invalid", async () => {
    const httpResponse = await sut.handle({ file: { buffer, mimeType: "invalid_type" } });

    expect(httpResponse).toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new InvalidMymeTypeError(["png", "jpg", "jpeg"]),
    });
  });

  test("Should return 400 if file type is valid", async () => {
    const httpResponse = await sut.handle({ file: { buffer, mimeType: "image/png" } });

    expect(httpResponse).not.toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new InvalidMymeTypeError(["png", "jpg", "jpeg"]),
    });
  });

  test("Should not return 400 if file type is valid", async () => {
    const httpResponse = await sut.handle({ file: { buffer, mimeType: "image/jpg" } });

    expect(httpResponse).not.toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new InvalidMymeTypeError(["png", "jpg", "jpeg"]),
    });
  });

  test("Should not return 400 if file type is valid", async () => {
    const httpResponse = await sut.handle({ file: { buffer, mimeType: "image/jpeg" } });

    expect(httpResponse).not.toEqual({
      statusCode: HttpStatusCode.badRequest,
      data: new InvalidMymeTypeError(["png", "jpg", "jpeg"]),
    });
  });
});
