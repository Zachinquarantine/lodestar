/**
 * @module db/api/beacon
 */

import {IDbMetrics} from "@chainsafe/lodestar-db";

import {
  AttesterSlashingRepository,
  BlockArchiveRepository,
  BlockRepository,
  DepositEventRepository,
  DepositDataRootRepository,
  Eth1DataRepository,
  ProposerSlashingRepository,
  StateArchiveRepository,
  VoluntaryExitRepository,
  BestUpdatePerCommitteePeriod,
  LightclientFinalizedCheckpoint,
  LightClientInitProofRepository,
  LightClientSyncCommitteeProofRepository,
} from "./repositories";
import {
  PreGenesisState,
  PreGenesisStateLastProcessedBlock,
  LatestFinalizedUpdate,
  LatestNonFinalizedUpdate,
  TotalTerminalDifficulty,
} from "./single";

/**
 * The DB service manages the data layer of the beacon chain
 * The exposed methods do not refer to the underlying data engine,
 * but instead expose relevent beacon chain objects
 */
export interface IBeaconDb {
  metrics?: IDbMetrics;

  // unfinalized blocks
  block: BlockRepository;

  // finalized blocks
  blockArchive: BlockArchiveRepository;

  // finalized states
  stateArchive: StateArchiveRepository;

  // op pool
  voluntaryExit: VoluntaryExitRepository;
  proposerSlashing: ProposerSlashingRepository;
  attesterSlashing: AttesterSlashingRepository;
  depositEvent: DepositEventRepository;

  // eth1 processing
  preGenesisState: PreGenesisState;
  preGenesisStateLastProcessedBlock: PreGenesisStateLastProcessedBlock;

  // all deposit data roots and merkle tree
  depositDataRoot: DepositDataRootRepository;
  eth1Data: Eth1DataRepository;

  // altair
  bestUpdatePerCommitteePeriod: BestUpdatePerCommitteePeriod;
  latestFinalizedUpdate: LatestFinalizedUpdate;
  latestNonFinalizedUpdate: LatestNonFinalizedUpdate;
  lightclientFinalizedCheckpoint: LightclientFinalizedCheckpoint;
  lightClientInitProof: LightClientInitProofRepository;
  lightClientSyncCommitteeProof: LightClientSyncCommitteeProofRepository;
  totalTerminalDifficulty: TotalTerminalDifficulty;

  /**
   * Start the connection to the db instance and open the db store.
   */
  start(): Promise<void>;

  /**
   *  Stop the connection to the db instance and close the db store.
   */
  stop(): Promise<void>;
}
