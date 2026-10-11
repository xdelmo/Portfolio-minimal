import { TestBed } from '@angular/core/testing';
import { AvatarScene } from './avatar-scene';

describe('AvatarScene', () => {
  it('stays undrawn instead of throwing when WebGL is missing, with a decorative canvas', async () => {
    const layer = document.createElement('div');
    layer.className = 'avatar';
    document.body.append(layer);
    const fixture = TestBed.createComponent(AvatarScene);
    layer.append(fixture.nativeElement as HTMLElement);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(layer.hasAttribute('data-drawn')).toBe(false);
    layer.remove();
    expect(host.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });
});
