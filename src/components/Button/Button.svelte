<script>
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';

  // primary/secondary are filled, tertiary/quaternary are outlined,
  // destructive is for irreversible actions
  let {
    priority = 'primary',
    type = 'button',
    loading = false,
    class: className,
    onclick,
    children,
  } = $props();

  const VARIANTS = {
    primary: 'default',
    secondary: 'default',
    tertiary: 'outline',
    quaternary: 'outline',
    destructive: 'destructive',
  };

  const handleClick = (event) => {
    if (loading) return;
    onclick?.(event);
  };
</script>

<button
  type={type}
  class={cn(
    'button',
    buttonVariants({ variant: VARIANTS[priority] ?? 'default' }),
    className
  )}
  aria-busy={loading}
  onclick={handleClick}
>
  {#if loading}
    <LoaderIcon class="animate-spin" />
  {:else}
    {@render children?.()}
  {/if}
</button>
