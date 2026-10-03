import { TestBed } from '@angular/core/testing';
import { CONTENT_EN } from '../../content/content.en';
import { StackList } from './stack-list';

describe('StackList', () => {
  it('renders each group as a titled list', async () => {
    const fixture = TestBed.createComponent(StackList);
    fixture.componentRef.setInput('groups', CONTENT_EN.stack);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('h3')].map((h) => h.textContent.trim())).toEqual(CONTENT_EN.stack.map((g) => g.name));
    expect(el.querySelectorAll('ul li')).toHaveLength(CONTENT_EN.stack.reduce((n, g) => n + g.items.length, 0));
  });
});
