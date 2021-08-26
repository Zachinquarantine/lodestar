"use strict";
exports.__esModule = true;
var benchmark_1 = require("@dapplion/benchmark");
var src_1 = require("../../../../src");
var allForks_1 = require("../../../../src/allForks");
var util_1 = require("../../util");
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
var i = 0;
describe("phase0 processRegistryUpdates", function () {
  benchmark_1.setBenchOpts({maxMs: 60 * 1000, minRuns: 5});
  var vc = util_1.numValidators;
  var testCases = [
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
  var heapUsed;
  var _loop_1 = function (id, lengths) {
    benchmark_1.itBench({
      id: "phase0 processRegistryUpdates - " + vc + " " + id,
      before: function () {
        heapUsed = process.memoryUsage().heapUsed;
      },
      fn: function () {
        var _a = getRegistryUpdatesTestData(vc, lengths),
          state = _a.state,
          epochProcess = _a.epochProcess;
        console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
        src_1.allForks.processRegistryUpdates(state, epochProcess);
        // @ts-ignore
        %DebugTrackRetainingPath(state);
      },
    });
  };
  for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
    var _a = testCases_1[_i],
      id = _a.id,
      lengths = _a.lengths;
    _loop_1(id, lengths);
  }
});
/**
 * Create a state that causes `changeRatio` fraction (0,1) of validators to change their effective balance.
 */
function getRegistryUpdatesTestData(vc, lengths) {
  var state = util_1.generatePerfTestCachedStatePhase0({goBackOneSlot: true});
  var epochProcess = allForks_1.beforeProcessEpoch(state);
  epochProcess.indicesToEject = linspace(lengths.indicesToEject);
  epochProcess.indicesEligibleForActivationQueue = linspace(lengths.indicesEligibleForActivationQueue);
  epochProcess.indicesEligibleForActivation = linspace(lengths.indicesEligibleForActivation);
  return {
    state: state,
    epochProcess: epochProcess,
  };
}
function linspace(count) {
  var arr = [];
  for (var i_1 = 0; i_1 < count; i_1++) arr.push(i_1);
  return arr;
}
