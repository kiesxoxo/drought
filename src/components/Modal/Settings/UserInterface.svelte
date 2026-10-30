<script>
  import Header from './Header.svelte';
  import Button from '~components/Button';
  import InputMultiple from '~components/InputMultiple';
  import Checkbox from '~components/Checkbox';
  import Select from '~components/Select';
  import {
    modals,
    alerts,
    uiColumns,
    paths,
    darkMode,
    switchSpeedColors,
    timeConfig,
    tableHeaderConfig,
    diskUsage,
  } from '~helpers/stores';
  import { orderable } from '~helpers/actions';
  import { PATH_VALIDATION_REGEX } from '~helpers/constants/paths';

  const newColumns = $state(structuredClone($uiColumns));
  // Dragging reorders the DOM directly (see the orderable action), so the new
  // order is only recorded here and applied on save
  let columnOrder = null;
  let newPaths = $state([...$paths]);
  let newSwitchSpeedColors = $state($switchSpeedColors);
  let newTimeConfig = $state($timeConfig);
  let newTableHeaderConfig = $state($tableHeaderConfig);
  const configuredDarkMode = darkMode.configuredValue;
  let newDarkMode = $state($configuredDarkMode);
  let newDiskUsage = $state($diskUsage);

  const darkModeOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Enabled', value: 'enabled' },
    { label: 'Disabled', value: 'disabled' },
  ];

  const handleSubmit = () => {
    try {
      const columns = $state.snapshot(newColumns);
      if (columnOrder) {
        columns.sort(
          (a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)
        );
      }
      uiColumns.set(columns);
      // The paths field always keeps one blank row; don't save blanks
      paths.set(newPaths.map((path) => path.trim()).filter(Boolean));
      switchSpeedColors.set(newSwitchSpeedColors);
      timeConfig.set(newTimeConfig);
      tableHeaderConfig.set(newTableHeaderConfig);
      darkMode.set(newDarkMode);
      diskUsage.set(newDiskUsage);
      alerts.add('Succesfully saved user interface settings');
    } catch (e) {
      console.error(e);
      alerts.add(
        'Failed saving user interface settings, please try again',
        'negative'
      );
    }
  };

  const handleColumnDrop = (sorting) => {
    columnOrder = sorting;
  };
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    handleSubmit(event);
  }}
>
  <Header text="Color scheme" />
  <div class="list">
    <Select
      options={darkModeOptions}
      onchange={(value) => (newDarkMode = value)}
      value={newDarkMode}
      direction="below"
      label="Dark mode"
    />
  </div>

  <div class="list">
    <Checkbox
      label="Switch speed colors"
      hint="This will switch the upload and download colors. Originally green for download and blue for upload."
      bind:checked={newSwitchSpeedColors}
    />
  </div>

  <Header text="Format" />
  <div class="list">
    <Checkbox
      label="24-hour notation"
      hint="Will represent time with 24 hours if enabled and 12 hours if disabled"
      bind:checked={newTimeConfig}
    />
  </div>

  <div class="list">
    <Checkbox
      label="Wrap overflowing text in table headers"
      hint="Will wrap text in header columns when enabled"
      bind:checked={newTableHeaderConfig}
    />
  </div>

  <Header text="Common paths" />
  <p class="hint">
    These paths are offered behind the folder icon of every path field.
  </p>
  <InputMultiple
    bind:values={newPaths}
    pattern={PATH_VALIDATION_REGEX}
    validationMessage="Path must be an absolute path."
  />

  <div class="list">
    <Checkbox
      label="Show disk usage"
      hint="Shows disk usage in the sidepanel based on the common paths"
      bind:checked={newDiskUsage}
    />
  </div>

  <Header text="Torrent Columns" />
  <div class="list">
    {#each Object.values(newColumns) as column (column.id)}
      <div
        class="column"
        draggable="true"
        use:orderable={handleColumnDrop}
        id={column.id}
      >
        <span>{uiColumns.getColumnLabel(column.id)}</span>
        <Checkbox bind:checked={column.enabled} label="Enabled" />
      </div>
    {/each}
  </div>

  <div class="buttons">
    <Button type="button" priority="tertiary" onclick={modals.close}>
      Cancel
    </Button>
    <Button type="submit" priority="primary">Save settings</Button>
  </div>
</form>

<style>
  form {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    line-height: 1;
    color: var(--color-modal-text);
  }

  form :global(.checkbox) :global(.indicator) {
    background: var(--color-checkbox-background-dark);
    border-color: var(--color-checkbox-border-dark);
  }

  .buttons {
    flex-grow: 1;
    align-items: flex-end;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .list {
    margin-bottom: 15px;
    border-radius: 3px;
    overflow: hidden;
  }

  .column {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-modal-user-interface-column-background);
    border: 1px solid var(--color-modal-user-interface-column-border);
    cursor: move;
    height: 30px;
    padding: 0 5px;
    font-size: 13px;
  }

  .hint {
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 8px;
  }
</style>
