import { ServerError } from "@/application/errors";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";

jest.mock("multer");

const adaptMulter: RequestHandler = (req, res, next) => {
  const upload = multer().single("any_file_name");
  upload(req, res, (error) => {
    if (error) {
      return res.status(500).json({ error: new ServerError(error).message });
    }

    if (req.file) {
      req.locals = { ...req.locals, file: { buffer: req.file.buffer, mimeType: req.file.mimetype } };
    }
  });
};

describe("Multer Adapter", () => {
  let uploadSpy: jest.Mock;
  let singleSpy: jest.Mock;
  let multerSpy: jest.Mock;
  let fakeMulter: jest.Mocked<typeof multer>;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let sut: RequestHandler;

  beforeAll(() => {
    uploadSpy = jest.fn().mockImplementation((req, res, next) => {
      req.file = { buffer: Buffer.from("any_buffer"), mimetype: "any_type" };
      next();
    });
    singleSpy = jest.fn().mockImplementation(() => uploadSpy);
    multerSpy = jest.fn().mockImplementation(() => ({
      single: singleSpy,
    }));
    fakeMulter = multer as jest.Mocked<typeof multer>;
    jest.mocked(fakeMulter).mockImplementation(multerSpy);
    res = getMockRes().res;
    next = getMockRes().next;
  });
  
  beforeEach(() => {
    req = getMockReq({ locals: { anyLocals: "any_locals" } });
    sut = adaptMulter;
  });

  test("Should call single upload with correct input", async () => {
    sut(req, res, next);

    expect(multerSpy).toHaveBeenCalledWith();
    expect(multerSpy).toHaveBeenCalledTimes(1);
    expect(singleSpy).toHaveBeenCalledWith("any_file_name");
    expect(singleSpy).toHaveBeenCalledTimes(1);
    expect(uploadSpy).toHaveBeenCalledWith(req, res, expect.any(Function));
    expect(uploadSpy).toHaveBeenCalledTimes(1);
  });

  test("Should return 500 if upload fails", async () => {
    const error = new Error("upload_error");
    uploadSpy.mockImplementationOnce((req, res, next) => {
      next(error);
    });
    sut(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ error: new ServerError(error).message });
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test("Should not add file to req.locals", async () => {
    uploadSpy.mockImplementationOnce((req, res, next) => {
      next();
    });
    sut(req, res, next);

    expect(req.locals).toEqual({ anyLocals: "any_locals" });
  });

  test("Should add file to req.locals", async () => {
    sut(req, res, next);

    expect(req.locals).toEqual({
      anyLocals: "any_locals",
      file: {
        buffer: req.file?.buffer,
        mimeType: req.file?.mimetype,
      },
    });
  });
});
