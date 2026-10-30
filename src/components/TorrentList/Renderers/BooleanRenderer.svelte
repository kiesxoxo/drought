<script>
  import CheckIcon from '@lucide/svelte/icons/check';

  let { value = false } = $props();
</script>

<div>
  {#if value}
    <CheckIcon class="icon" />
  {/if}
</div>

<style>
  div > :global(.icon) {
    color: currentColor;
    height: 12px;
    margin-right: 5px;
    width: 12px;
  }
</style>
