import {config} from "@chainsafe/lodestar-config/default";
import {allForks} from "../../../../src";
import {CachedValidatorList, CachedValidatorListProxyHandler, EpochContext} from "../../../../src/allForks";
import {phase0, ssz} from "@chainsafe/lodestar-types";
import {MutableVector} from "@chainsafe/persistent-ts";

let i = 0;
const heapUsed = process.memoryUsage().heapUsed;

const vc = 250_000;

while (true) {
  getRegistryUpdatesTestData(vc);
  global.gc();
  console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
}

/**
 * Create a state that causes `changeRatio` fraction (0,1) of validators to change their effective balance.
 */
function getRegistryUpdatesTestData(vc: number): any {
  const validatorsFlat: phase0.Validator[] = [];
  const stateTB = ssz.phase0.BeaconState.defaultTreeBacked();
  stateTB.slot = 1;
  const validator = ssz.phase0.Validator.defaultValue();
  validator.exitEpoch = Infinity;
  validator.withdrawableEpoch = Infinity;
  for (let i = 0; i < vc; i++) {
    stateTB.validators.push(validator);
    validatorsFlat.push(validator);
  }

  /////// Create minimal EpochCtx
  const epochCtx = {
    exitQueueChurn: 5,
    exitQueueEpoch: 5,
    churnLimit: 5,
    currentShuffling: {epoch: 10},
  } as EpochContext;
  ///////

  /////// Recreate minimal CachedBeaconState
  const validatorCache = MutableVector.from(Array.from(validatorsFlat));
  const validators = (new Proxy(
    new CachedValidatorList(
      ssz.phase0.BeaconState.fields["validators"] as any,
      ssz.phase0.BeaconState.tree_getProperty(stateTB.tree, "validators") as any,
      validatorCache
    ),
    CachedValidatorListProxyHandler
  ) as unknown) as allForks.BeaconState["validators"];
  const state = ({
    validators,
    epochCtx,
    config,
    finalizedCheckpoint: {epoch: 10},
  } as unknown) as allForks.CachedBeaconState<allForks.BeaconState>;
  ///////
}
