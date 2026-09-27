import { test } from '@playwright/test';
import { runVetClinicalFlow, runAdminAuditVerification } from './flows/clinical';

test('02 - Manual Run: Vet Clinical Flow & Admin Logs', async ({ page }) => {
  test.setTimeout(60000);
  await runVetClinicalFlow(page);
  await runAdminAuditVerification(page);
});
