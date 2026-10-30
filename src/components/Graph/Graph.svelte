<script>
  import { scaleLinear } from 'd3-scale';
  import { line, area, curveMonotoneX } from 'd3-shape';
  import { max } from 'd3-array';
  import { rateData, session, torrents } from '~helpers/stores';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import Bytes from '~components/Graph/Bytes.svelte';
  import SpeedLimit from '~components/Graph/SpeedLimit.svelte';
  import { relativeTime } from '~helpers/timeHelper';
  import { getSize } from '~helpers/sizeHelper';
  import {
    SESSION_COLUMN_UNITS,
    SESSION_COLUMN_UNITS_SIZE,
  } from '~helpers/constants/columns';

  const margin = { bottom: 10, top: 10 };
  const totalRateStore = torrents.totalRate;

  let mouseX = $state(0);
  let hovering = $state(false);

  const xScale = $derived(
    scaleLinear()
      .domain([0, $rateData.download.length - 1])
      .range([0, 240])
  );

  const yScale = $derived(
    scaleLinear()
      .domain([
        0,
        max($rateData.download, (dataPoint, index) =>
          Math.max(dataPoint, $rateData.upload[index])
        ) || 1,
      ])
      .range([150 - margin.top, margin.bottom])
  );

  const linePath = $derived(
    line()
      .x((dataPoint, index) => xScale(index))
      .y(yScale)
      .curve(curveMonotoneX)
  );

  const areaPath = $derived(
    area()
      .x((dataPoint, index) => xScale(index))
      .y0(150)
      .y1(yScale)
      .curve(curveMonotoneX)
  );

  // Speed and dot position at the hovered point, interpolated between samples
  const inspect = (data) => {
    if (!hovering) {
      return { circleTransform: undefined, speed: null, timestamp: null };
    }
    const hoverPoint = xScale.invert(mouseX);
    const upperSpeed = data[Math.ceil(hoverPoint)];
    const lowerSpeed = data[Math.floor(hoverPoint)];
    const speed = lowerSpeed + (upperSpeed - lowerSpeed) * (hoverPoint % 1);

    return {
      circleTransform: `translate(${xScale(hoverPoint)},${yScale(speed)})`,
      speed,
      timestamp: $rateData.timestamps[Math.round(hoverPoint)],
    };
  };

  const uploadPoint = $derived(inspect($rateData.upload));
  const downloadPoint = $derived(inspect($rateData.download));

  const formatSpeed = (speed) =>
    getSize(speed, {
      isSpeed: true,
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SIZE],
    });

  const displayUpload = $derived(
    formatSpeed(uploadPoint.speed ?? $totalRateStore.upload)
  );
  const displayDownload = $derived(
    formatSpeed(downloadPoint.speed ?? $totalRateStore.download)
  );

  const handleMouseMove = (event) => {
    hovering = true;
    mouseX = event.clientX - event.currentTarget.getBoundingClientRect().left;
  };

  const handleMouseLeave = () => {
    hovering = false;
  };
</script>

<div class="rates">
  <div class="rate rate--download">
    <ArrowDownIcon class="icon" />
    <div class="data">
      <div class="speed speed--download">
        {displayDownload.value}
        <span class="speed__size">{displayDownload.size}</span>
      </div>
      <Bytes direction="download" hidden={hovering} />
      <SpeedLimit direction="download" hidden={hovering} />
    </div>
  </div>
  <div class="rate rate--upload">
    <ArrowUpIcon class="icon" />
    <div class="data">
      <div class="speed speed--upload">
        {displayUpload.value}
        <span class="speed__size">{displayUpload.size}</span>
      </div>
      <Bytes direction="upload" hidden={hovering} />
      <SpeedLimit direction="upload" hidden={hovering} />
    </div>
  </div>
  <div class="timestamp" class:hidden={!hovering}>
    {relativeTime(uploadPoint.timestamp)}
  </div>
</div>

<svg
  class="graph"
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
>
  <defs>
    <linearGradient id="gradient--upload" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop class="top upload" offset="0%"></stop>
      <stop class="bottom upload" offset="100%"></stop>
    </linearGradient>
    <linearGradient id="gradient--download" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop class="top download" offset="0%"></stop>
      <stop class="bottom download" offset="100%"></stop>
    </linearGradient>
  </defs>
  <path
    class="area area--download"
    fill="url(#gradient--download)"
    d={areaPath($rateData.download)}
  ></path>
  <path
    class="area area--upload"
    fill="url(#gradient--upload)"
    d={areaPath($rateData.upload)}
  ></path>
  <path class="line line--download" d={linePath($rateData.download)}></path>
  <path class="line line--upload" d={linePath($rateData.upload)}></path>
  <circle
    r="2.5"
    class="circle circle--download"
    class:circle--active={hovering}
    transform={downloadPoint.circleTransform}
  ></circle>
  <circle
    r="2.5"
    class="circle circle--upload"
    class:circle--active={hovering}
    transform={uploadPoint.circleTransform}
  ></circle>
</svg>

<style>
  .rates {
    position: relative;
    display: grid;
    grid-template: 'rate-download rate-upload' auto / 1fr 1fr;
    font-size: 12px;
    padding: 14px 12px 0;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .rate--download {
    grid-area: rate-download;
  }

  .rate--upload {
    grid-area: rate-upload;
  }

  .rate {
    display: flex;
    flex-grow: 1;
    flex-shrink: 0;
  }

  .rate > :global(.icon) {
    display: block;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin: 3px 2px 0 0;
  }

  .rate--download > :global(.icon) {
    color: var(--color-download);
  }

  .rate--upload > :global(.icon) {
    color: var(--color-upload);
  }

  .data {
    display: grid;
    grid-template:
      'speed speed speed' 26px
      'bytes limit -' auto / 1fr fit-content(20px) 1fr;
    column-gap: 5px;
    row-gap: 1px;
  }

  .speed {
    grid-area: speed;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.5px;
  }

  .speed--download {
    color: var(--color-download);
  }

  .speed--upload {
    color: var(--color-upload);
  }

  .speed__size {
    font-size: 16px;
    opacity: 0.5;
  }

  /* Overlaid on the top of the graph so showing it never shifts the layout */
  .timestamp {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 6px;
    z-index: 1;
    pointer-events: none;
    color: var(--color-graph-text);
    font-style: italic;
    text-align: center;
    transition: opacity 0.25s;
  }

  .timestamp.hidden {
    opacity: 0;
  }

  .graph {
    width: 100%;
    border-bottom: 1px solid var(--sidebar-border);
  }

  stop.download {
    stop-color: var(--color-download);
  }

  stop.upload {
    stop-color: var(--color-upload);
  }

  stop.top {
    stop-opacity: 0.28;
  }

  stop.bottom {
    stop-opacity: 0;
  }

  .line {
    stroke-opacity: 0.9;
    stroke-width: 1.5px;
    fill: transparent;
  }

  .line--upload {
    stroke: var(--color-upload);
  }

  .line--download {
    stroke: var(--color-download);
  }

  .circle--download {
    fill: var(--color-download);
  }

  .circle--upload {
    fill: var(--color-upload);
  }

  .circle {
    transition: opacity 0.2s;
    opacity: 0;
  }

  .circle--active {
    opacity: 1;
  }
</style>
