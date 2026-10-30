<script>
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import PauseIcon from '@lucide/svelte/icons/pause';
  import PlayIcon from '@lucide/svelte/icons/play';
  import ScaleIcon from '@lucide/svelte/icons/scale';
  import { torrentDetails, session, torrents } from '~helpers/stores';
  import {
    STATUSES,
    STATUS_DOWNLOADING,
    STATUS_STOPPED,
  } from '~helpers/constants/statuses';
  import {
    TRANSMISSION_COLUMN,
    SESSION_COLUMN_UNITS,
    SESSION_COLUMN_UNITS_SPEED,
    SESSION_COLUMN_UNITS_SIZE,
  } from '~helpers/constants/columns';
  import { getSize } from '~helpers/sizeHelper';
  import ArrivalRenderer from '~components/TorrentList/Renderers/ArrivalRenderer.svelte';
  import PrioritySelect from '~components/PriorityIndicator';
  import ProgressRenderer from '~components/TorrentList/Renderers/ProgressRenderer';
  import { generateTorrentStatusClass } from '~helpers/classHelper';

  let { torrentId } = $props();

  const downloadSpeed = $derived(
    getSize($torrentDetails[TRANSMISSION_COLUMN.DOWNLOAD_RATE] || 0, {
      isSpeed: true,
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SPEED],
    })
  );
  const uploadSpeed = $derived(
    getSize($torrentDetails[TRANSMISSION_COLUMN.UPLOAD_RATE] || 0, {
      isSpeed: true,
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SPEED],
    })
  );
  const downloadSize = $derived(
    getSize($torrentDetails[TRANSMISSION_COLUMN.DOWNLOADED] || 0, {
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SIZE],
    })
  );
  const uploadSize = $derived(
    getSize($torrentDetails[TRANSMISSION_COLUMN.UPLOADED] || 0, {
      perSize: $session[SESSION_COLUMN_UNITS]?.[SESSION_COLUMN_UNITS_SIZE],
    })
  );

  const updatePriority = (newPrio) => {
    torrents.setTorrents([torrentId], {
      [TRANSMISSION_COLUMN.PRIORITY]: newPrio,
    });
    torrentDetails.update((torrent) => ({
      ...torrent,
      [TRANSMISSION_COLUMN.PRIORITY]: newPrio,
    }));
  };

  const startTorrent = () => {
    if ($torrentDetails[TRANSMISSION_COLUMN.STATUS] > 0) {
      return;
    }

    torrents.start([torrentId]);
    torrentDetails.update((torrent) => ({
      ...torrent,
      [TRANSMISSION_COLUMN.STATUS]: STATUSES.indexOf(STATUS_DOWNLOADING),
    }));
  };

  const stopTorrent = () => {
    if ($torrentDetails[TRANSMISSION_COLUMN.STATUS] === 0) {
      return;
    }

    torrents.stop([torrentId]);
    torrentDetails.update((torrent) => ({
      ...torrent,
      [TRANSMISSION_COLUMN.STATUS]: STATUSES.indexOf(STATUS_STOPPED),
    }));
  };

  const makeEditable = (e) => {
    e.target.setAttribute('contenteditable', true);
    e.target.focus();
    document.execCommand('selectAll', false, null);
  };

  const rename = (e) => {
    const newName = e.target.innerText.trim();

    if (!newName) {
      e.target.innerText = $torrentDetails[TRANSMISSION_COLUMN.NAME];
      return;
    }

    torrents.rename(
      [torrentId],
      $torrentDetails[TRANSMISSION_COLUMN.NAME],
      newName
    );
    torrentDetails.update((torrent) => ({
      ...torrent,
      [TRANSMISSION_COLUMN.NAME]: newName,
      [TRANSMISSION_COLUMN.FILES]: torrent[TRANSMISSION_COLUMN.FILES]?.map(
        (file) => {
          const parts = file.name.split('/');
          parts[0] = newName;
          return { ...file, name: parts.join('/') };
        }
      ),
    }));
    e.target.removeAttribute('contenteditable');
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html');
    const resultElement = document.createElement('div');
    resultElement.innerHTML = text;
    e.target.innerText = resultElement.innerText;
  };

  const handleEnter = (e) => {
    const key = e.keyCode;
    if (key === 13) e.target.blur();
  };
</script>

<div class="header">
  <h1
    ondblclick={makeEditable}
    onblur={rename}
    onpaste={handlePaste}
    onkeydown={handleEnter}
  >
    {$torrentDetails[TRANSMISSION_COLUMN.NAME]}
  </h1>
  <div class="subheading">
    <ul>
      <li
        class:active={!!downloadSpeed.value}
        title="Download speed"
        class="downloading"
      >
        <ArrowDownIcon class="icon" />
        <span>
          {downloadSpeed.value}<em>{downloadSpeed.size}</em>
          —
          {downloadSize.value}<em>{downloadSize.size}</em>
        </span>
      </li>
      <li class:active={!!uploadSpeed.value} title="Upload speed">
        <ArrowUpIcon class="icon" />
        <span>
          {uploadSpeed.value}<em>{uploadSpeed.size}</em>
          —
          {uploadSize.value}<em>{uploadSize.size}</em>
        </span>
      </li>
      <li title="Ratio">
        <ScaleIcon class="icon" />
        {($torrentDetails[TRANSMISSION_COLUMN.RATIO] || 0).toFixed(2)}
      </li>
      <li title="ETA">
        <ClockIcon class="icon" />
        <ArrivalRenderer value={$torrentDetails[TRANSMISSION_COLUMN.ETA]} />
      </li>
    </ul>

    <ul class="right">
      <li class="button">
        <PrioritySelect
          value={$torrentDetails[TRANSMISSION_COLUMN.PRIORITY]}
          label="Torrent priority"
          onchange={updatePriority}
        />
      </li>
      <li
        class:active={$torrentDetails[TRANSMISSION_COLUMN.STATUS] > 0}
        onclick={startTorrent}
        class="button"
      >
        <PlayIcon class="icon" />
        Start
      </li>
      <li
        class:active={$torrentDetails[TRANSMISSION_COLUMN.STATUS] === 0}
        onclick={stopTorrent}
        class="button"
      >
        <PauseIcon class="icon" />
        Stop
      </li>
    </ul>
  </div>
  <ProgressRenderer
    torrent={$torrentDetails}
    value={$torrentDetails[TRANSMISSION_COLUMN.DOWNLOAD_PROGRESS]}
    torrentStatus={STATUSES[$torrentDetails[TRANSMISSION_COLUMN.STATUS]]}
    torrentStatusClass={generateTorrentStatusClass($torrentDetails)}
    metadataProgress={$torrentDetails[TRANSMISSION_COLUMN.METADATA_PROGRESS]}
    checkingProgress={$torrentDetails[TRANSMISSION_COLUMN.RECHECK_PROGRESS]}
  />
</div>

<style>
  .header {
    color: var(--color-modal-header);
    box-shadow: inset 0 -1px 0 var(--color-modal-torrent-details-shadow);
    flex: 0 0 auto;
    overflow: hidden;
    padding: 20px 25px;
    gap: 4px;
    display: flex;
    flex-direction: column;
  }

  h1 {
    font-size: 20px;
    color: var(--color-modal-header);
    font-weight: 500;
    line-height: 1.25;
    word-break: break-word;
    cursor: pointer;
  }

  .subheading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: 4px;
    justify-content: space-between;
    color: var(--color-modal-text);
  }

  .subheading :global(.icon) {
    color: var(--color-modal-torrent-details-header-icon);
  }

  ul {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  li {
    display: flex;
    align-items: center;
    font-size: 13.6px;
  }

  li.active,
  li.active > :global(.icon) {
    color: var(--color-upload);
  }

  li.active.downloading,
  li.active.downloading > :global(.icon) {
    color: var(--color-download);
  }

  li > :global(.icon) {
    width: 12px;
    margin-right: 3px;
  }

  em {
    font-size: 11px;
    font-style: normal;
    opacity: 0.8;
  }

  .right {
    justify-content: flex-end;
  }

  li.button {
    cursor: pointer;
  }

  @media (max-width: 700px) {
    .header {
      box-shadow: none;
      padding: 20px 25px 10px;
    }
  }
</style>
