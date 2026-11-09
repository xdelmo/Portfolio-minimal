import type { Reaction } from './voice';

/** What the moai says, a stone's few words (issue #393). Imported only by the lazy scene, so none of it is in the first load. */
export const LINES: Readonly<Record<Reaction, readonly string[]>> = {
  copy: [$localize`:@@moai.line.copy.1:Talk soon.`],
  hop: [$localize`:@@moai.line.hop.1:Hey.`, $localize`:@@moai.line.hop.2:Yes?`],
  gum: [$localize`:@@moai.line.gum.1:Gum gum.`],
  drag: [$localize`:@@moai.line.drag.1:Easy, I'm made of stone.`],
  dizzy: [$localize`:@@moai.line.dizzy.1:Eight hundred years still, and now this.`],
  shake: [$localize`:@@moai.line.shake.1:My pukao!`],
  sulk: [$localize`:@@moai.line.sulk.1:Hmph. Not talking to you.`],
  sneeze: [$localize`:@@moai.line.sneeze.1:Ah… ah… Achoo!`],
  dark: [$localize`:@@moai.line.dark.1:Lights off. I'll keep watch.`],
  light: [$localize`:@@moai.line.light.1:Morning already?`],
  hello: [$localize`:@@moai.line.hello.1:Hello!`],
  found: [$localize`:@@moai.line.found.1:I knew you'd find it.`],
  explorer: [$localize`:@@moai.line.explorer.1:You read them all. Respect.`],
  wake: [$localize`:@@moai.line.wake.1:Five more minutes…`],
};
