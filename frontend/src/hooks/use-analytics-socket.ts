import { useAnalyticsSocketContext } from '@/contexts/analytics-socket-context';

export function useAnalyticsSocket() {
  return useAnalyticsSocketContext();
}
