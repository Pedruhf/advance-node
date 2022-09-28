import { createConnection, getConnection, getConnectionManager, QueryRunner } from "typeorm";
import { ConnectionNotFoundError } from "@/infra/repos/postgres/helpers";

export class PgConnection {
  private static instance?: PgConnection;
  private queryRunner?: QueryRunner;

  private constructor() {}

  static getInstance(): PgConnection {
    if (!PgConnection.instance) {
      PgConnection.instance = new PgConnection();
      return PgConnection.instance;
    }
    return PgConnection.instance;
  }

  async connect(): Promise<void> {
    const connection = getConnectionManager().has("default") ? getConnection() : await createConnection();
    this.queryRunner = connection.createQueryRunner();
  }

  async disconnect(): Promise<void> {
    if (!this.queryRunner) {
      throw new ConnectionNotFoundError();
    }
    await getConnection().close();
    this.queryRunner = undefined;
  }
}
