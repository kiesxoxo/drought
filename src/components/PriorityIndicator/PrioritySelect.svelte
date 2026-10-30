<script>
  import ChevronsUpIcon from '@lucide/svelte/icons/chevrons-up';
  import EqualIcon from '@lucide/svelte/icons/equal';
  import ChevronsDownIcon from '@lucide/svelte/icons/chevrons-down';
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { cn } from '$lib/utils.js';

  // value: 1 (high), 0 (normal), -1 (low) or null when a folder mixes them
  let {
    value,
    onchange,
    label = 'Priority',
    disabled = false,
    class: className,
  } = $props();

  const OPTIONS = [
    {
      value: 1,
      label: 'High',
      hint: 'Download before everything else',
      icon: ChevronsUpIcon,
      tone: 'text-primary',
    },
    {
      value: 0,
      label: 'Normal',
      hint: 'The default',
      icon: EqualIcon,
      tone: 'text-muted-foreground',
    },
    {
      value: -1,
      label: 'Low',
      hint: 'Download when nothing else needs bandwidth',
      icon: ChevronsDownIcon,
      tone: 'text-muted-foreground/70',
    },
  ];
  const MIXED = {
    label: 'Mixed',
    icon: ShuffleIcon,
    tone: 'text-muted-foreground',
  };

  const current = $derived(
    OPTIONS.find((option) => option.value === value) ?? MIXED
  );
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    disabled={disabled}
    class={cn(
      'group/priority inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent',
      current.tone,
      className
    )}
    title="{label}: {current.label}"
    aria-label="{label}: {current.label}"
  >
    <current.icon class="size-3.5 shrink-0" />
    <span class="priority-label">{current.label}</span>
    <ChevronDownIcon
      class="size-3 shrink-0 opacity-0 transition-opacity group-hover/priority:opacity-60 group-data-[state=open]/priority:opacity-60"
    />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-64">
    <DropdownMenu.Label class="text-xs text-muted-foreground">
      {label}
    </DropdownMenu.Label>
    <DropdownMenu.RadioGroup
      value={value === null || value === undefined ? '' : String(value)}
      onValueChange={(newValue) => onchange?.(Number(newValue))}
    >
      {#each OPTIONS as option (option.value)}
        <DropdownMenu.RadioItem
          closeOnSelect
          value={String(option.value)}
          class="items-start"
        >
          <option.icon class="mt-0.5 size-4 shrink-0 {option.tone}" />
          <span class="flex flex-col">
            <span>{option.label}</span>
            <span class="text-xs text-muted-foreground">{option.hint}</span>
          </span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
