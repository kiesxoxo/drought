// Every torrent repeats the same few announce URLs and they are parsed on each
// poll, filter and count, so remember the results
const cache = new Map();

export function trackerStripper(trackerUrl) {
  let stripped = cache.get(trackerUrl);
  if (stripped === undefined) {
    const parts = trackerUrl
      .split('://')[1]
      .split(':')[0]
      .split('/')[0]
      .split('.');
    stripped = [parts[parts.length - 2], parts[parts.length - 1]].join('.');
    if (cache.size > 5000) cache.clear();
    cache.set(trackerUrl, stripped);
  }
  return stripped;
}
