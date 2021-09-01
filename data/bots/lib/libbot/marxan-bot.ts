import axiod from "https://deno.land/x/axiod@0.22/mod.ts";
import { IAxiodResponse } from "https://deno.land/x/axiod@0.22/interfaces.ts";

export interface MarxanBotConfig {
  apiUrl: string;
  credentials: {
    username: string;
    password: string;
  };
}

const marxanBotBaseSettings = {
  baseUrl: "/api/v1",
};

export const getJsonApiDataFromResponse = (response: IAxiodResponse) => {
  return response?.data?.data;
};

export class BotHttpClient {
  constructor(config: MarxanBotConfig, jwt: string) {
    this.baseHttpClient = axiod.create({
      baseURL: config.apiUrl + marxanBotBaseSettings.baseUrl,
      headers: {
        Authorization: "Bearer " + jwt,
      },
    });

    this.currentJwt = jwt;
  }

  public baseHttpClient;
  public currentJwt;

  static async init(config: MarxanBotConfig) {
    const jwt = await axiod
      .post(`${config.apiUrl}/auth/sign-in/`, config.credentials)
      .then((result) => result.data.accessToken);

    return new BotHttpClient(config, jwt);
  }
}