import { expect, test } from './fixtures';

interface Manifest {
  name: string;
  start_url: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; purpose?: string }[];
}

// Lighthouse wants a manifest with a splash screen, a theme colour and a maskable icon (issue #355)
for (const lang of ['en', 'it']) {
  test(`${lang}: the page links a manifest that opens the same language, with icons that load`, async ({ page, request }) => {
    await page.goto(`/${lang}/`);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const url = new URL(href ?? '', page.url());
    const response = await request.get(url.href);
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as Manifest;

    expect(manifest.name).toBe('Emanuele Del Monte');
    expect(new URL(manifest.start_url, url).pathname).toBe(`/${lang}/`);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      const image = await request.get(new URL(icon.src, url).href);
      expect(image.status(), icon.src).toBe(200);
      expect(image.headers()['content-type']).toBe('image/png');
    }
  });
}
