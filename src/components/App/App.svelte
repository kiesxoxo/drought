<script>
  import { untrack } from 'svelte';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import Toolbar from '~components/Toolbar/Toolbar.svelte';
  import StatusBar from '~components/StatusBar/StatusBar.svelte';
  import DetailsPane from '~components/DetailsPane/DetailsPane.svelte';
  import Panel from '~components/Panel';
  import TorrentList from '~components/TorrentList';
  import Modal from '~components/Modal';
  import Alerts from '~components/Alerts';
  import {
    panel,
    darkMode,
    switchSpeedColors,
    isMobile,
    detailsPaneRequest,
    selectedTorrents,
  } from '~helpers/stores';

  const DEFAULT_DETAILS_SIZE = 40;
  const USER_COLLAPSED_KEY = 'details-pane-user-collapsed';

  let detailsPane = $state(null);

  const readUserCollapsed = () => {
    try {
      return window.localStorage.getItem(USER_COLLAPSED_KEY) === 'true';
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return false;
    }
  };

  // Whether the user collapsed the pane themselves, as opposed to it folding
  // away because nothing is selected. Only the latter reopens on selection.
  let collapsedByUser = readUserCollapsed();
  let autoCollapsing = false;
  // paneforge reports the restored layout once on mount; that's not the user
  let paneInitialised = false;
  const paneReported = () => {
    const wasInitialised = paneInitialised;
    paneInitialised = true;
    return wasInitialised;
  };
  // Phones drop the pane, so it mounts afresh when the window grows again
  $effect(() => {
    if ($isMobile) paneInitialised = false;
  });

  const setCollapsedByUser = (value) => {
    collapsedByUser = value;
    try {
      window.localStorage.setItem(USER_COLLAPSED_KEY, String(value));
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // Remembering this is a nicety, ignore storage errors
    }
  };

  const hasSelection = $derived($selectedTorrents.length > 0);

  // An empty details pane only takes room from the list, so it folds away
  // while nothing is selected and comes back at its previous size
  $effect(() => {
    if (!detailsPane) return;
    if (!hasSelection && !detailsPane.isCollapsed()) {
      autoCollapsing = true;
      detailsPane.collapse();
      autoCollapsing = false;
    } else if (hasSelection && !collapsedByUser && detailsPane.isCollapsed()) {
      detailsPane.expand();
    }
  });

  $effect(() => {
    document.documentElement.classList.toggle('dark', $darkMode);
  });

  // Something asked to show details (double-click, Enter), so un-collapse
  $effect(() => {
    // Only a new request reopens it; a later collapse must not re-run this
    if ($detailsPaneRequest && untrack(() => detailsPane?.isCollapsed())) {
      detailsPane.resize(DEFAULT_DETAILS_SIZE);
    }
  });
</script>

<Tooltip.Provider delayDuration={500}>
  <main
    class="flex h-dvh overflow-hidden"
    class:switch-speed-colors={$switchSpeedColors}
  >
    {#if $panel}
      <Panel />
    {/if}
    <div class="flex min-w-0 flex-1 flex-col">
      <Toolbar />
      {#if $isMobile}
        <div class="min-h-0 flex-1"><TorrentList /></div>
      {:else}
        <Resizable.PaneGroup
          direction="vertical"
          autoSaveId="drought-main-split"
          class="min-h-0 flex-1"
        >
          <Resizable.Pane defaultSize={60} minSize={20}>
            <TorrentList />
          </Resizable.Pane>
          <Resizable.Handle />
          <Resizable.Pane
            bind:this={detailsPane}
            defaultSize={DEFAULT_DETAILS_SIZE}
            minSize={15}
            collapsible
            collapsedSize={0}
            onCollapse={() => {
              if (paneReported() && !autoCollapsing) setCollapsedByUser(true);
            }}
            onExpand={() => {
              if (paneReported()) setCollapsedByUser(false);
            }}
          >
            <DetailsPane />
          </Resizable.Pane>
        </Resizable.PaneGroup>
      {/if}
      <StatusBar />
    </div>
    <Modal />
    <Alerts />
  </main>
</Tooltip.Provider>
