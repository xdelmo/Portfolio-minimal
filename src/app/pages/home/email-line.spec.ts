import { TestBed } from '@angular/core/testing';
import { COPIED_MS, EmailLine } from './email-line';

async function render(clipboard: { writeText: (text: string) => Promise<void> } | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  const fixture = TestBed.createComponent(EmailLine);
  fixture.componentRef.setInput('email', 'info@example.com');
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('EmailLine', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
    vi.useRealTimers();
  });

  it('offers no copy button without a clipboard, so nothing sits there doing nothing', async () => {
    const { el } = await render(undefined);
    expect(el.querySelector('button')).toBeNull();
  });

  it('copies the address, says so, and offers to copy again after a moment', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const { fixture, el } = await render({ writeText });
    const button = el.querySelector('button');
    expect(button?.textContent.trim()).toBe('Copy the email address');
    vi.useFakeTimers();
    button?.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('info@example.com');
    expect(button?.textContent.trim()).toBe('Copied');
    expect(el.querySelector('[role="status"]')?.textContent.trim()).toBe('Email address copied');
    await vi.advanceTimersByTimeAsync(COPIED_MS);
    fixture.detectChanges();
    expect(button?.textContent.trim()).toBe('Copy the email address');
  });
});
