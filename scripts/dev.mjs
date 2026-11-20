import { spawnSync } from 'node:child_process';
import { watch } from 'node:fs';
import { serve } from './serve.mjs';

function build() {
  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (result.status !== 0) console.error('El build falló; revisá el error anterior.');
  return result.status === 0;
}
if (!build()) process.exit(1);
const server = serve();
let timer;
const watchers = ['src', 'public'].map((directory) =>
  watch(directory, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (build()) console.log('Actualizado. Recargá el navegador.');
    }, 250);
  }),
);
process.on('SIGINT', () => {
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  server.close();
});
