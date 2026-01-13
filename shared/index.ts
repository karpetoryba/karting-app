// Export all shared utilities

export type { FetchInterface, FetchOptions, FetchResponse } from './fetch';
export {
  fakeFetch,
  clearFakeSessions,
  clearFakeBookings,
  clearFakePayments,
  clearFakeLapTimes,
  clearAllFakeData,
} from './fakeFetch';
export type {
  Session,
  Booking,
  Payment,
  LapTime,
  LeaderboardEntry,
  PilotStats,
} from './fakeFetch';
export { realFetch } from './realFetch';
