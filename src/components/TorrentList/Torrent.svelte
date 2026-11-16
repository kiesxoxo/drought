<script module>
  import {
    TextRenderer,
    ProgressRenderer,
    DateRenderer,
    SizeRenderer,
    ConnectionRenderer,
    ArrivalRenderer,
    BooleanRenderer,
    LabelRenderer,
  } from '~components/TorrentList/Renderers';
  import { STATUSES } from '~helpers/constants/statuses';
  import {
    UI_COLUMN,
    TRANSMISSION_COLUMN,
    SESSION_COLUMN_UNITS_SIZE,
    SESSION_COLUMN_UNITS_SPEED,
  } from '~helpers/constants/columns';
  import { trackerStripper } from '~helpers/trackerHelper';

  // How each column renders a torrent. Shared by every row, so a row costs
  // no closures of its own; units are the session's size and speed units.
  // TODO: Move to constants/columns
  const RENDERERS = {
    [UI_COLUMN.NAME.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.NAME],
        size: 'big',
      }),
    },
    [UI_COLUMN.PROGRESS_BAR.id]: {
      component: ProgressRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.DOWNLOAD_PROGRESS],
        metadataProgress: torrent[TRANSMISSION_COLUMN.METADATA_PROGRESS],
        checkingProgress: torrent[TRANSMISSION_COLUMN.RECHECK_PROGRESS],
        torrentStatus: STATUSES[torrent[TRANSMISSION_COLUMN.STATUS]],
        torrent,
      }),
    },
    [UI_COLUMN.DOWNLOADED.id]: {
      component: SizeRenderer,
      props: (torrent, units) => ({
        value: torrent[TRANSMISSION_COLUMN.DOWNLOADED],
        perSize: units?.[SESSION_COLUMN_UNITS_SIZE],
      }),
    },
    [UI_COLUMN.DOWNLOAD_SPEED.id]: {
      component: SizeRenderer,
      props: (torrent, units) => ({
        value: torrent[TRANSMISSION_COLUMN.DOWNLOAD_RATE],
        isSpeed: true,
        perSize: units?.[SESSION_COLUMN_UNITS_SPEED],
      }),
    },
    [UI_COLUMN.UPLOADED.id]: {
      component: SizeRenderer,
      props: (torrent, units) => ({
        value: torrent[TRANSMISSION_COLUMN.UPLOADED],
        perSize: units?.[SESSION_COLUMN_UNITS_SIZE],
      }),
    },
    [UI_COLUMN.UPLOAD_SPEED.id]: {
      component: SizeRenderer,
      props: (torrent, units) => ({
        value: torrent[TRANSMISSION_COLUMN.UPLOAD_RATE],
        isSpeed: true,
        isUpload: true,
        perSize: units?.[SESSION_COLUMN_UNITS_SPEED],
      }),
    },
    [UI_COLUMN.ETA.id]: {
      component: ArrivalRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.ETA] }),
    },
    [UI_COLUMN.RATIO.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.RATIO]?.toFixed(2),
      }),
    },
    [UI_COLUMN.FILE_SIZE.id]: {
      component: SizeRenderer,
      props: (torrent, units) => ({
        value: torrent[TRANSMISSION_COLUMN.SIZE],
        perSize: units?.[SESSION_COLUMN_UNITS_SIZE],
      }),
    },
    [UI_COLUMN.ADDED.id]: {
      component: DateRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.ADDED] }),
    },
    [UI_COLUMN.CREATION_DATE.id]: {
      component: DateRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.CREATED] }),
    },
    [UI_COLUMN.SEEDS.id]: {
      component: ConnectionRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.SEEDING_TO],
        connected: torrent[TRANSMISSION_COLUMN.PEERS_CONNECTED],
      }),
    },
    [UI_COLUMN.PEERS.id]: {
      component: ConnectionRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.DOWNLOADING_FROM],
        connected: torrent[TRANSMISSION_COLUMN.PEERS_CONNECTED],
      }),
    },
    [UI_COLUMN.BASE_PATH.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.DOWNLOAD_DIR],
      }),
    },
    [UI_COLUMN.HASH.id]: {
      component: TextRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.HASH] }),
    },
    [UI_COLUMN.COMMENT.id]: {
      component: TextRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.COMMENT] }),
    },
    [UI_COLUMN.LABELS.id]: {
      component: LabelRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.LABELS] }),
    },
    [UI_COLUMN.ERROR.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.ERROR_STRING],
      }),
    },
    [UI_COLUMN.PRIVATE.id]: {
      component: BooleanRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.PRIVATE] }),
    },
    [UI_COLUMN.TRACKERS.id]: {
      component: TextRenderer,
      props: (torrent) => {
        const value = torrent[TRANSMISSION_COLUMN.TRACKERS]
          .map((tracker) => trackerStripper(tracker.announce))
          .sort()
          .join(', ');
        return { value };
      },
    },
    [UI_COLUMN.DONE.id]: {
      component: DateRenderer,
      props: (torrent) => ({ value: torrent[TRANSMISSION_COLUMN.DONE] }),
    },
    [UI_COLUMN.STATUS.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: STATUSES[torrent[TRANSMISSION_COLUMN.STATUS]],
      }),
    },
    [UI_COLUMN.QUEUE_POSITION.id]: {
      component: TextRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.QUEUE_POSITION],
      }),
    },
    [UI_COLUMN.TOTAL_LEECHERS.id]: {
      component: TextRenderer,
      props: (torrent) => {
        const trackerStats = torrent[TRANSMISSION_COLUMN.TRACKER_STATS] || [];
        const leecherCounts = trackerStats.map(
          ({ leecherCount }) => leecherCount
        );
        const filteredLeecherCounts = leecherCounts.filter(
          (count) => count !== -1
        );
        const value = filteredLeecherCounts.length
          ? Math.max(...filteredLeecherCounts)
          : '-';

        return { value };
      },
    },
    [UI_COLUMN.TOTAL_SEEDERS.id]: {
      component: TextRenderer,
      props: (torrent) => {
        const trackerStats = torrent[TRANSMISSION_COLUMN.TRACKER_STATS] || [];
        const seederCounts = trackerStats.map(({ seederCount }) => seederCount);
        const filteredSeederCounts = seederCounts.filter(
          (count) => count !== -1
        );
        const value = filteredSeederCounts.length
          ? Math.max(...filteredSeederCounts)
          : '-';

        return { value };
      },
    },
    [UI_COLUMN.ACTIVITY.id]: {
      component: DateRenderer,
      props: (torrent) => ({
        value: torrent[TRANSMISSION_COLUMN.ACTIVITY_DATE],
      }),
    },
    [UI_COLUMN.PERCENT_COMPLETE.id]: {
      component: TextRenderer,
      props: (torrent) => {
        let number = torrent[TRANSMISSION_COLUMN.DOWNLOAD_PROGRESS];

        if (
          torrent[TRANSMISSION_COLUMN.RECHECK_PROGRESS] > 0 &&
          torrent[TRANSMISSION_COLUMN.RECHECK_PROGRESS] < 1
        ) {
          number = torrent[TRANSMISSION_COLUMN.RECHECK_PROGRESS];
        }

        if (
          torrent[TRANSMISSION_COLUMN.METADATA_PROGRESS] > 0 &&
          torrent[TRANSMISSION_COLUMN.METADATA_PROGRESS] < 1
        ) {
          number = torrent[TRANSMISSION_COLUMN.METADATA_PROGRESS];
        }

        return { value: `${Math.round(number * 10_000) / 100}%` };
      },
    },
  };
</script>

<script>
  import { openTorrentDetails } from '~helpers/torrentDetailHelper';
  import { generateTorrentStatusClass } from '~helpers/classHelper';

  // onselect(torrent, modifierKey) runs on every click on the row; columns
  // are the active column ids and units the session's units, passed in by
  // the list so rows don't each subscribe to those stores
  let {
    torrent = {},
    selected = false,
    columns = [],
    units,
    onselect,
  } = $props();

  const getModifierKey = (event) => {
    if (event.shiftKey) {
      return 'shift';
    }

    if (event.ctrlKey) {
      return 'ctrl';
    }
  };

  let lastClick = 0;
  const handleClick = (event) => {
    onselect?.(torrent, getModifierKey(event));

    // Two clicks in quick succession open the details
    const currentTime = new Date().getTime();
    const clickLength = currentTime - lastClick;
    if (clickLength > 0 && clickLength < 500) {
      openTorrentDetails(torrent.id);
    }
    lastClick = currentTime;
  };

  const statusClass = $derived(generateTorrentStatusClass(torrent, selected));
</script>

<tr class={statusClass} data-torrent-id={torrent.id} onclick={handleClick}>
  {#each columns as id (id)}
    {@const renderer = RENDERERS[id]}
    {#if renderer}
      <td>
        <renderer.component
          torrentStatusClass={statusClass}
          {...renderer.props(torrent, units)}
        />
      </td>
    {/if}
  {/each}
</tr>

<style>
  tr {
    color: var(--color-torrent-text);
    font-size: 13px;
    height: 28px;
    cursor: default;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  tr:hover {
    background-color: var(--accent);
  }

  tr.stopped,
  tr.error {
    color: var(--color-torrent-text-inactive);
  }

  tr.error {
    color: var(--destructive);
  }

  tr.selected {
    background-color: var(--color-torrent-background-selected);
    color: var(--color-torrent-text-selected);
  }

  tr.selected.error {
    background-color: var(--color-torrent-background-selected-error);
  }

  td {
    padding: 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  }
</style>
