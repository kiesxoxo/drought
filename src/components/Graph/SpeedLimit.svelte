<script>
  import { session } from '~helpers/stores';
  import { getSize } from '~helpers/sizeHelper';
  import InfinityIcon from '@lucide/svelte/icons/infinity';
  import {
    SESSION_COLUMN_UNITS,
    SESSION_COLUMN_UNITS_SPEED,
  } from '~helpers/constants/columns';

  let { direction, hidden = false } = $props();

  // direction is fixed for the component's lifetime
  // svelte-ignore state_referenced_locally
  const speedLimit = session.speedLimit(direction);
  const formatted = $derived(
    getSize($speedLimit, {
      isSpeed: true,
      startSize: 'kB',
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SPEED],
    })
  );
  const limit = $derived(formatted.value);
  const limitSize = $derived(formatted.size);
</script>

<div
  class="limit"
  class:upload={direction === 'upload'}
  class:download={direction === 'download'}
  class:hidden={hidden}
>
  {#if limit}
    {limit}
    <span class="speed__size">{limitSize}</span>
  {:else}
    <InfinityIcon class="icon" />
  {/if}
</div>

<style>
  .limit {
    grid-area: limit;
    border-radius: 4px;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    transition: opacity 0.25s;
  }

  .limit.upload {
    color: var(--color-upload);
    background-color: color-mix(in oklch, var(--color-upload) 16%, transparent);
  }

  .limit.download {
    color: var(--color-download);
    background-color: color-mix(
      in oklch,
      var(--color-download) 16%,
      transparent
    );
  }

  .limit > :global(.icon) {
    flex-grow: 1;
    color: currentColor;
    height: 12px;
  }

  .speed__size {
    white-space: nowrap;
  }

  .hidden {
    opacity: 0;
  }
</style>
