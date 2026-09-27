import { test } from '@playwright/test';
import { wipeTestData } from './flows/cleanup';
import { runAdminScheduleFlow, runOwnerBookingFlow } from './flows/booking';
import { runVetClinicalFlow, runAdminAuditVerification } from './flows/clinical';

test.describe.serial('Full E2E Master Flow', () => {
  // Use sequential mode so they run one after another in order on a single worker
  
  test('Step 00: Clean test data before running', async () => {
    test.setTimeout(60000);
    await wipeTestData();
  });

  test('Step 01: Admin Schedule & Owner Booking', async ({ page }) => {
    test.setTimeout(60000);
    await runAdminScheduleFlow(page);
    await runOwnerBookingFlow(page);
  });

  test('Step 02: Vet Clinical Diagnosis & Admin Verification', async ({ page }) => {
    test.setTimeout(60000);
    await runVetClinicalFlow(page);
    await runAdminAuditVerification(page);
  });
});
