/**
 * @module chain/forkChoice
 */

import {toHexString} from "@chainsafe/ssz";
import {allForks, Slot} from "@chainsafe/lodestar-types";
import {IChainForkConfig} from "@chainsafe/lodestar-config";
import {ForkChoice, ProtoArray, ForkChoiceStore, ITransitionStore} from "@chainsafe/lodestar-fork-choice";

import {computeAnchorCheckpoint} from "../initState";
import {ChainEventEmitter} from "../emitter";
import {getEffectiveBalances, CachedBeaconState} from "@chainsafe/lodestar-beacon-state-transition";
import {IMetrics} from "../../metrics";
import {ChainEvent} from "../emitter";
import {IBeaconDb} from "../../db";

export type ForkChoiceOpts = {
  terminalTotalDifficulty?: bigint;
};

/**
 * Fork Choice extended with a ChainEventEmitter
 */
export function initializeForkChoice(
  config: IChainForkConfig,
  transitionStore: ITransitionStore | null,
  emitter: ChainEventEmitter,
  currentSlot: Slot,
  state: CachedBeaconState<allForks.BeaconState>,
  metrics?: IMetrics | null
): ForkChoice {
  const {blockHeader, checkpoint} = computeAnchorCheckpoint(config, state);
  const finalizedCheckpoint = {...checkpoint};
  const justifiedCheckpoint = {
    ...checkpoint,
    // If not genesis epoch, justified checkpoint epoch must be set to finalized checkpoint epoch + 1
    // So that we don't allow the chain to initially justify with a block that isn't also finalizing the anchor state.
    // If that happens, we will create an invalid head state,
    // with the head not matching the fork choice justified and finalized epochs.
    epoch: checkpoint.epoch === 0 ? checkpoint.epoch : checkpoint.epoch + 1,
  };

  const justifiedBalances = getEffectiveBalances(state);

  return new ForkChoice(
    config,

    new ForkChoiceStore(currentSlot, justifiedCheckpoint, finalizedCheckpoint, {
      onJustified: (cp) => emitter.emit(ChainEvent.forkChoiceJustified, cp),
      onFinalized: (cp) => emitter.emit(ChainEvent.forkChoiceFinalized, cp),
    }),

    transitionStore,

    ProtoArray.initialize({
      slot: blockHeader.slot,
      parentRoot: toHexString(blockHeader.parentRoot),
      stateRoot: toHexString(blockHeader.stateRoot),
      blockRoot: toHexString(checkpoint.root),
      justifiedEpoch: justifiedCheckpoint.epoch,
      justifiedRoot: toHexString(justifiedCheckpoint.root),
      finalizedEpoch: finalizedCheckpoint.epoch,
      finalizedRoot: toHexString(finalizedCheckpoint.root),
    }),

    justifiedBalances,
    metrics
  );
}

/**
 * Initialize TransitionStore with locally persisted value, overriding it with user provided option.
 */
export async function initializeTransitionStore(opts: ForkChoiceOpts, db: IBeaconDb): Promise<ITransitionStore | null> {
  if (opts.terminalTotalDifficulty !== undefined) {
    return {terminalTotalDifficulty: opts.terminalTotalDifficulty};
  }

  const terminalTotalDifficulty = await db.totalTerminalDifficulty.get();
  if (terminalTotalDifficulty !== null) {
    return {terminalTotalDifficulty: opts.terminalTotalDifficulty ?? terminalTotalDifficulty};
  }

  return null;
}
