import {phase0, ssz} from "@chainsafe/lodestar-types";

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
}
