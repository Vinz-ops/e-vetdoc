import { test } from '@playwright/test';
import { wipeTestData } from './flows/cleanup';

test('00 - Manual Cleanup: Wipe all test data from Supabase', async () => {
  test.setTimeout(60000); 
  await wipeTestData();
});
