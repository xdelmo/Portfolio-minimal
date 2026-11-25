import { TestBed } from '@angular/core/testing';
import { NutellaScene } from './nutella-scene';

describe('NutellaScene', () => {
  it('reports a failure instead of throwing when WebGL is missing', async () => {
    const fixture = TestBed.createComponent(NutellaScene);
    const failed = vi.fn();
    fixture.componentInstance.failed.subscribe(failed);
    await fixture.whenStable();
    expect(failed).toHaveBeenCalledOnce();
  });

  it('keeps the canvas decorative', async () => {
    const fixture = TestBed.createComponent(NutellaScene);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
