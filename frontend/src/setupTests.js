import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const IconStub = () => null;

vi.mock('@mui/icons-material', () => ({
  __esModule: true,
  default: IconStub,
  VolunteerActivism: IconStub,
  Search: IconStub,
  ChatBubbleOutlined: IconStub,
  NotificationsNone: IconStub,
  ArrowForward: IconStub,
}));
