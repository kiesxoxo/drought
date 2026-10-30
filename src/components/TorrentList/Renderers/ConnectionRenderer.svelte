<script>
  let { value = 0, connected = 0 } = $props();
</script>

{value}
<em>of</em>
{connected}

<style>
  em {
    font-size: 10px;
    font-style: normal;
  }
</style>
