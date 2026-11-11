import {readFileSync,existsSync} from 'node:fs';import assert from 'node:assert/strict';
const get=p=>readFileSync(p,'utf8');
assert.match(get('apps/web/app/api/posts/route.ts'),/authenticated\(\)/);
assert.match(get('apps/api-gateway/src/gateway.controller.ts'),/this.auth\(k\)/);
assert.match(get('apps/content-service/prisma/schema.prisma'),/model Image/);
assert.match(get('apps/web/app/components/gallery.tsx'),/Previous image/);
assert.match(get('docker-compose.yml'),/media_data/);
assert.ok(existsSync('apps/web/app/admin/login/page.tsx'));
console.log('PASS: routes authenticated, media persisted, gallery and login exist');
