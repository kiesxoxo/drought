<script>
  let { progress = 0 } = $props();
</script>

<div class="fill-wrapper">
  <div class="fill" style="width: {progress}%"></div>
</div>

<style>
  .fill {
    background: var(--progess-color);
    border-radius: 999px;
    display: block;
    height: 100%;
    width: 100%;
    transition: width 300ms ease-out;
  }

  .fill-wrapper {
    background: var(--background-color);
    flex: 1 1 auto;
    position: relative;
    height: var(--progress-height, 6px);
    border-radius: 999px;
    overflow: hidden;
  }
</style>
