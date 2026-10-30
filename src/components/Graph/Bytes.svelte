<script>
  import { sessionStats, session } from '~helpers/stores';
  import { getSize } from '~helpers/sizeHelper';
  import {
    SESSION_COLUMN_UNITS,
    SESSION_COLUMN_UNITS_SIZE,
    SESSION_STATS_CUMULATIVE_STATS,
    SESSION_STATS_TOTAL_UPLOAD,
    SESSION_STATS_TOTAL_DOWNLOAD,
  } from '~helpers/constants/columns';

  let { direction, hidden = false } = $props();

  // direction is fixed for the component's lifetime, so checking once is enough
  // svelte-ignore state_referenced_locally
  if (!['upload', 'download'].includes(direction)) {
    throw new Error(
      `[Graph/Bytes] unrecognized direction. ${direction} not one of ['upload', 'download']`
    );
  }

  const valueColumn = $derived(
    direction === 'upload'
      ? SESSION_STATS_TOTAL_UPLOAD
      : SESSION_STATS_TOTAL_DOWNLOAD
  );

  const total = $derived(
    getSize($sessionStats[SESSION_STATS_CUMULATIVE_STATS]?.[valueColumn], {
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SIZE],
    })
  );
</script>

<div
  class="bytes"
  class:upload={direction === 'upload'}
  class:download={direction === 'download'}
  class:hidden={hidden}
>
  {total.value}
  <span class="bytes__size">{total.size}</span>
</div>

<style>
  .bytes {
    grid-area: bytes;
    font-size: 12px;
    transition: opacity 0.25s;
    white-space: nowrap;
  }

  .bytes.upload {
    color: var(--color-upload);
  }

  .bytes.download {
    color: var(--color-download);
  }

  .bytes__size {
    font-size: 10px;
  }

  .hidden {
    opacity: 0;
  }
</style>
