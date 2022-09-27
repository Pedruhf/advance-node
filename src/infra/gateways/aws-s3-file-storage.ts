import { config, S3 } from "aws-sdk";

import { DeleteFile, UploadFile } from "@/data/contracts/gateways";

export class AwsS3FileStorage {
  constructor(private readonly accessKeyId: string, private readonly secretAccessKey: string, private readonly bucket: string) {
    config.update({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  async upload({ fileName, file }: UploadFile.Input): Promise<UploadFile.Output> {
    const s3 = new S3();
    await s3
      .putObject({
        Bucket: this.bucket,
        Key: fileName,
        Body: file,
        ACL: "public-read",
      })
      .promise();
    return `https://${this.bucket}.s3.amazonaws.com/${encodeURIComponent(fileName)}`;
  }

  async delete({ fileName }: DeleteFile.Input): Promise<DeleteFile.Output> {
    const s3 = new S3();
    await s3.deleteObject({ Bucket: this.bucket, Key: fileName }).promise();
  }
}
