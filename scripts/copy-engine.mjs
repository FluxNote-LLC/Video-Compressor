import { cp, mkdir } from 'node:fs/promises';
await mkdir('public/ffmpeg', { recursive: true });
await cp('node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js', 'public/ffmpeg/ffmpeg-core.js');
await cp('node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm', 'public/ffmpeg/ffmpeg-core.wasm');
await cp('node_modules/@ffmpeg/ffmpeg/dist/esm', 'public/ffmpeg/worker', { recursive: true });
