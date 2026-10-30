<script>
  import { getSize } from '~helpers/sizeHelper';

  let {
    value,
    torrentStatusClass = null,
    isSpeed = false,
    isUpload = false,
    perSize = 1024,
  } = $props();

  const formatted = $derived(getSize(value, { isSpeed, perSize }));
</script>

{#if isSpeed && !formatted.value}
  <span class="idle" title="Idle">—</span>
{:else}
  <span
    class:speed={isSpeed}
    class:active={formatted.value > 0}
    class:upload={isUpload}
    class={torrentStatusClass}
  >
    {formatted.value}
    <em>{formatted.size}</em>
  </span>
{/if}

<style>
  .idle {
    color: var(--muted-foreground);
    opacity: 0.6;
  }

  em {
    font-size: 10px;
    font-style: normal;
    margin-bottom: 0.1em;
    opacity: 0.8;
  }

  .speed.active {
    font-weight: 500;
    color: var(--color-download);
  }

  .speed.active.upload {
    color: var(--color-upload);
  }

  .selected.speed.active {
    color: var(--color-size-text-selected);
  }
</style>
