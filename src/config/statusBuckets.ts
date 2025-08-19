export const INACTIVE_STATUSES = [
  'PAUSED',
  'CANCELLED', 
  'INACTIVE',
  'CLOSED',
  'EXITED',
  'CHURNED'
];

// Treat null/unknown statuses as active unless exit_date is set
export const isClientActive = (status: string | null, exitDate: string | null): boolean => {
  if (exitDate) return false;
  if (!status) return true;
  return !INACTIVE_STATUSES.includes(status.toUpperCase());
};