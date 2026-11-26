import { TestBed } from '@angular/core/testing';
import { CaseDiagram } from './case-diagram';
import { caseDiagramFor } from './diagrams';

describe('CaseDiagram', () => {
  it('defaults to the built mode and switches modes on click', async () => {
    const data = caseDiagramFor('en', 'apexflow');
    if (!data) throw new Error('missing apexflow diagram');

    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(CaseDiagram);
    fixture.componentRef.setInput('diagram', data);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('.diagram-btn')];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('.diagram-caption')?.textContent).toBe(data.modes[1].caption);
    expect(el.querySelectorAll('.diagram-steps li')).toHaveLength(3);

    buttons[0].click();
    await fixture.whenStable();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelector('.diagram-caption')?.textContent).toBe(data.modes[0].caption);
  });

  it('resets active mode when the diagram input changes', async () => {
    const first = caseDiagramFor('en', 'apexflow');
    const second = caseDiagramFor('en', 'pokeverba');
    if (!first || !second) throw new Error('missing diagrams');

    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(CaseDiagram);
    fixture.componentRef.setInput('diagram', first);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    el.querySelectorAll<HTMLButtonElement>('.diagram-btn')[0].click();
    await fixture.whenStable();
    expect(el.querySelectorAll<HTMLButtonElement>('.diagram-btn')[0].getAttribute('aria-pressed')).toBe('true');

    fixture.componentRef.setInput('diagram', second);
    await fixture.whenStable();
    expect(el.querySelectorAll<HTMLButtonElement>('.diagram-btn')[1].getAttribute('aria-pressed')).toBe('true');
  });
});
