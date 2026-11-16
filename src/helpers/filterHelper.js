import {
  STATUS_STOPPED,
  STATUS_CHECK_WAITING,
  STATUS_CHECKING,
  STATUS_DOWNLOAD_WAITING,
  STATUS_DOWNLOADING,
  STATUS_SEED_WAITING,
  STATUS_SEEDING,
  STATUSES,
} from './constants/statuses.js';
import {
  TRANSMISSION_COLUMN_DOWNLOAD_PROGRESS,
  TRANSMISSION_COLUMN_STATUS,
  TRANSMISSION_COLUMN_ERROR,
  TRANSMISSION_COLUMN_NAME,
  TRANSMISSION_COLUMN_LABELS,
  TRANSMISSION_COLUMN_TRACKERS,
  TRANSMISSION_COLUMN_DOWNLOAD_RATE,
  TRANSMISSION_COLUMN_UPLOAD_RATE,
  TRANSMISSION_COLUMN_PRIORITY,
} from './constants/columns.js';
import { trackerStripper } from './trackerHelper.js';

export const STATUS_FILTERS = [
  'active',
  'downloading',
  'complete',
  'stopped',
  'checking',
  'seeding',
  'error',
];

const DOWNLOADING = [
  STATUSES.indexOf(STATUS_DOWNLOADING),
  STATUSES.indexOf(STATUS_DOWNLOAD_WAITING),
];
const CHECKING = [
  STATUSES.indexOf(STATUS_CHECKING),
  STATUSES.indexOf(STATUS_CHECK_WAITING),
];
const SEEDING = [
  STATUSES.indexOf(STATUS_SEEDING),
  STATUSES.indexOf(STATUS_SEED_WAITING),
];
const STOPPED = STATUSES.indexOf(STATUS_STOPPED);
const CHECKING_NOW = STATUSES.indexOf(STATUS_CHECKING);

export function statusFilter(status, torrent) {
  const torrentStatus = torrent[TRANSMISSION_COLUMN_STATUS];

  switch (status) {
    case 'active':
      return (
        torrent[TRANSMISSION_COLUMN_DOWNLOAD_RATE] > 0 ||
        torrent[TRANSMISSION_COLUMN_UPLOAD_RATE] > 0 ||
        torrentStatus === CHECKING_NOW
      );
    case 'downloading':
      return DOWNLOADING.includes(torrentStatus);
    case 'complete':
      return torrent[TRANSMISSION_COLUMN_DOWNLOAD_PROGRESS] === 1;
    case 'stopped':
      return torrentStatus === STOPPED;
    case 'checking':
      return CHECKING.includes(torrentStatus);
    case 'seeding':
      return SEEDING.includes(torrentStatus);
    case 'error':
      return torrent[TRANSMISSION_COLUMN_ERROR];
    default:
      return true;
  }
}

// eslint-disable-next-line no-useless-escape
const SEARCH_IGNORED = /[ \[\]\.·_-]/g;
// Names only change on rename, so each one is normalized once
const normalizedCache = new Map();

export function normalizeSearch(value) {
  let normalized = normalizedCache.get(value);
  if (normalized === undefined) {
    normalized = value.toLowerCase().replace(SEARCH_IGNORED, '');
    if (normalizedCache.size > 50000) normalizedCache.clear();
    normalizedCache.set(value, normalized);
  }
  return normalized;
}

export function searchFilter(query, torrent) {
  if (!query) return true;

  return normalizeSearch(torrent[TRANSMISSION_COLUMN_NAME]).includes(
    normalizeSearch(query)
  );
}

export function labelFilter(label, torrent) {
  if (!label) return true;

  if (label === 'unlabeled') {
    return (
      !torrent[TRANSMISSION_COLUMN_LABELS] ||
      !torrent[TRANSMISSION_COLUMN_LABELS].length
    );
  }

  return torrent[TRANSMISSION_COLUMN_LABELS].includes(label);
}

// The tracker domains of a torrent, each once
export function torrentTrackers(torrent) {
  return [
    ...new Set(
      (torrent[TRANSMISSION_COLUMN_TRACKERS] || []).map((tracker) =>
        trackerStripper(tracker.announce)
      )
    ),
  ];
}

export function trackerFilter(tracker, torrent) {
  if (!tracker) return true;

  return (torrent[TRANSMISSION_COLUMN_TRACKERS] || []).some(
    (t) => trackerStripper(t.announce) === tracker
  );
}

export function priorityFilter(priority, torrent) {
  if (priority === null) return true;

  return torrent[TRANSMISSION_COLUMN_PRIORITY] === priority;
}

// Everything the filter sidebar shows a count for, in one pass over the list
export function countFilters(torrents) {
  const status = Object.fromEntries(STATUS_FILTERS.map((key) => [key, 0]));
  const priority = { 1: 0, 0: 0, [-1]: 0 };
  const labels = new Map();
  const trackers = new Map();
  let unlabeled = 0;

  for (const torrent of torrents) {
    for (const key of STATUS_FILTERS) {
      if (statusFilter(key, torrent)) status[key] += 1;
    }

    const torrentPriority = torrent[TRANSMISSION_COLUMN_PRIORITY];
    if (torrentPriority in priority) priority[torrentPriority] += 1;

    const torrentLabels = torrent[TRANSMISSION_COLUMN_LABELS] || [];
    if (!torrentLabels.length) unlabeled += 1;
    for (const label of new Set(torrentLabels)) {
      labels.set(label, (labels.get(label) || 0) + 1);
    }

    for (const tracker of torrentTrackers(torrent)) {
      trackers.set(tracker, (trackers.get(tracker) || 0) + 1);
    }
  }

  return {
    total: torrents.length,
    status,
    priority,
    unlabeled,
    labels,
    trackers,
  };
}
