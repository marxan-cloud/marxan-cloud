export interface CostSurface {
  id: string;
  name: string;
  isDefault: boolean;
  min: number;
  max: number;
  scenarioUsageCount: number;
}
