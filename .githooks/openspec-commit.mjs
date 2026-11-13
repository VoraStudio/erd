// Hook OpenSpec Commit (git pre-commit).
// Cada commit tiene que añadir una nota nueva en openspec/decisiones/<categoria>/NNN.md.
// Va como hook de git y no de Claude Code: se ejecuta después del git add, cuando ya se sabe qué entra.
import { execFileSync } from 'node:child_process';

const PATRON_DE_NOTA = /^openspec\/decisiones\/[a-z]+\/\d{3}\.md$/;

function ejecutarGit(argumentos) {
  return execFileSync('git', argumentos, { encoding: 'utf8' });
}

// Un merge junta commits que ya llevaban su nota.
function estaHaciendoMerge() {
  try {
    ejecutarGit(['rev-parse', '-q', '--verify', 'MERGE_HEAD']);
    return true;
  } catch {
    return false;
  }
}

if (estaHaciendoMerge()) {
  process.exit(0);
}

// Solo los archivos añadidos (A): editar una nota antigua no cuenta como nota nueva.
const archivosAnadidos = ejecutarGit(['diff', '--cached', '--name-only', '--diff-filter=A'])
  .split('\n')
  .filter((ruta) => ruta !== '');

const tieneNotaNueva = archivosAnadidos.some((ruta) => PATRON_DE_NOTA.test(ruta));

if (!tieneNotaNueva) {
  process.stderr.write(
    'OpenSpec Commit ha bloqueado el commit: falta la nota nueva en openspec/decisiones/<categoria>/NNN.md.\n' +
      'Formato y categorías en openspec/README.md.\n',
  );
  process.exit(1);
}
