import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFileTree,
  getFolderStats,
  getFileMatches,
  getVisibleRows,
  getFolderFiles,
  getAllFolders,
  getMainFolder,
  PRIORITY_MIXED,
} from '../src/helpers/folderStructureHelper.js';

// Shaped like Transmission's torrent-get `files` and `fileStats`
const files = [
  { name: 'Show/Season 10/E1.mkv', length: 100 },
  { name: 'Show/Season 2/E2.mkv', length: 200 },
  { name: 'Show/Season 2/E1.mkv', length: 300 },
  { name: 'Show/readme.txt', length: 10 },
];
const fileStats = [
  { bytesCompleted: 100, wanted: true, priority: 0 },
  { bytesCompleted: 0, wanted: false, priority: 1 },
  { bytesCompleted: 150, wanted: true, priority: 1 },
  { bytesCompleted: 10, wanted: true, priority: 0 },
];

const folderByName = (tree, name) =>
  tree.folders.findIndex((folder) => folder.name === name);

test('skips the wrapping folder every multi-file torrent has', () => {
  const tree = buildFileTree(files);
  assert.equal(tree.folders[tree.root].name, 'Show');
  assert.equal(getMainFolder('/downloads', tree), '/downloads/Show');
});

test('keeps single-file torrents at the root', () => {
  const tree = buildFileTree([{ name: 'movie.mkv', length: 1 }]);
  assert.equal(tree.root, 0);
  assert.equal(getMainFolder('/downloads', tree), '/downloads');
});

test('sorts folders and files naturally', () => {
  const tree = buildFileTree(files);
  const seasons = tree.folders[tree.root].folders.map(
    (index) => tree.folders[index].name
  );
  assert.deepEqual(seasons, ['Season 2', 'Season 10']);

  const season2 = tree.folders[folderByName(tree, 'Season 2')];
  assert.deepEqual(
    season2.files.map((index) => tree.files[index].name),
    ['E1.mkv', 'E2.mkv']
  );
});

test('maps every folder to a contiguous range of its files', () => {
  const tree = buildFileTree(files);
  assert.deepEqual(
    getFolderFiles(tree, folderByName(tree, 'Season 2')).sort(),
    [1, 2]
  );
  assert.equal(getFolderFiles(tree, tree.root).length, files.length);
});

test('rolls file stats up into folder totals', () => {
  const tree = buildFileTree(files);
  const stats = getFolderStats(tree, fileStats);
  const season2 = folderByName(tree, 'Season 2');

  assert.equal(stats.length[season2], 500);
  assert.equal(stats.completed[season2], 150);
  assert.equal(stats.wantedCount[season2], 1);
  assert.equal(stats.fileCount[season2], 2);
  assert.equal(stats.wantedLength[0], 410);
  assert.equal(stats.fileCount[0], 4);
});

test('reports the priority of wanted files, or mixed', () => {
  const tree = buildFileTree(files);
  const stats = getFolderStats(tree, fileStats);

  // Only the high priority episode is wanted in Season 2
  assert.equal(stats.priority(folderByName(tree, 'Season 2')), 1);
  assert.equal(stats.priority(folderByName(tree, 'Season 10')), 0);
  assert.equal(stats.priority(tree.root), PRIORITY_MIXED);
});

test('only counts included files when filtering', () => {
  const tree = buildFileTree(files);
  const matches = getFileMatches(tree, 'season 2 e2');
  const stats = getFolderStats(tree, fileStats, matches.files);

  assert.deepEqual(matches.indices, [1]);
  assert.equal(stats.fileCount[0], 1);
  assert.equal(stats.wantedCount[0], 0);
});

test('flattens only expanded folders into rows', () => {
  const tree = buildFileTree(files);
  const collapsed = getVisibleRows(tree, {}, null);
  assert.deepEqual(
    collapsed.map((row) =>
      row.folder !== undefined
        ? tree.folders[row.folder].name
        : tree.files[row.file].name
    ),
    ['Season 2', 'Season 10', 'readme.txt']
  );

  const expanded = Object.fromEntries(
    getAllFolders(tree).map((index) => [index, true])
  );
  // Two season folders plus all four files
  assert.equal(getVisibleRows(tree, expanded, null).length, 6);
});

test('shows matching files with their folders expanded while filtering', () => {
  const tree = buildFileTree(files);
  const rows = getVisibleRows(tree, {}, getFileMatches(tree, 'E1'));

  assert.deepEqual(
    rows.map((row) =>
      row.folder !== undefined
        ? `${tree.folders[row.folder].name}/`
        : tree.files[row.file].path
    ),
    ['Season 2/', 'Show/Season 2/E1.mkv', 'Season 10/', 'Show/Season 10/E1.mkv']
  );
});
