import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
import PauseIcon from '@lucide/svelte/icons/pause';
import ClockIcon from '@lucide/svelte/icons/clock';
import LoaderIcon from '@lucide/svelte/icons/loader-circle';
import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
import {
  STATUSES,
  STATUS_CHECK_WAITING,
  STATUS_CHECKING,
  STATUS_DOWNLOAD_WAITING,
  STATUS_DOWNLOADING,
  STATUS_SEED_WAITING,
  STATUS_SEEDING,
} from '~helpers/constants/statuses';
import { TRANSMISSION_COLUMN } from '~helpers/constants/columns';

// tone is a CSS color, so it works in both Tailwind and scoped styles
const TONES = {
  download: 'var(--color-download)',
  upload: 'var(--color-upload)',
  muted: 'var(--muted-foreground)',
  error: 'var(--destructive)',
};

// One place deciding how a torrent's state is shown: icon, label and color
export const getTorrentStatus = (torrent) => {
  const status = STATUSES[torrent[TRANSMISSION_COLUMN.STATUS]];
  const done = torrent[TRANSMISSION_COLUMN.DOWNLOAD_PROGRESS] === 1;

  if (torrent[TRANSMISSION_COLUMN.ERROR] > 1) {
    return { label: 'Error', icon: TriangleAlertIcon, tone: TONES.error };
  }
  if (torrent[TRANSMISSION_COLUMN.METADATA_PROGRESS] < 1) {
    return {
      label: 'Fetching metadata',
      icon: LoaderIcon,
      tone: TONES.muted,
      spin: true,
    };
  }

  switch (status) {
    case STATUS_DOWNLOADING:
      return {
        label: 'Downloading',
        icon: ArrowDownIcon,
        tone: TONES.download,
      };
    case STATUS_SEEDING:
      return { label: 'Seeding', icon: ArrowUpIcon, tone: TONES.upload };
    case STATUS_CHECKING:
      return {
        label: 'Checking',
        icon: LoaderIcon,
        tone: TONES.muted,
        spin: true,
      };
    case STATUS_CHECK_WAITING:
      return { label: 'Queued for check', icon: ClockIcon, tone: TONES.muted };
    case STATUS_DOWNLOAD_WAITING:
      return { label: 'Queued', icon: ClockIcon, tone: TONES.muted };
    case STATUS_SEED_WAITING:
      return {
        label: 'Queued for seeding',
        icon: ClockIcon,
        tone: TONES.muted,
      };
    default:
      return done
        ? { label: 'Finished', icon: CircleCheckIcon, tone: TONES.muted }
        : { label: 'Stopped', icon: PauseIcon, tone: TONES.muted };
  }
};
