import { BotHttpClient, MarxanBotConfig } from "./marxan-bot.ts";
import { Organizations } from "./organizations.ts";
import { Projects } from "./projects.ts";
import { Scenarios } from "./scenarios.ts";
import { ScenarioEditingMetadata } from "./scenario-editing-metadata.ts";
import { PlanningAreaShapefiles } from "./planning-area-shapefiles.ts";
import { ProtectedAreas } from "./protected-areas.ts";
import { GeoFeatureSpecifications } from "./geo-feature-specifications.ts";
import { GeoFeatures } from "./geo-features.ts";
import { MarxanCalculations } from "./marxan-calculations.ts";
import { ScenarioJobStatus } from "./scenario-status.ts";

export interface Bot {
  organizations: Organizations;
  projects: Projects;
  scenarios: Scenarios;
  scenarioStatus: ScenarioJobStatus;
  geoFeatures: GeoFeatures;
  geoFeatureSpecifications: GeoFeatureSpecifications;
  planningAreaUploader: PlanningAreaShapefiles;
  protectedAreas: ProtectedAreas;
  marxanExecutor: MarxanCalculations;
  metadata: ScenarioEditingMetadata;
}

export const createBot = async (botConfig: MarxanBotConfig): Promise<Bot> => {
  const httpClient = await BotHttpClient.init({
    apiUrl: botConfig?.apiUrl,
    credentials: {
      username: botConfig?.credentials.username,
      password: botConfig?.credentials.password,
    },
  });

  return {
    organizations: new Organizations(httpClient),
    projects: new Projects(httpClient),
    scenarios: new Scenarios(httpClient),
    scenarioStatus: new ScenarioJobStatus(httpClient),
    planningAreaUploader: new PlanningAreaShapefiles(
      httpClient,
      botConfig.apiUrl,
    ),
    protectedAreas: new ProtectedAreas(httpClient),
    geoFeatures: new GeoFeatures(httpClient),
    geoFeatureSpecifications: new GeoFeatureSpecifications(httpClient),
    marxanExecutor: new MarxanCalculations(httpClient),
    metadata: new ScenarioEditingMetadata(),
  };
};
