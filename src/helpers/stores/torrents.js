import { derived, writable, get } from 'svelte/store';
import Transmission from '~helpers/Transmission';
import {
  STATUSES,
  STATUS_DOWNLOADING,
  STATUS_STOPPED,
} from '~helpers/constants/statuses';
import {
  TRANSMISSION_COLUMN,
  TRANSMISSION_COLUMN_STATUS,
  TRANSMISSION_COLUMN_DOWNLOAD_DIR,
  TRANSMISSION_COLUMN_UPLOAD_RATE,
  TRANSMISSION_COLUMN_DOWNLOAD_RATE,
  TRANSMISSION_COLUMN_NAME,
  TRANSMISSION_COLUMN_MAGNET_LINK,
} from '~helpers/constants/columns';
import { sorting } from '~helpers/stores/sorting';
import { transmissionColumns, filters, alerts } from '~helpers/stores';
import {
  searchFilter,
  statusFilter,
  trackerFilter,
  labelFilter,
  priorityFilter,
  countFilters,
} from '~helpers/filterHelper';
import {
  mergePolledTorrents,
  reconcileTorrents,
  sortTorrents,
} from '~helpers/torrentListHelper';
import { copyToClipboard } from '../copyHelper';
import { scheduleWhenVisible } from '~helpers/pollHelper';

const TORRENT_FETCHING_TIMEOUT = 1000;
// "recently-active" only reports changes from the last minute, so after a
// longer gap (hidden tab, sleeping laptop) everything is fetched again.
const MAX_RECENTLY_ACTIVE_GAP = 30000;
// Columns that never change, or only through this UI (which updates the store
// itself), come with full fetches only. They are most of the bytes: magnet
// links and tracker lists repeat for every active torrent every second.
const FULL_FETCH_ONLY_COLUMNS = [
  TRANSMISSION_COLUMN.MAGNET_LINK,
  TRANSMISSION_COLUMN.TRACKERS,
  TRANSMISSION_COLUMN.HASH,
  TRANSMISSION_COLUMN.COMMENT,
  TRANSMISSION_COLUMN.CREATED,
  TRANSMISSION_COLUMN.PRIVATE,
  TRANSMISSION_COLUMN.ADDED,
];
// Picks up those columns when another client changes them (e.g. trackers)
const FULL_FETCH_INTERVAL = 5 * 60 * 1000;

const transmission = new Transmission();
let cancelUpdate;
let lastFetch = 0;
let lastFullFetch = 0;
const store = writable([]);
// Updated after every poll, even when nothing changed, so the speed graph keeps moving
const totalRate = writable({ upload: 0, download: 0 });
// Columns of the last full fetch; a newly enabled column needs a full fetch to fill it
let fetchedColumns = [];

function scheduleUpdate(fetchTorrents) {
  cancelUpdate?.();
  cancelUpdate = scheduleWhenVisible(fetchTorrents, TORRENT_FETCHING_TIMEOUT);
}

function updateTotalRate() {
  const data = { upload: 0, download: 0 };
  get(store).forEach((torrent) => {
    data.upload += torrent[TRANSMISSION_COLUMN_UPLOAD_RATE];
    data.download += torrent[TRANSMISSION_COLUMN_DOWNLOAD_RATE];
  });
  totalRate.set(data);
}

const sorted = derived(
  [store, filters, sorting],
  ([$torrents, $filters, $sorting]) => {
    let filteredTorrents = $torrents;
    const hasFilter = Object.values($filters).some((value) => value !== null);
    if (hasFilter) {
      filteredTorrents = $torrents.filter(
        (torrent) =>
          searchFilter($filters.search, torrent) &&
          statusFilter($filters.status, torrent) &&
          labelFilter($filters.label, torrent) &&
          trackerFilter($filters.tracker, torrent) &&
          priorityFilter($filters.priority, torrent)
      );
    }

    return sortTorrents(filteredTorrents, $sorting);
  }
);

function getRecentlyActiveTorrents() {
  const columns = get(transmissionColumns);
  if (
    Date.now() - lastFetch > MAX_RECENTLY_ACTIVE_GAP ||
    Date.now() - lastFullFetch > FULL_FETCH_INTERVAL ||
    columns.some((column) => !fetchedColumns.includes(column))
  ) {
    getAllTorrents();
    return;
  }

  let nextFetch = getRecentlyActiveTorrents;

  transmission
    .getTorrents(
      'recently-active',
      columns.filter((column) => !FULL_FETCH_ONLY_COLUMNS.includes(column))
    )
    .then((result) => {
      if (!result) {
        return;
      }
      lastFetch = Date.now();

      const { torrents, changed, added } = mergePolledTorrents(
        get(store),
        result.torrents,
        result.removed
      );
      // Skipping the update when nothing changed keeps the list from
      // re-sorting and re-rendering every second
      if (changed) store.set(torrents);
      // New torrents lack the full fetch columns, so get everything next
      if (added.length) nextFetch = getAllTorrents;
      updateTotalRate();
    })
    // TODO: Error handling
    .catch((e) => {
      console.error(e);
      nextFetch = getAllTorrents;
    })
    .finally(() => {
      scheduleUpdate(nextFetch);
    });
}

function getAllTorrents() {
  let hasError = false;
  const columns = get(transmissionColumns);

  transmission
    .getTorrents(undefined, columns)
    .then((value) => {
      if (!value) {
        hasError = true;
        return;
      }
      hasError = false;
      lastFetch = Date.now();
      lastFullFetch = lastFetch;
      fetchedColumns = columns;
      store.set(reconcileTorrents(get(store), value));
      updateTotalRate();
    })
    // TODO: Error handling
    .catch((e) => {
      console.error(e);
      hasError = true;
    })
    .finally(() => {
      scheduleUpdate(hasError ? getAllTorrents : getRecentlyActiveTorrents);
    });
}

function createTorrentsStore() {
  getAllTorrents();

  const counts = derived(store, countFilters);

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    totalRate: { subscribe: totalRate.subscribe },
    sorted,
    // Counts for the filter sidebar, worked out once per change
    counts,
    labels: derived(counts, ($counts) => [...$counts.labels.keys()].sort()),
    trackers: derived(counts, ($counts) => [...$counts.trackers.keys()].sort()),
    // Makes the next poll a full fetch, for changes to its columns
    refresh: () => {
      lastFullFetch = 0;
    },
    rename: (ids, path, name) =>
      store.update((state) => {
        transmission.renamePath(ids, path, name).catch(() => store.set(state));
        return state.map((torrent) => {
          if (!ids.includes(torrent.id)) return torrent;

          return {
            ...torrent,
            [TRANSMISSION_COLUMN_NAME]: name,
          };
        });
      }),
    start: (ids) =>
      store.update((state) => {
        transmission.startTorrents(ids).catch(() => store.set(state));
        return state.map((torrent) => {
          if (!ids.includes(torrent.id)) return torrent;

          return {
            ...torrent,
            [TRANSMISSION_COLUMN_STATUS]: STATUSES.indexOf(STATUS_DOWNLOADING),
          };
        });
      }),
    startNow: (ids) =>
      store.update((state) => {
        transmission.startNowTorrents(ids).catch(() => store.set(state));
        return state.map((torrent) => {
          if (!ids.includes(torrent.id)) return torrent;

          return {
            ...torrent,
            [TRANSMISSION_COLUMN_STATUS]: STATUSES.indexOf(STATUS_DOWNLOADING),
          };
        });
      }),
    stop: (ids) =>
      store.update((state) => {
        transmission.stopTorrents(ids).catch(() => store.set(state));
        return state.map((torrent) => {
          if (!ids.includes(torrent.id)) return torrent;

          return {
            ...torrent,
            [TRANSMISSION_COLUMN_STATUS]: STATUSES.indexOf(STATUS_STOPPED),
          };
        });
      }),
    setTorrents: (ids, data) => {
      return transmission.setTorrents(ids, data).then(() => {
        store.update((state) => {
          return state.map((t) => {
            if (!ids.includes(t.id)) return t;
            return { ...t, ...data };
          });
        });
      });
    },
    setLocation: (ids, location, move) => {
      return transmission.setTorrentsLocation(ids, location, move).then(() => {
        store.update((state) => {
          return state.map((t) => {
            if (!ids.includes(t.id)) return t;
            return { ...t, [TRANSMISSION_COLUMN_DOWNLOAD_DIR]: location };
          });
        });
      });
    },
    verify: (ids) => transmission.verifyTorrents(ids),
    copyMagnetLinks: (ids) => {
      const torrents = get(store);
      const selectedTorrents = torrents.filter((torrent) =>
        ids.includes(torrent.id)
      );
      const magnetLinks = selectedTorrents.map(
        (torrent) => torrent[TRANSMISSION_COLUMN_MAGNET_LINK]
      );

      return copyToClipboard(magnetLinks.join(', '))
        .then(() => {
          alerts.add('Magnet links copied');
        })
        .catch(() => {
          alerts.add('Magnet links copy failed', 'negative');
        });
    },
    reannounce: (ids) => transmission.reannounceTorrents(ids),
    remove: (ids, deleteLocalData) =>
      transmission.removeTorrents({ ids, deleteLocalData }),
    add: (data) => transmission.addTorrent(data),
  };
}
export const torrents = createTorrentsStore();
