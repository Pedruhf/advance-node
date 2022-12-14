import { FacebookAuthentication } from "@/domain/features";
import { HttpResponse, success, unauthorized } from "@/application/helpers";
import { ValidationBuilder, Validator } from "@/application/validation";
import { Controller } from "@/application/controllers";

type HttpRequest = {
  token: string;
};

type Model = { accessToken: string } | Error;

export class FacebookLoginController extends Controller {
  constructor(private readonly facebookAuthentication: FacebookAuthentication) {
    super();
  }

  async perform({ token }: HttpRequest): Promise<HttpResponse<Model>> {
    try {
      const accessToken = await this.facebookAuthentication.perform({
        token,
      });
      return success(accessToken);
    } catch {
      return unauthorized();
    }
  }

  override buildValidators({ token }: HttpRequest): Validator[] {
    const validators = [...ValidationBuilder.of({ value: token, fieldName: "token" }).required().build()];
    return validators;
  }
}
