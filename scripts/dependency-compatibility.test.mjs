import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const router = createRequire(mobile.resolve('expo-router/package.json'));
const frontend = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
const shadcn = createRequire(frontend.resolve('shadcn'));

test('shadcn registry schemas preserve component files and reject malformed items', async () => {
  const { registryItemSchema } = await import(pathToFileURL(frontend.resolve('shadcn/schema')));
  const item = { name: 'button', type: 'registry:ui', files: [
    { path: 'ui/button.tsx', type: 'registry:ui', content: 'export const label = "Tombol 😀";' },
  ] };
  const parsed = registryItemSchema.parse(item);
  assert.deepEqual(parsed.files, item.files);
  assert.equal(registryItemSchema.safeParse({ ...item, type: 'invalid' }).success, false);
  assert.equal(registryItemSchema.safeParse({ ...item, files: [{ path: 42 }] }).success, false);
});

test('shadcn MCP SDK lists, validates and calls Zod tools through its actual transport', async () => {
  const sdk = async (path) => import(pathToFileURL(shadcn.resolve(`@modelcontextprotocol/sdk/${path}.js`)));
  const [{ McpServer }, { Client }, { InMemoryTransport }] = await Promise.all([
    sdk('server/mcp'), sdk('client/index'), sdk('inMemory'),
  ]);
  const { z } = shadcn('zod');
  const server = new McpServer({ name: 'mizu-compatibility', version: '1.0.0' });
  server.registerTool('echo', { inputSchema: { text: z.string().min(1).max(40) } }, async ({ text }) => ({
    content: [{ type: 'text', text }],
  }));
  const client = new Client({ name: 'mizu-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const { tools } = await client.listTools();
    assert.equal(tools[0].inputSchema.properties.text.type, 'string');
    assert.deepEqual((await client.callTool({ name: 'echo', arguments: { text: 'Halo 😀' } })).content,
      [{ type: 'text', text: 'Halo 😀' }]);
    assert.equal((await client.callTool({ name: 'echo', arguments: { text: '' } })).isError, true);
  } finally {
    await client.close();
    await server.close();
  }
});

test('Expo query strings preserve Unicode, spaces, arrays and malformed input', () => {
  const query = router('query-string');
  assert.deepEqual({ ...query.parse('q=kopi+susu&city=Jakarta&tag=a&tag=b&emoji=%F0%9F%98%80&bad=%E0%A4%A') }, {
    q: 'kopi susu', city: 'Jakarta', tag: ['a', 'b'], emoji: '😀', bad: '%E0%A4%A',
  });
  const params = { q: 'teh & kopi', tag: ['satu', 'dua'], empty: null };
  assert.deepEqual({ ...query.parse(query.stringify(params)) }, params);
  const { getStateFromPath } = router('expo-router/build/react-navigation/core/getStateFromPath.js');
  const { getPathFromState } = router('expo-router/build/react-navigation/core/getPathFromState.js');
  const config = { screens: { Home: 'home' } };
  const state = getStateFromPath('/home?q=kopi+susu&emoji=%F0%9F%98%80', config);
  assert.equal(state.routes[0].name, 'Home');
  assert.deepEqual(state.routes[0].params, { q: 'kopi susu', emoji: '😀' });
  const roundTrip = getStateFromPath(getPathFromState(state, config), config);
  assert.deepEqual(roundTrip.routes[0].params, state.routes[0].params);
});

test('Expo malformed percent decoding finishes within a bounded subprocess', () => {
  const queryFile = router.resolve('query-string');
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const query = require(${JSON.stringify(queryFile)});
    const payload = '%FF'.repeat(2000) + '%41';
    assert.equal(query.parse('q=' + payload).q, '%FF'.repeat(2000) + 'A');
  `], { timeout: 5000, encoding: 'utf8' });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
});

test('Expo Xcode projects still generate unique uppercase 24-character IDs', () => {
  const expo = createRequire(mobile.resolve('expo/package.json'));
  const cli = createRequire(expo.resolve('@expo/cli/package.json'));
  const config = createRequire(cli.resolve('@expo/config-plugins/package.json'));
  const project = config('xcode').project('/tmp/mizu-compatibility.pbxproj');
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 100 }, () => project.generateUuid()));
  assert.equal(ids.size, 100);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
});

test('Expo dev tools validate plugin commands and their MCP parameter schemas', () => {
  const expo = createRequire(mobile.resolve('expo/package.json'));
  const cli = createRequire(expo.resolve('@expo/cli/package.json'));
  const base = pathToFileURL(cli.resolve('@expo/cli/package.json'));
  const { PluginSchema, DevToolsPluginOutputSchema } = cli(fileURLToPath(new URL('./build/src/start/server/DevToolsPlugin.schema.js', base)));
  const { createMCPDevToolsExtensionSchema } = cli(fileURLToPath(new URL('./build/src/start/server/createMCPDevToolsExtensionSchema.js', base)));
  const plugin = PluginSchema.parse({ packageName: 'mizu-tool', packageRoot: '/tmp/mizu-tool', cliExtensions: {
    description: 'Local test tool', entryPoint: 'index.js', commands: [{ name: 'inspect', title: 'Inspect',
      environments: ['cli', 'mcp'], parameters: [
        { name: 'label', type: 'text' }, { name: 'count', type: 'number' }, { name: 'confirm', type: 'confirm' },
      ],
    }],
  } });
  const schema = createMCPDevToolsExtensionSchema(plugin);
  const args = { command: 'inspect', label: 'Halo 😀', count: 2, confirm: true };
  assert.deepEqual(schema.parse(args), args);
  for (const bad of [{ command: 'invalid' }, { ...args, count: '2' }, { ...args, extra: true }]) {
    assert.equal(schema.safeParse(bad).success, false);
  }
  const output = [{ type: 'text', text: 'Selesai', level: 'info' }];
  assert.deepEqual(DevToolsPluginOutputSchema.parse(output), output);
  assert.equal(PluginSchema.safeParse({ packageName: '', packageRoot: '/tmp' }).success, false);
});

test('WhatsApp media duration still parses WAV buffers through Baileys', async () => {
  const gateway = createRequire(new URL('../services/wa-gateway/package.json', import.meta.url));
  const media = new URL('./Utils/messages-media.js', pathToFileURL(gateway.resolve('@whiskeysockets/baileys')));
  const { getAudioDuration } = await import(media.href);
  const wav = Buffer.alloc(44 + 16000);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(16000, 40);
  assert.equal(await getAudioDuration(wav), 1);
});
