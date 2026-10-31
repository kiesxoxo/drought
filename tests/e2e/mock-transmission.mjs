// Serves a built Drought (default: dist/) at /transmission/web/ and answers
// the Transmission RPC with made-up data, for browser tests and screenshots.
// Changes made through the RPC are kept until POST /__reset.
//
//   node tests/e2e/mock-transmission.mjs [dist] [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'dist';
const PORT = Number(process.argv[3] || 8098);
const NOW = Math.floor(Date.now() / 1000);
const GB = 1e9;
const MB = 1e6;
const DAY = 86400;

const STOPPED = 0,
  DOWNLOADING = 4,
  SEEDING = 6,
  CHECKING = 2;

const trackers = (hosts) =>
  hosts.map((host, id) => ({
    id,
    tier: id,
    announce: `https://${host}/announce`,
  }));

const singleFile = (name, size) => ({ files: [{ name, length: size }] });

// A big open-data style torrent with nested folders for the Files tab
const archiveFiles = () => {
  const files = [];
  const missions = [
    'Apollo 11',
    'Apollo 12',
    'Apollo 13',
    'Apollo 14',
    'Apollo 15',
    'Apollo 16',
    'Apollo 17',
  ];
  missions.forEach((mission, m) => {
    ['Audio', 'Photos', 'Transcripts', 'Video'].forEach((kind, k) => {
      const count =
        kind === 'Photos'
          ? 40
          : kind === 'Audio'
            ? 12
            : kind === 'Video'
              ? 6
              : 4;
      for (let i = 1; i <= count; i += 1) {
        const ext = {
          Audio: 'flac',
          Photos: 'tif',
          Transcripts: 'pdf',
          Video: 'mkv',
        }[kind];
        const size = {
          Audio: 180 * MB,
          Photos: 42 * MB,
          Transcripts: 3 * MB,
          Video: 2.4 * GB,
        }[kind];
        files.push({
          name: `NASA Apollo Archive/${mission}/${kind}/${mission.replace(' ', '')}_${kind}_${String(i).padStart(3, '0')}.${ext}`,
          length: Math.round(size * (0.7 + ((i * 37 + m * 11 + k) % 60) / 100)),
        });
      }
    });
  });
  files.push({ name: 'NASA Apollo Archive/README.txt', length: 4096 });
  return { files };
};

// ~10,000 files in nested folders, to check large torrents stay fast
const largeDatasetFiles = () => {
  const files = [];
  for (let region = 1; region <= 20; region += 1) {
    for (let station = 1; station <= 25; station += 1) {
      for (let day = 1; day <= 20; day += 1) {
        files.push({
          name: `Weather Station Archive/Region ${region}/Station ${station}/day-${String(day).padStart(2, '0')}.csv`,
          length: 2 * MB + ((region * 31 + station * 7 + day) % 50) * 10000,
        });
      }
    }
  }
  return { files };
};

const createTorrents = () =>
  [
    {
      name: 'NASA Apollo Archive',
      status: DOWNLOADING,
      percentDone: 0.62,
      rateDownload: 18.4 * MB,
      rateUpload: 1.2 * MB,
      eta: 3720,
      dir: '/downloads/Archive',
      added: 2,
      ratio: 0.18,
      peers: 41,
      labels: ['archive', 'space'],
      hosts: ['academictorrents.com', 'tracker.opentrackr.org'],
      content: archiveFiles,
      wanted: (i) => !/Apollo 17\/Video/.test(i.name),
    },
    {
      name: 'ubuntu-26.04-desktop-amd64.iso',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 2.6 * MB,
      eta: -1,
      dir: '/downloads/Linux',
      added: 9,
      ratio: 4.82,
      peers: 23,
      labels: ['linux'],
      hosts: ['torrent.ubuntu.com'],
      content: () => singleFile('ubuntu-26.04-desktop-amd64.iso', 6.1 * GB),
    },
    {
      name: 'debian-13.2.0-amd64-DVD-1.iso',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 640 * 1000,
      eta: -1,
      dir: '/downloads/Linux',
      added: 21,
      ratio: 2.31,
      peers: 7,
      labels: ['linux'],
      hosts: ['bttracker.debian.org'],
      content: () => singleFile('debian-13.2.0-amd64-DVD-1.iso', 3.9 * GB),
    },
    {
      name: 'archlinux-2026.10.01-x86_64.iso',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 0,
      eta: -1,
      dir: '/downloads/Linux',
      added: 29,
      ratio: 1.07,
      peers: 2,
      labels: ['linux'],
      hosts: ['tracker.archlinux.org'],
      content: () => singleFile('archlinux-2026.10.01-x86_64.iso', 1.4 * GB),
    },
    {
      name: 'Big Buck Bunny (2008) 4K 60fps',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 310 * 1000,
      eta: -1,
      dir: '/downloads/Movies',
      added: 44,
      ratio: 6.4,
      peers: 4,
      labels: ['open-movie'],
      hosts: ['tracker.opentrackr.org'],
      content: () => ({
        files: [
          {
            name: 'Big Buck Bunny (2008) 4K 60fps/bbb_sunflower_2160p_60fps.mp4',
            length: 4.6 * GB,
          },
          {
            name: 'Big Buck Bunny (2008) 4K 60fps/bbb_poster.png',
            length: 2 * MB,
          },
        ],
      }),
    },
    {
      name: 'Sintel (2010) 1080p',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 0,
      eta: -1,
      dir: '/downloads/Movies',
      added: 60,
      ratio: 3.12,
      peers: 0,
      labels: ['open-movie'],
      hosts: ['tracker.opentrackr.org'],
      content: () =>
        singleFile('Sintel (2010) 1080p/sintel-1080p.mkv', 1.7 * GB),
    },
    {
      name: 'Tears of Steel (2012) 4K',
      status: DOWNLOADING,
      percentDone: 0.34,
      rateDownload: 6.8 * MB,
      rateUpload: 220 * 1000,
      eta: 1450,
      dir: '/downloads/Movies',
      added: 0.3,
      ratio: 0.04,
      peers: 18,
      labels: ['open-movie'],
      hosts: ['tracker.opentrackr.org'],
      content: () =>
        singleFile('Tears of Steel (2012) 4K/tears_of_steel_4k.mov', 13.6 * GB),
    },
    {
      name: 'Spring (2019) Blender Open Movie',
      status: STOPPED,
      percentDone: 0.81,
      eta: -1,
      dir: '/downloads/Movies',
      added: 12,
      ratio: 0.22,
      peers: 0,
      labels: ['open-movie'],
      hosts: ['tracker.opentrackr.org'],
      content: () => singleFile('Spring (2019)/spring_2160p.mkv', 3.3 * GB),
    },
    {
      name: 'Wikipedia EN 2026-10 (no images)',
      status: DOWNLOADING,
      percentDone: 0.07,
      rateDownload: 3.1 * MB,
      rateUpload: 90 * 1000,
      eta: 26800,
      dir: '/downloads/Archive',
      added: 0.1,
      ratio: 0.01,
      peers: 9,
      labels: ['archive'],
      hosts: ['academictorrents.com'],
      content: () =>
        singleFile('enwiki-20261001-pages-articles.xml.bz2', 24.8 * GB),
    },
    {
      name: 'LibreOffice 26.8 Linux x86-64',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 120 * 1000,
      eta: -1,
      dir: '/downloads/Software',
      added: 5,
      ratio: 1.66,
      peers: 3,
      labels: ['software'],
      hosts: ['tracker.opentrackr.org'],
      content: () =>
        singleFile('LibreOffice_26.8_Linux_x86-64_deb.tar.gz', 260 * MB),
    },
    {
      name: 'Prelinger Archives - Duck and Cover (1951)',
      status: SEEDING,
      percentDone: 1,
      rateUpload: 0,
      eta: -1,
      dir: '/downloads/Archive',
      added: 90,
      ratio: 9.03,
      peers: 1,
      labels: ['archive'],
      hosts: ['academictorrents.com'],
      content: () => singleFile('DuckandC1951.mpeg', 640 * MB),
    },
    {
      name: 'Fedora-Workstation-Live-43.iso',
      status: CHECKING,
      percentDone: 1,
      recheck: 0.46,
      eta: -1,
      dir: '/downloads/Linux',
      added: 3,
      ratio: 0.9,
      peers: 0,
      labels: ['linux'],
      hosts: ['torrent.fedoraproject.org'],
      content: () =>
        singleFile('Fedora-Workstation-Live-x86_64-43.iso', 2.3 * GB),
    },
    {
      name: 'Weather Station Archive',
      status: STOPPED,
      percentDone: 0.25,
      eta: -1,
      dir: '/downloads/Archive',
      added: 7,
      ratio: 0,
      peers: 0,
      labels: ['dataset'],
      hosts: ['academictorrents.com'],
      content: largeDatasetFiles,
    },
    {
      name: 'Common Voice Corpus 22 (en)',
      status: STOPPED,
      percentDone: 1,
      eta: -1,
      dir: '/downloads/Archive',
      added: 140,
      ratio: 0.61,
      peers: 0,
      labels: ['dataset'],
      hosts: ['academictorrents.com'],
      content: () => singleFile('cv-corpus-22.0-en.tar.gz', 86 * GB),
    },
  ].map((t, index) => {
    const id = index + 1;
    const { files } = t.content();
    const wanted = files.map((f) => (t.wanted ? t.wanted(f) : true));
    const fileStats = files.map((f, i) => {
      // Earlier files finish first so folders show a mix of progress
      const done =
        t.percentDone === 1
          ? 1
          : Math.max(0, Math.min(1, t.percentDone * 1.6 - i / files.length));
      return {
        bytesCompleted: wanted[i] ? Math.round(f.length * done) : 0,
        wanted: wanted[i],
        priority: i % 17 === 0 ? 1 : 0,
      };
    });
    const size = files.reduce((s, f, i) => s + (wanted[i] ? f.length : 0), 0);
    const hash = (id * 2654435761)
      .toString(16)
      .padStart(8, '0')
      .repeat(5)
      .slice(0, 40);
    return {
      id,
      'name': t.name,
      'status': t.status,
      'percentDone': t.percentDone,
      'rateDownload': Math.round(t.rateDownload || 0),
      'rateUpload': Math.round(t.rateUpload || 0),
      'eta': t.eta,
      'uploadRatio': t.ratio,
      'sizeWhenDone': size,
      'totalSize': files.reduce((s, f) => s + f.length, 0),
      'downloadedEver': Math.round(size * t.percentDone),
      'uploadedEver': Math.round(size * t.ratio),
      'addedDate': Math.round(NOW - t.added * DAY),
      'doneDate':
        t.percentDone === 1 ? Math.round(NOW - t.added * DAY + 3 * 3600) : 0,
      'dateCreated': Math.round(NOW - (t.added + 30) * DAY),
      'activityDate': NOW - 60,
      'downloadDir': t.dir,
      'hashString': hash,
      'magnetLink': `magnet:?xt=urn:btih:${hash}`,
      'comment': 'Published for public distribution',
      'labels': t.labels,
      'trackers': trackers(t.hosts),
      'trackerList': t.hosts.map((h) => `https://${h}/announce`).join('\n\n'),
      'trackerStats': t.hosts.map(() => ({
        seederCount: 40 + id * 3,
        leecherCount: 5 + id,
      })),
      'peersConnected': t.peers,
      'peersSendingToUs':
        t.status === DOWNLOADING ? Math.ceil(t.peers * 0.6) : 0,
      'peersGettingFromUs': t.rateUpload ? Math.ceil(t.peers * 0.4) : 0,
      'error': 0,
      'errorString': '',
      'metadataPercentComplete': 1,
      'recheckProgress': t.recheck || 0,
      'queuePosition': index,
      'bandwidthPriority': index === 0 ? 1 : 0,
      'isPrivate': false,
      'downloadLimit': 100,
      'downloadLimited': false,
      'uploadLimit': 100,
      'uploadLimited': false,
      'honorsSessionLimits': true,
      'peer-limit': 50,
      'seedIdleLimit': 30,
      'seedIdleMode': 0,
      'seedRatioLimit': 2,
      'seedRatioMode': 0,
      // Like Transmission 4.1, sequentialDownload is not returned
      files,
      fileStats,
      'peers': Array.from({ length: Math.min(t.peers, 12) }, (_, p) => ({
        address: `${['203.0.113', '198.51.100', '192.0.2'][p % 3]}.${10 + p * 7}`,
        clientName: [
          'Transmission 4.1.0',
          'qBittorrent 5.1.2',
          'Deluge 2.2.0',
          'libtorrent 2.0.11',
        ][p % 4],
        progress: ((p * 23) % 100) / 100,
        rateToClient:
          t.status === DOWNLOADING ? Math.round((1 + (p % 5)) * 420 * 1000) : 0,
        rateToPeer: Math.round((p % 3) * 90 * 1000),
        isEncrypted: p % 2 === 0,
      })),
    };
  });

let TORRENTS = createTorrents();

const createSession = () => ({
  'rpc-version': 18,
  'rpc-version-semver': '6.0.0',
  'version': '4.1.0',
  'units': {
    'speed-units': ['kB/s', 'MB/s', 'GB/s', 'TB/s'],
    'speed-bytes': 1000,
    'size-units': ['kB', 'MB', 'GB', 'TB'],
    'size-bytes': 1000,
    'memory-units': ['KiB', 'MiB', 'GiB', 'TiB'],
    'memory-bytes': 1024,
  },
  'download-dir': '/downloads',
  'alt-speed-enabled': false,
  'alt-speed-down': 500,
  'alt-speed-up': 100,
  'speed-limit-down-enabled': false,
  'speed-limit-down': 10000,
  'speed-limit-up-enabled': true,
  'speed-limit-up': 5000,
});

let SESSION = createSession();
// Like Transmission, calls without the current session token get a 409 that
// carries the new one. POST /__rotate-token simulates a daemon restart.
let tokenCount = 0;
const sessionToken = () => `mock-${tokenCount}`;

// Rates wobble a little so the speed graph has something to draw
const jitter = (torrent) => {
  const wobble = () => 0.75 + Math.random() * 0.5;
  return {
    ...torrent,
    rateDownload: Math.round(torrent.rateDownload * wobble()),
    rateUpload: Math.round(torrent.rateUpload * wobble()),
  };
};

const pick = (torrent, fields) =>
  fields
    ? Object.fromEntries(
        fields.filter((f) => f in torrent).map((f) => [f, torrent[f]])
      )
    : torrent;

const handleRpc = ({ method, arguments: args = {} }) => {
  switch (method) {
    case 'session-get':
      return SESSION;
    case 'session-set':
      Object.assign(SESSION, args);
      return {};
    case 'session-stats':
      return {
        'downloadSpeed': 0,
        'uploadSpeed': 0,
        'cumulative-stats': { downloadedBytes: 4.2e12, uploadedBytes: 9.8e12 },
        'current-stats': { downloadedBytes: 61e9, uploadedBytes: 140e9 },
      };
    case 'free-space':
      return { 'path': args.path, 'size-bytes': 1.36e12, 'total_size': 4e12 };
    case 'torrent-get': {
      let list = TORRENTS.map(jitter);
      if (args.ids === 'recently-active') {
        return { torrents: list.map((t) => pick(t, args.fields)), removed: [] };
      }
      if (args.ids !== undefined) {
        const ids = [].concat(args.ids);
        list = list.filter(
          (t) => ids.includes(t.id) || ids.includes(t.hashString)
        );
      }
      return { torrents: list.map((t) => pick(t, args.fields)) };
    }
    case 'torrent-set': {
      // Persist file and torrent priority changes so the UI can be checked
      const ids = [].concat(args.ids);
      TORRENTS.filter((t) => ids.includes(t.id)).forEach((t) => {
        const setFiles = (key, change) =>
          (args[key] || []).forEach((i) =>
            Object.assign(t.fileStats[i], change)
          );
        setFiles('priority-high', { priority: 1 });
        setFiles('priority-normal', { priority: 0 });
        setFiles('priority-low', { priority: -1 });
        setFiles('files-wanted', { wanted: true });
        setFiles('files-unwanted', { wanted: false });
        if ('bandwidthPriority' in args)
          t.bandwidthPriority = args.bandwidthPriority;
      });
      return {};
    }
    default:
      return {};
  }
};

const TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

http
  .createServer((req, res) => {
    if (req.url === '/__reset') {
      TORRENTS = createTorrents();
      SESSION = createSession();
      tokenCount += 1;
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url === '/__rotate-token') {
      tokenCount += 1;
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url.startsWith('/transmission/rpc')) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (req.headers['x-transmission-session-id'] !== sessionToken()) {
          res.writeHead(409, { 'x-transmission-session-id': sessionToken() });
          res.end('<h1>409: Conflict</h1>');
          return;
        }
        const payload = body ? JSON.parse(body) : {};
        res.writeHead(200, {
          'content-type': 'application/json',
          'x-transmission-session-id': sessionToken(),
        });
        res.end(
          JSON.stringify({ result: 'success', arguments: handleRpc(payload) })
        );
      });
      return;
    }
    let p = req.url.split('?')[0].replace(/^\/transmission\/web/, '');
    if (p === '/' || p === '') p = '/index.html';
    const file = path.join(ROOT, path.normalize(p));
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`mock on ${PORT}`));
