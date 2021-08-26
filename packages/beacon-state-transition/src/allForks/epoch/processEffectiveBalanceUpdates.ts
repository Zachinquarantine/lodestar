import {
  EFFECTIVE_BALANCE_INCREMENT,
  HYSTERESIS_DOWNWARD_MULTIPLIER,
  HYSTERESIS_QUOTIENT,
  HYSTERESIS_UPWARD_MULTIPLIER,
  MAX_EFFECTIVE_BALANCE,
} from "@chainsafe/lodestar-params";
import {allForks} from "@chainsafe/lodestar-types";
import {bigIntMin} from "@chainsafe/lodestar-utils";
import {IEpochProcess, CachedBeaconState} from "../util";

/**
 * Update effective balances if validator.balance has changed enough (hysteresis)
 *
 * PERF: Cost 'proportional' to $VALIDATOR_COUNT, to iterate over all balances. Then cost is proportional to the amount
 * of validators whose effectiveBalance changed. Worst case is a massive network leak or a big slashing event which
 * causes a large amount of the network to decrease their balance simultaneously.
 *
 * - On normal mainnet conditions 0 validators change their effective balance
 * - In case of big innactivity event a medium portion of validators may have their effectiveBalance updated
 */
export function processEffectiveBalanceUpdates(
  state: CachedBeaconState<allForks.BeaconState>,
  epochProcess: IEpochProcess
): void {
  const {validators, epochCtx} = state;
  const {effectiveBalances} = epochCtx;
  const HYSTERESIS_INCREMENT = EFFECTIVE_BALANCE_INCREMENT / BigInt(HYSTERESIS_QUOTIENT);
  const DOWNWARD_THRESHOLD = HYSTERESIS_INCREMENT * BigInt(HYSTERESIS_DOWNWARD_MULTIPLIER);
  const UPWARD_THRESHOLD = HYSTERESIS_INCREMENT * BigInt(HYSTERESIS_UPWARD_MULTIPLIER);

  for (let i = 0, len = epochProcess.balancesFlat.length; i < len; i++) {
    const balance = epochProcess.balancesFlat[i];
    // PERF: It's faster to access to get() every single element (4ms) than to convert to regular array then loop (9ms)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const effectiveBalance = effectiveBalances.get(i)!;
    if (
      // Too big
      effectiveBalance > balance + DOWNWARD_THRESHOLD ||
      // Too small. Check effectiveBalance < MAX_EFFECTIVE_BALANCE to prevent unnecessary updates
      (effectiveBalance < MAX_EFFECTIVE_BALANCE && effectiveBalance < balance - UPWARD_THRESHOLD)
    ) {
      const newEffectiveBalance = bigIntMin(balance - (balance % EFFECTIVE_BALANCE_INCREMENT), MAX_EFFECTIVE_BALANCE);
      if (newEffectiveBalance !== effectiveBalance) {
        // Update the state tree
        validators[i].effectiveBalance = newEffectiveBalance;
        // Also update the fast cached version
        // Should happen rarely, so it's fine to update the tree
        // TODO: Update all in batch after this loop
        epochCtx.effectiveBalances.set(i, newEffectiveBalance);
      }
    }
  }
}
