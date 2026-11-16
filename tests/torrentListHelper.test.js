import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergePolledTorrents,
  reconcileTorrents,
  sortTorrents,
} from '../src/helpers/torrentListHelper.js';
import { countFilters, searchFilter } from '../src/helpers/filterHelper.js';
import {
  UI_COLUMN_ETA,
  UI_COLUMN_NAME,
  UI_COLUMN_TOTAL_SEEDERS,
} from '../src/helpers/constants/columns.js';

const torrent = (id, extra = {}) => ({
  id,
  name: `Torrent ${id}`,
  rateDownload: 0,
  labels: [],
  ...extra,
});

test('an unchanged poll keeps the same array and objects', () => {
  const current = [torrent(1), torrent(2, { labels: ['a'] })];
  const result = mergePolledTorrents(current, [
    { id: 2, rateDownload: 0, labels: ['a'] },
  ]);
  assert.equal(result.changed, false);
  assert.equal(result.torrents, current);
});

test('a changed torrent gets a new object, the others keep theirs', () => {
  const current = [torrent(1), torrent(2)];
  const result = mergePolledTorrents(current, [{ id: 2, rateDownload: 5 }]);
  assert.equal(result.changed, true);
  assert.equal(result.torrents[0], current[0]);
  assert.notEqual(result.torrents[1], current[1]);
  assert.equal(result.torrents[1].rateDownload, 5);
  assert.equal(result.torrents[1].name, 'Torrent 2');
});

test('removed torrents go, unknown ones are reported as added', () => {
  const current = [torrent(1), torrent(2)];
  const result = mergePolledTorrents(current, [torrent(3)], [1]);
  assert.deepEqual(
    result.torrents.map((t) => t.id),
    [2]
  );
  assert.deepEqual(
    result.added.map((t) => t.id),
    [3]
  );
});

test('a full fetch reuses unchanged torrents and keeps an unchanged list', () => {
  const current = [torrent(1), torrent(2)];
  assert.equal(reconcileTorrents(current, [torrent(1), torrent(2)]), current);

  const next = reconcileTorrents(current, [
    torrent(1),
    torrent(2, { rateDownload: 3 }),
    torrent(3),
  ]);
  assert.equal(next[0], current[0]);
  assert.equal(next[1].rateDownload, 3);
  assert.equal(next.length, 3);
});

test('sorting returns a copy and compares names case-insensitively', () => {
  const list = [
    torrent(1, { name: 'beta' }),
    torrent(2, { name: 'Alpha' }),
    torrent(3, { name: 'gamma' }),
  ];
  const sorted = sortTorrents(list, {
    id: UI_COLUMN_NAME.id,
    direction: 'asc',
  });
  assert.deepEqual(
    sorted.map((t) => t.id),
    [2, 1, 3]
  );
  assert.deepEqual(
    list.map((t) => t.id),
    [1, 2, 3]
  );
});

test('sorting puts unknown ETAs last and uses the most seeders', () => {
  const eta = sortTorrents(
    [torrent(1, { eta: -1 }), torrent(2, { eta: 60 }), torrent(3, { eta: 5 })],
    { id: UI_COLUMN_ETA.id, direction: 'asc' }
  );
  assert.deepEqual(
    eta.map((t) => t.id),
    [3, 2, 1]
  );

  const seeders = sortTorrents(
    [
      torrent(1, { trackerStats: [{ seederCount: 3 }, { seederCount: 9 }] }),
      torrent(2, { trackerStats: [{ seederCount: 5 }] }),
    ],
    { id: UI_COLUMN_TOTAL_SEEDERS.id, direction: 'desc' }
  );
  assert.deepEqual(
    seeders.map((t) => t.id),
    [1, 2]
  );
});

test('filter counts come from one pass', () => {
  const tracker = (host) => ({ announce: `https://${host}/announce` });
  const counts = countFilters([
    torrent(1, {
      status: 4,
      rateDownload: 10,
      bandwidthPriority: 1,
      labels: ['movies'],
      trackers: [tracker('a.example.org'), tracker('b.example.org:443')],
    }),
    torrent(2, {
      status: 0,
      percentDone: 1,
      bandwidthPriority: 0,
      labels: [],
      trackers: [tracker('tracker.example.org')],
    }),
  ]);
  assert.equal(counts.total, 2);
  assert.equal(counts.status.active, 1);
  assert.equal(counts.status.downloading, 1);
  assert.equal(counts.status.stopped, 1);
  assert.equal(counts.status.complete, 1);
  assert.deepEqual(counts.priority, { 1: 1, 0: 1, [-1]: 0 });
  assert.equal(counts.unlabeled, 1);
  assert.equal(counts.labels.get('movies'), 1);
  // Both of the first torrent's trackers are on example.org: counted once
  assert.equal(counts.trackers.get('example.org'), 2);
});

test('search ignores case and separators', () => {
  const t = torrent(1, { name: 'Some.Show.S01_1080p' });
  assert.equal(searchFilter('some show s01', t), true);
  assert.equal(searchFilter('other', t), false);
});
