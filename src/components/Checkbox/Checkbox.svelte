<script module>
  let num = 0;
</script>

<script>
  import CheckIcon from '@lucide/svelte/icons/check';

  let {
    label = null,
    // No fallbacks: binding undefined to a bindable prop with a default throws,
    // and Transmission omits fields it doesn't support (e.g. sequentialDownload)
    checked = $bindable(),
    group = $bindable(),
    value = null,
    hint = null,
    onchange,
  } = $props();

  num += 1;
  const id = `input-checkbox-${num}`;
</script>

<div class="checkbox flex flex-col gap-1">
  <label
    for={id}
    class="inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground select-none"
  >
    {#if group && value}
      <input
        type="checkbox"
        class="peer sr-only"
        bind:group={group}
        value={value}
        id={id}
        onchange={onchange}
      />
    {:else}
      <input
        type="checkbox"
        class="peer sr-only"
        bind:checked={checked}
        id={id}
        onchange={onchange}
      />
    {/if}
    <span
      class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background text-primary-foreground shadow-xs transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 dark:bg-input/30 dark:peer-checked:bg-primary [&>svg]:invisible peer-checked:[&>svg]:visible"
      aria-hidden="true"
    >
      <CheckIcon class="size-3.5" strokeWidth={3} />
    </span>
    {#if label}<span>{label}</span>{/if}
  </label>
  {#if hint}<div class="pl-6 text-xs text-muted-foreground">{hint}</div>{/if}
</div>
