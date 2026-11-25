/**
 * Nutella, the author's chihuahua, as voxels for the 404 page (issue #632): shaped with the dog3d.pages.dev
 * configurator, coloured after a photo, cut to the moai's cubes. Pure data, no runtime imports (like moai.model.ts).
 */
export type NutellaColor = 'cream' | 'white' | 'tan' | 'saddle' | 'ear' | 'black';

export interface NutellaVoxel {
  x: number;
  y: number;
  z: number;
  color: NutellaColor;
}

const COLORS: readonly NutellaColor[] = ['cream', 'white', 'tan', 'saddle', 'ear', 'black'];
/** The model is symmetric: x and 11 - x mirror each other. */
const WIDTH = 11;

/** The left half (x ≤ 5), one voxel every four base-36 characters: x, y, z and the colour's index. The face looks at +z. */
const HALF =
  '3021402130314031308140813091409131214121313141313181418131914191322142213231423132814281329142913321432133314331' +
  '5341535153615371338143813391439144115411342144215421343144315431344144415441345144515451346144615461347144715471' +
  '34814481548134914491549134a144a154a13511451155113521452125313531453125413541255135512561356125713571258135814581' +
  '3591459135a145a155a145b155b136124612561236224622263236324633264226522662267226823683468326913691469136a046a036b0' +
  '46b056b036c146c156c136d146d156d146e156e1570237124712571237224722572227333732274227522762277227821791279117a027a0' +
  '37a017b027b037b017c127c137c117d127d137d147d117e127e137e147e157e127f137f147f157f158023813481258123823482258223832' +
  '28433842285338522863386228733872288238821891289118a008b018b008c018c018d018e028e018f128f138f148f158f128g138g148g1' +
  '58g148h158h158i1490259024912591249235923393349335933394349435941395349515951396349635961397349725972198329823982' +
  '49821991299109a019a009b009c019c009d019d019e019f129f129g139g149g149h159h159i54a035a034a135a134a735a731a832a833a83' +
  '4a830a901a900aa00ab00ac00ad01ad00ae01ae01af12af12ag13ag14ag15ag14ah15ah15ai55b035b135b234b735b731b832b833b834b83' +
  '0b901b900ba00bb00bc00bd00be01be01bf02bf02bg03bg54bg55bg05c134c735c731c832c833c834c830c901c900ca01ca02ca03ca04ca0' +
  '0cb01cb02cb03cb04cb00cc01cc02cc03cc04cc00cd01cd00ce01ce01cf02cf02cg03cg54cg55cg04d705d701d802d803d804d805d801d90' +
  '2d900da01da02da03da04da05da00db01db04db05db00dc01dc02dc03dc04dc05dc00dd01dd02dd03dd01de01df02df03df02dg03dg04dg0' +
  '5dg02e803e804e805e801e902e903e900ea01ea02ea03ea04ea05ea00eb01eb05eb00ec01ec03ec04ec05ec00ed01ed02ed03ed04ed01ee0' +
  '2ee01ef02ef03ef04ef05ef03eg04eg05eg04f805f802f903f904f905f900fa01fa02fa03fa04fa05fa00fb01fb02fb03fb04fb05fb00fc0' +
  '1fc02fc03fc04fc05fc00fd01fd02fd03fd04fd05fd02fe03fe04fe05fe02ff03ff04ff05ff00ga01ga02ga03ga04ga05ga00gb04gb05gb0' +
  '0gc41gc02gc03gc04gc05gc01gd42gd43gd45gd01ha02ha03ha04ha00hb01hb03hb04hb00hc41hc42hc03hc44hc02hd41ia02ia03ia00ib0' +
  '1ib02ib03ib04ib00ic41ic42ic43ic44ic02ja00jb01jb02jb03jb00jc41jc42jc43jc40kb01kb02kb03kb00kc41kc42kc40lb01lb02lb0' +
  '0lc41lc42lc4';

export function nutellaVoxels(): NutellaVoxel[] {
  const half = (HALF.match(/..../g) ?? []).map(([x, y, z, c]) => ({
    x: parseInt(x, 36),
    y: parseInt(y, 36),
    z: parseInt(z, 36),
    color: COLORS[parseInt(c, 36)],
  }));
  return [...half, ...half.map((v) => ({ ...v, x: WIDTH - v.x }))];
}

/** The parts that move: the head tilts round the neck, the tail wags round its base. */
export const isHead = (v: NutellaVoxel): boolean => (v.z >= 10 && v.y >= 6) || v.y >= 13;
export const isTail = (v: NutellaVoxel): boolean => v.z <= 2 && v.y >= 9;
export const NECK = { x: WIDTH / 2, y: 9, z: 10 } as const;

/** Ground cells under the feet and one cell round them, like the moai's shadow. */
export function nutellaShadowCells(voxels: readonly NutellaVoxel[]): { x: number; z: number }[] {
  const cells = new Set<string>();
  for (const v of voxels) {
    if (v.y > 1) continue;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) cells.add(`${String(v.x + dx)},${String(v.z + dz)}`);
  }
  return [...cells].map((k) => {
    const [x, z] = k.split(',').map(Number);
    return { x, z };
  });
}
