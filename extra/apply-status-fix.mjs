// Adapta para o Baileys rc14 a correção de <status> da Evolution API 2.3.8.
// Falha a montagem se qualquer ponto esperado não aparecer exatamente uma vez.
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] ?? 'node_modules/baileys/lib/Socket/messages-recv.js';
let src = readFileSync(file, 'utf8');
if (src.includes('handleStatus')) throw new Error('handleStatus ja existe; revisar antes de aplicar');

function replaceOnce(regex, build) {
  const found = src.match(new RegExp(regex.source, 'g')) ?? [];
  if (found.length !== 1) throw new Error(`esperado 1 trecho para ${regex}, achei ${found.length}`);
  src = src.replace(regex, build);
}

replaceOnce(/const handleNotification = async \(node\s*\) => \{/, (m) => `const handleStatus = async (node) => {
        // a fila offline nao tem catch: um erro aqui travaria o socket
        try {
            await sendMessageAck(node);
        }
        catch (error) {
            onUnexpectedError(error, 'acking status');
        }
    };
    ${m}`);

replaceOnce(/\[\s*'notification',\s*handleNotification\s*\]/, (m) => `${m},
            ['status', handleStatus]`);

replaceOnce(/ws\.on\('CB:notification', async/, (m) => `ws.on('CB:status', async (node) => {
        await processNode('status', node, 'handling status', handleStatus);
    });
    ${m}`);

writeFileSync(file, src);
console.log('correcao de status aplicada');
