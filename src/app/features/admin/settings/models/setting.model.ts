export interface SettingDTO {
  key: string;
  value: string;
  description: string | null;
  editable: boolean;
  type?: 'boolean' | 'number' | 'text' | 'select' | null;
  unit?: string | null;
  min?: number | null;
  max?: number | null;
  options?: string[];
}

export interface SettingUpdatePayload {
  values: Record<string, string>;
}


export interface OperationsView {
  generatedAt: string; appliedAt: string; pollingEnabled: boolean;
  sports: Array<{sport: string; integrated: boolean; state: string; playerStatsEnabled?: boolean | null; selectedProvider?: string;
    providers?: Array<{name:string;configured:boolean;markets:string[];quota:OperationsView["sports"][number]["quota"]}>;
    config: {pollSeconds:number; dailyBudget:number; eventCacheSeconds:number; statsCacheSeconds:number|null; paused:boolean};
    quota: {localRequestsToday:number; dailyBudget:number; remoteDailyRemaining:number|null; lastSuccessAt:string|null; pauseReason:string|null; minuteBudget:number; retryAt:string|null; utcDate:string}|null;
  }>;
}
