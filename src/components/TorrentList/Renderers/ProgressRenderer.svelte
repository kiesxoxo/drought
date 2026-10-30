<script>
  import { STATUSES } from '~helpers/constants/statuses';
  import { getTorrentStatus } from '~helpers/torrentStatusHelper';
  import ProgressBar from '../../ProgressBar/ProgressBar.svelte';

  export let torrent;
  export let value;
  export let torrentStatus;
  export let torrentStatusClass;
  export let metadataProgress;
  export let checkingProgress;
  export const column = null;

  $: status = getTorrentStatus(torrent);
  $: isChecking = !STATUSES.includes(torrentStatus) || status.spin;
  $: progress =
    metadataProgress < 1
      ? metadataProgress * 100
      : checkingProgress > 0 && checkingProgress < 1
        ? checkingProgress * 100
        : value * 100;
  // Show 99.9% rather than rounding an unfinished torrent up to 100%
  $: percent = progress >= 100 ? '100' : String(Math.floor(progress * 10) / 10);
</script>

<div
  class="progress-renderer {torrentStatusClass}"
  class:busy={isChecking}
  title="{status.label} · {percent}%"
  style="--status-tone: {status.tone}"
>
  <svelte:component
    this={status.icon}
    class="status-icon {status.spin ? 'animate-spin' : ''}"
    strokeWidth={2.5}
  />
  <ProgressBar progress={progress} />
  <span class="percent">{percent}%</span>
</div>

<style>
  .progress-renderer {
    --progess-color: var(--color-progress-bar-download);
    --background-color: var(--color-progress-bar-download-background);

    align-items: center;
    display: flex;
    gap: 8px;
    width: 100%;
    z-index: 1;
  }

  .progress-renderer :global(.status-icon) {
    flex: 0 0 auto;
    width: 14px;
    height: 14px;
    color: var(--status-tone);
  }

  .percent {
    flex: 0 0 42px;
    text-align: right;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--foreground);
  }

  .completed .percent,
  .stopped .percent {
    color: var(--muted-foreground);
  }

  .completed {
    --progess-color: var(--color-progress-bar-upload);
    --background-color: var(--color-progress-bar-upload-background);
  }

  .stopped {
    --progess-color: var(--color-progress-bar-stopped);
    --background-color: var(--color-progress-bar-stopped-background);
  }

  .error {
    --progess-color: var(--color-progress-bar-error);
    --background-color: var(--color-progress-bar-error-background);
  }

  .checking,
  .metadata,
  .busy {
    --progess-color: var(--color-progress-bar-metadata);
    --background-color: var(--color-progress-bar-metadata-background);
  }
</style>
