// Real/sensitive data never ships in the repository or the deployed build.
// This module holds an in-memory override, loaded only by the user picking
// a JSON file from their own machine at runtime (see ImportLocalDataButton).
// Nothing here is committed; `local-data/` is gitignored and is where such
// a file would live locally if the user wants one on disk between sessions.
import type { OfferType } from '@/data/demo-data';

let override: OfferType[] | null = null;

export function setLocalDataOverride(data: OfferType[]) {
  override = data;
}

export function clearLocalDataOverride() {
  override = null;
}

export function getLocalDataOverride(): OfferType[] | null {
  return override;
}
