import { Voxel } from './moai.model';
import { COS30, isoBounds, isoFaces, isoSvg, project, shadeHex } from './iso';

const cube: Voxel[] = [{ x: 0, y: 0, z: 0, color: 'stone' }];
const palette = { stone: '#808080', stoneDark: '#404040', stoneLight: '#c0c0c0', eye: '#0066d4', pukao: '#ffc9a8', moss: '#a8e0c8' };

describe('isometric projection', () => {
  it('projects x down-right, z down-left and y straight up', () => {
    expect(project(1, 0, 0)).toEqual([COS30, 0.5]);
    expect(project(0, 0, 1)).toEqual([-COS30, 0.5]);
    expect(project(0, 1, 0)).toEqual([0, -1]);
  });

  it('draws the three visible faces of a lone cube', () => {
    const faces = isoFaces(cube);
    expect(faces).toHaveLength(3);
    expect(faces.map((f) => f.shade).sort()).toEqual([0.72, 0.86, 1]);
  });

  it('hides faces covered by a neighbour', () => {
    const faces = isoFaces([...cube, { x: 1, y: 0, z: 0, color: 'stone' }]);
    expect(faces).toHaveLength(5);
  });

  it('paints far cubes before near ones', () => {
    const faces = isoFaces([
      { x: 2, y: 2, z: 2, color: 'eye' },
      { x: 0, y: 0, z: 0, color: 'stone' },
    ]);
    expect(faces[0].color).toBe('stone');
    expect(faces.at(-1)?.color).toBe('eye');
  });

  it('measures the drawing', () => {
    const b = isoBounds(isoFaces(cube));
    expect(b.width).toBeCloseTo(2 * COS30);
    expect(b.height).toBeCloseTo(2);
  });

  it('darkens colours for the shaded faces', () => {
    expect(shadeHex('#808080', 0.5)).toBe('#404040');
    expect(shadeHex('#ffffff', 1)).toBe('#ffffff');
  });

  it('writes a self-contained SVG sized to the drawing', () => {
    const svg = isoSvg(cube, palette, 10);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(3);
    expect(svg).toContain(`width="${String(Math.round(2 * COS30 * 10))}"`);
  });
});
