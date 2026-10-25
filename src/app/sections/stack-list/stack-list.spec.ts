import { TestBed } from '@angular/core/testing';
import { CONTENT_EN } from '../../content/content.en';
import { StackList } from './stack-list';

describe('StackList', () => {
  it('renders the three levels in order, each a titled list, with a meter of 3, 2 and 1 lit cells', async () => {
    const fixture = TestBed.createComponent(StackList);
    fixture.componentRef.setInput('groups', CONTENT_EN.stack);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const levels = [...el.querySelectorAll('.level')];
    expect(levels).toHaveLength(3);
    expect(levels.map((l) => l.querySelector('h3')?.textContent.trim())).toEqual(CONTENT_EN.stack.map((g) => g.name));
    expect(levels.map((l) => l.querySelectorAll('.meter .on').length)).toEqual([3, 2, 1]);
    expect(el.querySelectorAll('.level li')).toHaveLength(CONTENT_EN.stack.reduce((n, g) => n + g.items.length, 0));
  });
});
