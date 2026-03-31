import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://mockdata.net';

const routes = [
  '/',
  '/json-generator',
  '/csv-generator',
  '/sql-generator',
  '/mock-api-simulator',
  '/jwt-generator',
  '/regex-generator',
  '/converter',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
  '/blog',
];

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map((route) => {
      const priority = route === '/' ? '1.0' : route.includes('generator') || route.includes('simulator') ? '0.9' : '0.5';
      const changefreq = 'weekly';
      return `
    <url>
      <loc>${SITE_URL}${route}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
    })
    .join('')}
</urlset>
`;

  const publicPath = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }
  
  fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml successfully generated at /public/sitemap.xml');
};

generateSitemap();
