import { expect, retryWebkitInternalError, test } from './fixtures';

// issue #125: only WebKit's internal error earns a second navigation; every other failure still fails the test
test('a navigation WebKit drops with its internal error is tried once more, any other error is not', async () => {
  let calls = 0;
  let retries = 0;
  const flaky = () => {
    calls++;
    return calls === 1 ? Promise.reject(new Error('page.goto: WebKit encountered an internal error')) : Promise.resolve('ok');
  };
  expect(await retryWebkitInternalError(flaky, () => retries++)).toBe('ok');
  expect([calls, retries]).toEqual([2, 1]);

  const timeout = () => Promise.reject(new Error('page.goto: Timeout 30000ms exceeded'));
  await expect(retryWebkitInternalError(timeout, () => retries++)).rejects.toThrow('Timeout');
  expect(retries).toBe(1);

  const twice = () => Promise.reject(new Error('WebKit encountered an internal error'));
  await expect(retryWebkitInternalError(twice, () => retries++)).rejects.toThrow('internal error');
});
