import {ssz} from "@chainsafe/lodestar-types";

let i = 0;
const heapUsed = process.memoryUsage().heapUsed;

while (true) {
  getBigStateTreeBacked();
  global.gc();
  console.log(i++, (process.memoryUsage().heapUsed - heapUsed) / 1e6, "MB");
}

function getBigStateTreeBacked(): any {
  const stateTB = ssz.phase0.BeaconState.defaultTreeBacked();
  const validator = ssz.phase0.Validator.defaultValue();
  for (let i = 0; i < 250_000; i++) {
    stateTB.validators.push(validator);
  }
}
