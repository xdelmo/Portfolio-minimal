import { workImageLoader } from './image-loader';

describe('workImageLoader', () => {
  const src = 'images/work/apexflow.jpg';

  it('points smaller widths at their resized file', () => {
    expect(workImageLoader({ src, width: 800, loaderParams: { full: 1600 } })).toBe('images/work/apexflow-800.jpg');
  });

  it('uses the original file for the full width and when no width is asked', () => {
    expect(workImageLoader({ src, width: 1600, loaderParams: { full: 1600 } })).toBe(src);
    expect(workImageLoader({ src, loaderParams: { full: 1600 } })).toBe(src);
  });
});
