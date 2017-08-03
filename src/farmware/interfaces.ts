import { SyncStatus, Dictionary, FarmwareManifest, JobProgress } from "farmbot/dist";

export interface FWState {
  selectedFarmware: string | undefined;
  packageUrl: string | undefined;
}

export interface FWProps {
  syncStatus: SyncStatus;
  farmwares: Dictionary<FarmwareManifest | undefined>;
  jobs: Dictionary<JobProgress | undefined>;
}

export interface FarmwareState {
  currentImage: string | undefined;
}
