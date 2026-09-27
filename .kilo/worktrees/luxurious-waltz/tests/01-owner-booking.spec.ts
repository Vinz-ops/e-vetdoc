import { test } from '@playwright/test';
import { runAdminScheduleFlow, runOwnerBookingFlow } from './flows/booking';

test('01 - Manual Run: Admin Schedule & Owner Booking', async ({ page }) => {
  test.setTimeout(60000);
  await runAdminScheduleFlow(page);
  await runOwnerBookingFlow(page);
});
