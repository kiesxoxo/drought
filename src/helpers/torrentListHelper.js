// Pure helpers behind the torrents store, kept free of Svelte and path
// aliases so they can be unit tested with node --test.
import {
  COLUMN_MAP,
  TRANSMISSION_COLUMN_ETA,
  UI_COLUMN_TOTAL_LEECHERS,
  UI_COLUMN_TOTAL_SEEDERS,
} from './constants/columns.js';

// RPC values are primitives or small arrays and objects (labels, trackers)
const isSameValue = (a, b) =>
  a === b ||
  (typeof a === 'object' &&
    a !== null &&
    typeof b === 'object' &&
    b !== null &&
    JSON.stringify(a) === JSON.stringify(b));

// Applies a "recently-active" poll to the current list. Torrents whose values
// didn't change keep their object, and when nothing changed at all the same
// array comes back, so nothing downstream re-sorts or re-renders.
// Torrents the list doesn't have yet are returned in `added` rather than
// inserted: the poll leaves out columns that only full fetches carry.
export const mergePolledTorrents = (current, polled, removed = []) => {
  const updates = new Map(polled.map((torrent) => [torrent.id, torrent]));
  const removedIds = new Set(removed);
  let changed = false;

  const next = [];
  for (const torrent of current) {
    if (removedIds.has(torrent.id)) {
      changed = true;
      continue;
    }
    const update = updates.get(torrent.id);
    if (!update) {
      next.push(torrent);
      continue;
    }
    updates.delete(torrent.id);
    const differs = Object.keys(update).some(
      (key) => !isSameValue(torrent[key], update[key])
    );
    if (differs) {
      changed = true;
      next.push({ ...torrent, ...update });
    } else {
      next.push(torrent);
    }
  }

  const added = [...updates.values()].filter(
    (torrent) => !removedIds.has(torrent.id)
  );
  return { torrents: changed ? next : current, changed, added };
};

// Applies a full fetch: the fetched list wins, but torrents that didn't
// change keep their object, and an unchanged list keeps its array
export const reconcileTorrents = (current, fetched) => {
  const existing = new Map(current.map((torrent) => [torrent.id, torrent]));
  let changed = current.length !== fetched.length;
  const next = fetched.map((torrent, index) => {
    const previous = existing.get(torrent.id);
    const same =
      previous &&
      Object.keys(previous).length === Object.keys(torrent).length &&
      Object.keys(torrent).every((key) =>
        isSameValue(previous[key], torrent[key])
      );
    if (!same || current[index] !== previous) changed = true;
    return same ? previous : torrent;
  });
  return changed ? next : current;
};

const maxCount = (trackerStats, key) =>
  Math.max(...(trackerStats || []).map((stats) => stats[key]));

// The values a torrent sorts by for a UI column, most important first
const sortKeys = (torrent, sortingId, columns) =>
  columns.map((column) => {
    let value = torrent[column];
    if (sortingId === UI_COLUMN_TOTAL_SEEDERS.id) {
      return maxCount(value, 'seederCount');
    }
    if (sortingId === UI_COLUMN_TOTAL_LEECHERS.id) {
      return maxCount(value, 'leecherCount');
    }
    if (typeof value === 'string') return value.toLowerCase();
    // Transmission reports an unknown or infinite ETA as a negative number
    // Reference: https://github.com/transmission/transmission/blob/3.00/libtransmission/transmission.h#L1748-L1749
    if (column === TRANSMISSION_COLUMN_ETA && value < 0) {
      return Number.MAX_SAFE_INTEGER;
    }
    return value;
  });

// Returns a sorted copy; the input array is left alone. Each torrent's sort
// keys are worked out once rather than on every comparison.
export const sortTorrents = (torrents, { id, direction }) => {
  const columns = COLUMN_MAP[id];
  if (!columns) {
    console.warn('Unrecognized sorting');
    return [...torrents];
  }

  const order = direction === 'desc' ? -1 : 1;
  return torrents
    .map((torrent) => ({ torrent, keys: sortKeys(torrent, id, columns) }))
    .sort((a, b) => {
      for (let index = 0; index < a.keys.length; index += 1) {
        if (a.keys[index] < b.keys[index]) return -order;
        if (a.keys[index] > b.keys[index]) return order;
      }
      return 0;
    })
    .map(({ torrent }) => torrent);
};
