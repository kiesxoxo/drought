<script>
  import {
    uiColumns,
    selectedTorrents,
    torrents,
    modals,
    session,
  } from '~helpers/stores';
  import ColumnHeader from '~components/TorrentList/ColumnHeader.svelte';
  import Torrent from '~components/TorrentList/Torrent.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import TorrentContextMenu from './TorrentContextMenu.svelte';
  import { Remove } from '~components/Modal';
  import { openTorrentDetails } from '~helpers/torrentDetailHelper';
  import {
    TRANSMISSION_COLUMN_ID,
    UI_COLUMN,
    SESSION_COLUMN_UNITS,
  } from '~helpers/constants/columns';
  import TorrentDropzone from './TorrentDropzone.svelte';

  const sortedTorrents = torrents.sorted;
  const activeColumns = uiColumns.active;
  const { totalSize, sizes: columnSizes } = uiColumns;

  // The Name column takes whatever room the other columns leave, so the list
  // fills the window without scrolling sideways; its set width is the minimum
  let listWidth = $state(0);
  const nameShown = $derived(
    $activeColumns.some((column) => column.id === UI_COLUMN.NAME.id)
  );
  const nameMinWidth = $derived(
    nameShown ? $columnSizes[UI_COLUMN.NAME.id] : 0
  );
  const nameWidth = $derived(
    nameShown
      ? Math.max(nameMinWidth, listWidth - ($totalSize - nameMinWidth))
      : 0
  );
  const tableWidth = $derived($totalSize - nameMinWidth + nameWidth);

  const selectedIds = $derived(new Set($selectedTorrents));
  // Read here once instead of by every row
  const columnIds = $derived($activeColumns.map((column) => column.id));
  const units = $derived($session[SESSION_COLUMN_UNITS]);

  // Only the rows in view, plus a few either side, are in the page; spacer
  // rows stand in for the rest. Rows have a fixed height, so a list of
  // thousands renders and updates like one of a few dozen.
  const OVERSCAN = 10;
  let wrapper = $state(null);
  let scrollTop = $state(0);
  let viewHeight = $state(0);
  let rowHeight = $state(28);
  const firstRow = $derived(
    Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
  );
  const lastRow = $derived(
    Math.min(
      $sortedTorrents.length,
      Math.ceil((scrollTop + viewHeight) / rowHeight) + OVERSCAN
    )
  );
  const visibleTorrents = $derived($sortedTorrents.slice(firstRow, lastRow));

  // Measured rather than assumed, so the spacers match the real rows
  $effect(() => {
    if (!visibleTorrents.length) return;
    const row = tbody?.querySelector('tr[data-torrent-id]');
    const height = row?.getBoundingClientRect().height;
    if (height) rowHeight = height;
  });

  // Rows outside the window aren't in the page, so scroll by position
  const scrollRowIntoView = (index) => {
    if (!wrapper) return;
    const headerHeight = wrapper.querySelector('thead')?.offsetHeight ?? 0;
    const rowTop = index * rowHeight;
    const rowBottom = headerHeight + rowTop + rowHeight;
    if (rowTop < wrapper.scrollTop) {
      wrapper.scrollTop = rowTop;
    } else if (rowBottom > wrapper.scrollTop + wrapper.clientHeight) {
      wrapper.scrollTop = rowBottom - wrapper.clientHeight;
    }
  };

  const handleTorrentClick = (torrent, modifierKey, deselect = true) => {
    if (modifierKey === 'shift') {
      // Unselect all text to prevent long selection because of shift click
      document.getSelection().removeAllRanges();
    }

    if (deselect && $selectedTorrents.includes(torrent.id)) {
      if (!modifierKey && $selectedTorrents.length === 1) {
        selectedTorrents.clear();
      } else if (!modifierKey) {
        selectedTorrents.set([torrent.id]);
      } else if (modifierKey === 'ctrl') {
        selectedTorrents.remove(torrent.id);
      }
      return;
    }

    if (
      !modifierKey ||
      (modifierKey === 'shift' && !$selectedTorrents.length)
    ) {
      selectedTorrents.set([torrent.id]);
    } else if (modifierKey === 'ctrl') {
      selectedTorrents.add([torrent.id]);
    } else if (modifierKey === 'shift') {
      const selectedIndex = $sortedTorrents.findIndex(
        (t) => t.id === $selectedTorrents.slice(-1)[0]
      );
      const clickedIndex = $sortedTorrents.findIndex(
        (t) => t.id === torrent.id
      );
      const startIndex = Math.min(selectedIndex, clickedIndex);
      const endIndex = Math.max(selectedIndex, clickedIndex);
      const addTorrents = $sortedTorrents
        .slice(startIndex, endIndex + 1)
        .map((t) => t.id);
      selectedTorrents.add(addTorrents);
    }
  };

  let menuOpen = $state(false);
  let pressed = null;

  // Remember which row a right-click or long-press started on, so the menu
  // acts on it even when it wasn't selected yet.
  const rememberPressedRow = (event) => {
    const row = event.target.closest('tr[data-torrent-id]');
    pressed = row
      ? {
          id: Number(row.dataset.torrentId),
          modifierKey: event.shiftKey ? 'shift' : event.ctrlKey ? 'ctrl' : null,
        }
      : null;
  };

  const handleMenuOpenChange = (open) => {
    if (!open) return;
    if (pressed && !$selectedTorrents.includes(pressed.id)) {
      handleTorrentClick({ id: pressed.id }, pressed.modifierKey, false);
    }
    if (!$selectedTorrents.length) menuOpen = false;
  };

  let tbody = $state(null);

  // Moves the selection up or down the list, extending it while shift is held
  const moveSelection = (offset, extend) => {
    if (!$sortedTorrents.length) return;
    const currentIndex = $sortedTorrents.findIndex(
      (t) => t.id === $selectedTorrents.at(-1)
    );
    let index = currentIndex === -1 ? 0 : currentIndex + offset;
    index = Math.max(0, Math.min($sortedTorrents.length - 1, index));
    const torrentId = $sortedTorrents[index].id;

    if (extend) {
      selectedTorrents.update((ids) => [
        ...ids.filter((id) => id !== torrentId),
        torrentId,
      ]);
    } else {
      selectedTorrents.set([torrentId]);
    }
    scrollRowIntoView(index);
  };

  const focusSearch = () => {
    document.querySelector('[data-search-torrents] input')?.focus();
  };

  const handleKeydown = (event) => {
    const target = document.activeElement;
    // Keys meant for an open menu, dialog or form field aren't list shortcuts
    if (
      event.defaultPrevented ||
      target?.closest('[role="menu"], [role="dialog"]') ||
      $modals ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) ||
      target?.isContentEditable
    ) {
      return;
    }

    const hasSelection = $selectedTorrents.length > 0;

    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      selectedTorrents.set($sortedTorrents.map((t) => t.id));
    } else if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(event.key === 'ArrowDown' ? 1 : -1, event.shiftKey);
    } else if (
      event.key === 'Enter' &&
      hasSelection &&
      target?.tagName !== 'BUTTON'
    ) {
      event.preventDefault();
      openTorrentDetails($selectedTorrents.at(-1));
    } else if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      hasSelection
    ) {
      event.preventDefault();
      modals.open({ component: Remove });
    } else if (event.key === 'Escape' && hasSelection) {
      selectedTorrents.clear();
    } else if (event.key === '/') {
      event.preventDefault();
      focusSearch();
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<ContextMenu.Root bind:open={menuOpen} onOpenChange={handleMenuOpenChange}>
  <ContextMenu.Trigger class="block h-full">
    <div
      class="wrapper"
      bind:this={wrapper}
      bind:clientWidth={listWidth}
      bind:clientHeight={viewHeight}
      onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}
      onpointerdowncapture={rememberPressedRow}
    >
      <table class="table" style="width: {tableWidth}px">
        <thead class="table-header">
          {#each $activeColumns as column (column.id)}
            <ColumnHeader
              id={column.id}
              width={column.id === UI_COLUMN.NAME.id ? nameWidth : undefined}
            />
          {/each}
        </thead>
        <tbody bind:this={tbody}>
          {#if firstRow > 0}
            <tr class="spacer" aria-hidden="true">
              <td
                colspan={columnIds.length}
                style="height: {firstRow * rowHeight}px"
              ></td>
            </tr>
          {/if}
          {#each visibleTorrents as torrent (torrent[TRANSMISSION_COLUMN_ID])}
            <Torrent
              torrent={torrent}
              columns={columnIds}
              units={units}
              onselect={handleTorrentClick}
              selected={selectedIds.has(torrent.id)}
            />
          {/each}
          {#if lastRow < $sortedTorrents.length}
            <tr class="spacer" aria-hidden="true">
              <td
                colspan={columnIds.length}
                style="height: {($sortedTorrents.length - lastRow) *
                  rowHeight}px"
              ></td>
            </tr>
          {/if}
        </tbody>
      </table>
      {#if !$modals}
        <TorrentDropzone />
      {/if}
    </div>
  </ContextMenu.Trigger>
  <TorrentContextMenu />
</ContextMenu.Root>

<style>
  .wrapper {
    height: 100%;
    overflow: auto;
    position: relative;
    background-color: var(--color-torrent-list-background);
  }

  .spacer td {
    padding: 0;
    border: 0;
  }

  .table {
    border-spacing: 0;
    table-layout: fixed;
    user-select: none;
  }
</style>
