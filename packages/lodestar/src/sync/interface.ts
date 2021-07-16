import {ILogger} from "@chainsafe/lodestar-utils";
import {Slot} from "@chainsafe/lodestar-types";
import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {routes} from "@chainsafe/lodestar-api";
import {INetwork} from "../network";
import {IBeaconChain} from "../chain";
import {IMetrics} from "../metrics";
import {IBeaconDb} from "../db";
import {SyncChainDebugState} from "./range/chain";
import {BackfillSync} from "./backfill";
export {SyncChainDebugState};

export type SyncingStatus = routes.node.SyncingStatus;

export interface IBeaconSync {
  backfillSync: BackfillSync;
  state: SyncState;
  close(): void;
  getSyncStatus(): SyncingStatus;
  isSynced(): boolean;
  isSyncing(): boolean;
  getSyncChainsDebugState(): SyncChainDebugState[];
}

export enum SyncState {
  /** No useful peers are connected */
  Stalled = "Stalled",
  /** The node is performing a long-range sync over a finalized chain */
  SyncingFinalized = "SyncingFinalized",
  /** The node is performing a long-range sync over head chains */
  SyncingHead = "SyncingHead",
  /** The node is up to date with all known peers */
  Synced = "Synced",
}

/** Map a SyncState to an integer for rendering in Grafana */
export const syncStateMetric: {[K in SyncState]: number} = {
  [SyncState.Stalled]: 0,
  [SyncState.SyncingFinalized]: 1,
  [SyncState.SyncingHead]: 2,
  [SyncState.Synced]: 3,
};

export interface ISyncModule {
  getHighestBlock(): Slot;
}

export interface ISlotRange {
  start: Slot;
  end: Slot;
}

export interface ISyncModules {
  config: IBeaconConfig;
  network: INetwork;
  db: IBeaconDb;
  metrics: IMetrics | null;
  logger: ILogger;
  chain: IBeaconChain;
}
