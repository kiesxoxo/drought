<script module>
  let num = 0;
</script>

<script>
  import PlusIcon from '@lucide/svelte/icons/plus';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { cn } from '$lib/utils.js';

  num += 1;

  let {
    label = null,
    value = $bindable(),
    type = 'text',
    hint = null,
    validationMessage = '',
    // [{ iconName: 'Add' | 'Remove' | 'Search', onClick, label? }]
    addons = [],
    input = $bindable(),
    id = `input-text-${num}`,
    disabled = false,
    // Extra controls shown inside the field, next to the addons
    addon,
    class: extraClass,
    ...inputProps
  } = $props();

  const ADDON_ICONS = { Add: PlusIcon, Remove: MinusIcon, Search: SearchIcon };
  const ADDON_LABELS = { Add: 'Add', Remove: 'Remove', Search: 'Browse' };

  const SUPPORTED_TYPES = ['text', 'number', 'time', 'url'];
  $effect(() => {
    if (!SUPPORTED_TYPES.includes(type)) {
      console.error(`Invalid type received, ${type}`);
    }
  });

  const addonCount = $derived(addons.length + (addon ? 1 : 0));

  const handleInvalid = (e) => {
    if (!validationMessage) return;
    e.target.setCustomValidity(validationMessage);
  };
</script>

<div class="input-container mb-3 flex flex-col gap-1.5">
  {#if label}
    <label class="truncate text-xs font-medium text-muted-foreground" for={id}>
      {label}
    </label>
  {/if}
  <div class="relative">
    <input
      class={cn(
        'input h-8 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 [&:user-invalid]:border-destructive',
        extraClass
      )}
      style:padding-right={addonCount ? `${addonCount * 28 + 6}px` : null}
      id={id}
      {...{ type }}
      bind:this={input}
      oninvalid={handleInvalid}
      oninput={(e) => e.target.setCustomValidity('')}
      bind:value={value}
      disabled={disabled}
      {...inputProps}
    />
    {#if addonCount}
      <div class="absolute inset-y-0 right-1 flex items-center gap-0.5">
        {#each addons as item (item.iconName)}
          {@const AddonIcon = ADDON_ICONS[item.iconName]}
          <button
            type="button"
            class="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            aria-label={item.label ?? ADDON_LABELS[item.iconName]}
            title={item.label ?? ADDON_LABELS[item.iconName]}
            disabled={disabled}
            onclick={item.onClick}
          >
            <AddonIcon class="size-3.5" />
          </button>
        {/each}
        {@render addon?.()}
      </div>
    {/if}
  </div>
  {#if hint}<span class="hint text-xs text-muted-foreground">{hint}</span>{/if}
</div>
