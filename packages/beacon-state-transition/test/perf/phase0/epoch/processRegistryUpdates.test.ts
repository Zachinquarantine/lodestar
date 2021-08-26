import {itBench, setBenchOpts} from "@dapplion/benchmark";
import {config} from "@chainsafe/lodestar-config/default";
import {allForks} from "../../../../src";
import {beforeProcessEpoch} from "../../../../src/allForks";
import {generatePerfTestCachedStatePhase0, numValidators} from "../../util";
import {StateEpoch} from "../../types";
import {ssz} from "@chainsafe/lodestar-types";

// PERF: Cost 'proportional' to only validators that active + exit. For mainnet conditions:
// - indicesEligibleForActivationQueue: Maxing deposits triggers 512 validator mutations
// - indicesEligibleForActivation: 4 per epoch
// - indicesToEject: Potentially the entire validator set. On a massive offline event this could trigger many mutations
//   per epoch. Note that once mutated that validator can't be added to indicesToEject.
//
// - On normal mainnet conditions only 4 validators will be updated
//   - indicesEligibleForActivation: ~4000
//   - indicesEligibleForActivationQueue: 0
//   - indicesToEject: 0

let i = 0;

describe("phase0 processRegistryUpdates", () => {
  setBenchOpts({maxMs: 60 * 1000, minRuns: 5});

  const vc = numValidators;
  const testCases: {id: string; lengths: IndicesLengths}[] = [
    // Normal (optimal) mainnet network conditions: No effectiveBalance is udpated
    // {
    //   id: "normalcase",
    //   lengths: {
    //     indicesToEject: 0,
    //     indicesEligibleForActivationQueue: 0,
    //     indicesEligibleForActivation: 4000,
    //   },
    // },
    // // All blocks in epoch full of deposits
    // {
    //   id: "badcase_full_deposits",
    //   lengths: {
    //     indicesToEject: 0,
    //     indicesEligibleForActivationQueue: 512,
    //     indicesEligibleForActivation: 4000,
    //   },
    // },
    // Worst case: All effective balance are updated
    {
      id: "worstcase_0.5",
      lengths: {
        indicesToEject: vc / 2,
        indicesEligibleForActivationQueue: 512,
        indicesEligibleForActivation: 4000,
      },
    },
  ];

  // Provide flat `epochProcess.balances` + flat `epochProcess.validators`
  // which will it update validators tree

  // for (const {id, lengths} of testCases) {
  //   itBench<StateEpoch, StateEpoch>({
  //     id: `phase0 processRegistryUpdates - ${vc} ${id}`,
  //     before: () => getRegistryUpdatesTestData(vc, lengths),
  //     beforeEach: ({state, epochProcess}) => ({state: state.clone(), epochProcess}),
  //     fn: ({state, epochProcess}) => {
  //       console.log(i++);
  //       allForks.processRegistryUpdates(state, epochProcess);
  //     },
  //   });
  // }

  let heapUsed: number;

  for (const {id, lengths} of testCases) {
    itBench({
      id: `phase0 processRegistryUpdates - ${vc} ${id}`,
      before: () => {
        heapUsed = process.memoryUsage().heapUsed;
      },
      beforeEach: () => {
        global.gc();
      },
      fn: () => {
        const {state, epochProcess} = getRegistryUpdatesTestData(vc, lengths);
        console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
        allForks.processRegistryUpdates(state, epochProcess);
        // @ts-ignore
        // %DebugTrackRetainingPath(state);
      },
    });
  }
});

type IndicesLengths = {
  indicesToEject: number;
  indicesEligibleForActivationQueue: number;
  indicesEligibleForActivation: number;
};

/**
 * Create a state that causes `changeRatio` fraction (0,1) of validators to change their effective balance.
 */
function getRegistryUpdatesTestData(
  vc: number,
  lengths: IndicesLengths
): {
  state: allForks.CachedBeaconState<allForks.BeaconState>;
  epochProcess: allForks.IEpochProcess;
} {
  const stateTB = ssz.phase0.BeaconState.defaultTreeBacked();
  stateTB.slot = 1;
  const validator = ssz.phase0.Validator.defaultValue();
  validator.exitEpoch = Infinity;
  validator.withdrawableEpoch = Infinity;
  for (let i = 0; i < vc; i++) {
    stateTB.validators.push(validator);
  }
  const state = allForks.createCachedBeaconState(config, stateTB, {skipSyncPubkeys: true});

  const epochProcess = beforeProcessEpoch(state);

  epochProcess.indicesToEject = linspace(lengths.indicesToEject);
  epochProcess.indicesEligibleForActivationQueue = linspace(lengths.indicesEligibleForActivationQueue);
  epochProcess.indicesEligibleForActivation = linspace(lengths.indicesEligibleForActivation);

  return {
    state: state as allForks.CachedBeaconState<allForks.BeaconState>,
    epochProcess,
  };
}

function linspace(count: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < count; i++) arr.push(i);
  return arr;
}
