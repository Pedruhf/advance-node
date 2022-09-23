import { UploadFile } from "@/data/contracts/gateways";
import { config, S3 } from "aws-sdk";

jest.mock("aws-sdk");

class AwsS3FileStorage {
  constructor(private readonly accessKeyId: string, private readonly secretAccessKey: string, private readonly bucket: string) {
    config.update({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async upload({ key, file }: UploadFile.Input): Promise<void> {
    const s3 = new S3();
    s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ACL: "public-read",
    }).promise();
  }
}

describe("AwsS3FileStorage", () => {
  let sut: AwsS3FileStorage;
  let accessKeyId: string;
  let secretAccessKey: string;
  let key: string;
  let file: Buffer;
  let bucket: string;
  let putObjectPromiseSpy: jest.Mock;
  let putObjectSpy: jest.Mock;

  beforeAll(() => {
    accessKeyId = "any_access_key";
    secretAccessKey = "any_secret_key";
    key = "any_key";
    file = Buffer.from("any_buffer");
    bucket = "any_bucket";
    putObjectPromiseSpy = jest.fn();
    putObjectSpy = jest.fn().mockImplementation(() => ({ promise: putObjectPromiseSpy }));
    jest.mocked(S3).mockImplementation(
      jest.fn().mockImplementation(() => ({
        putObject: putObjectSpy,
      }))
    );
  });

  beforeEach(() => {
    sut = new AwsS3FileStorage(accessKeyId, secretAccessKey, bucket);
  });

  test("Should config aws credentials on creation", () => {
    expect(config.update).toHaveBeenCalledWith({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    expect(config.update).toHaveBeenCalledTimes(1);
  });

  test("Should call putObject with correct input", async () => {
    await sut.upload({ key, file });

    expect(putObjectSpy).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
      Body: file,
      ACL: "public-read",
    });
    expect(putObjectSpy).toHaveBeenCalledTimes(1);
    expect(putObjectPromiseSpy).toHaveBeenCalledTimes(1);
  });
});
