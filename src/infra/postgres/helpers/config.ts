import { ConnectionOptions } from "typeorm";

export const config: ConnectionOptions = {
  type: "postgres",
  host: "kesavan.db.elephantsql.com",
  port: 5432,
  username: "uqliyhpv",
  password: "zSR6hCUp8HC_80Wg5WfXPzV1uLMEmACV",
  database: "uqliyhpv",
  entities: ["dist/src/infra/postgres/entities/index.js"],
};
