import { AuthenticationMiddleware } from "@/application/middlewares";
import { makeJwtTokenHandler } from "@/main/factories/gateways";

export const makeAuthenticationMiddleware = (): AuthenticationMiddleware => {
  const jwt = makeJwtTokenHandler();
  const authorize = jwt.validate.bind(jwt);
  return new AuthenticationMiddleware(authorize);
};
