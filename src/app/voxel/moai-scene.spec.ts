import { TestBed } from '@angular/core/testing';
import { MoaiScene } from './moai-scene';

describe('MoaiScene', () => {
  it('reports a failure instead of throwing when WebGL is missing, and shows no controls', async () => {
    const fixture = TestBed.createComponent(MoaiScene);
    const failed = vi.fn();
    fixture.componentInstance.failed.subscribe(failed);
    await fixture.whenStable();
    expect(failed).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('keeps the canvas decorative', async () => {
    const fixture = TestBed.createComponent(MoaiScene);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
