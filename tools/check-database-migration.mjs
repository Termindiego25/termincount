import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const image = process.argv[2] ?? 'termincount-postgres:ci';
const legacy = 'postgres:18.6-alpine3.24';
const suffix = randomUUID().slice(0, 8);
const label = `es.diegosr.termincount.migration-test=${suffix}`;
const tempRoot = await realpath(os.tmpdir());
const directory = await mkdtemp(path.join(tempRoot, 'termincount-db-image-test-'));
const containers = [];
const volumes = [];
let network;

function docker(args, input) {
	return execFileSync('docker', args, { cwd: root, input, maxBuffer: 16 * 1024 * 1024 });
}
function text(args) { return docker(args).toString('utf8').trim(); }
function logs(id) {
	const result = spawnSync('docker', ['logs', id], { encoding: 'utf8' });
	if (result.error || result.status !== 0) throw new Error('Could not read fixture logs');
	return result.stdout + result.stderr;
}
function volume(name) {
	const result = text(['volume', 'create', '--label', label, `termincount-migration-${suffix}-${name}`]);
	volumes.push(result);
	return result;
}
function start(name, reference, data, publish = false) {
	const id = text(['run', '-d', '--name', `termincount-migration-${suffix}-${name}`, '--label', label,
		'--read-only', '--cap-drop', 'ALL', '--cap-add', 'CHOWN', '--cap-add', 'FOWNER',
		'--cap-add', 'DAC_OVERRIDE', '--cap-add', 'SETUID', '--cap-add', 'SETGID',
		'--security-opt', 'no-new-privileges:true', '--network', publish ? network : 'none',
		'--tmpfs', '/tmp', '--tmpfs', '/var/run/postgresql:uid=70,gid=70,mode=3775',
		'--mount', `type=volume,source=${data},target=/var/lib/postgresql`,
		'--mount', `type=bind,source=${directory},target=/run/secrets,readonly`,
		'-e', 'POSTGRES_USER_FILE=/run/secrets/user', '-e', 'POSTGRES_DB_FILE=/run/secrets/database',
		'-e', 'POSTGRES_PASSWORD_FILE=/run/secrets/password',
		...(publish ? ['-p', '127.0.0.1::5432'] : []), reference]);
	assert.match(id, /^[a-f0-9]{64}$/);
	containers.push(id);
	return id;
}
async function ready(id) {
	for (let i = 0; i < 60; i++) {
		try {
			assert.match(text(['exec', id, 'sh', '-c', 'grep "^Uid:" /proc/1/status']), /70\s+70\s+70\s+70/);
			docker(['exec', id, 'pg_isready', '-U', 'termincount', '-d', 'termincount']);
			assert.equal(sql(id, 'SELECT 1'), '1');
			return;
		} catch {
			if (text(['inspect', id, '--format', '{{.State.Status}}']) === 'exited') break;
			await new Promise((resolve) => setTimeout(resolve, 1_000));
		}
	}
	throw new Error(`Database fixture did not start: ${logs(id)}`);
}
function sql(id, statement) {
	return text(['exec', id, 'psql', '-U', 'termincount', '-d', 'termincount', '-v', 'ON_ERROR_STOP=1', '-Atc', statement]);
}

try {
	await writeFile(path.join(directory, 'user'), 'termincount\n');
	await writeFile(path.join(directory, 'database'), 'termincount\n');
	await writeFile(path.join(directory, 'password'), 'migration-fixture-only\n');
	network = text(['network', 'create', '--label', label, `termincount-migration-${suffix}`]);
	const originalVolume = volume('legacy');
	const restoredVolume = volume('restored');
	const source = start('source', legacy, originalVolume);
	await ready(source);
	sql(source, `CREATE TABLE migration_fixture (
		id bigserial PRIMARY KEY, poll_id text NOT NULL, owner_hash text NOT NULL,
		label text NOT NULL, votes jsonb NOT NULL, expires_at timestamptz NOT NULL, xml_value xml);
		CREATE INDEX fixture_labels ON migration_fixture(label);
		INSERT INTO migration_fixture(poll_id, owner_hash, label, votes, expires_at, xml_value)
		VALUES ('owned-fixture-poll', 'fixture-owner-hash', U&'Espa\\00F1ol', '[2,1,0]',
		'2030-01-01T12:00:00Z', XMLPARSE(DOCUMENT '<fixture>ok</fixture>'));`);
	const snapshot = sql(source, 'SELECT row_to_json(f)::text FROM migration_fixture f ORDER BY id');
	const dump = docker(['exec', source, 'pg_dump', '-U', 'termincount', '-d', 'termincount', '-Fc']);
	assert.ok(dump.length > 0);
	docker(['stop', '--time', '30', source]);
	const refused = start('guard', image, originalVolume);
	assert.equal(text(['wait', refused]), '1');
	assert.match(logs(refused), /verified dump\/restore/);
	// Prove the guard did not alter the old cluster or its fixture data.
	docker(['start', source]);
	await ready(source);
	assert.equal(sql(source, 'SELECT row_to_json(f)::text FROM migration_fixture f ORDER BY id'), snapshot);
	docker(['stop', '--time', '30', source]);
	const target = start('target', image, restoredVolume, true);
	await ready(target);
	docker(['exec', '-i', target, 'pg_restore', '-U', 'termincount', '-d', 'termincount',
		'--no-owner', '--no-privileges', '--exit-on-error'], dump);
	assert.equal(sql(target, 'SELECT row_to_json(f)::text FROM migration_fixture f ORDER BY id'), snapshot);
	assert.equal(sql(target, "SELECT (xpath('/fixture/text()', xml_value))[1]::text FROM migration_fixture"), 'ok');
	assert.equal(sql(target, "INSERT INTO migration_fixture(poll_id,owner_hash,label,votes,expires_at) VALUES ('second','owner','test','[0]',now()) RETURNING id").split('\n')[0], '2');
	assert.match(sql(target, 'SELECT version()'), /PostgreSQL 18\.6/);
	assert.match(text(['exec', target, 'sh', '-c', 'grep "^Uid:" /proc/1/status']), /70\s+70\s+70\s+70/);
	docker(['restart', '--time', '30', target]);
	await ready(target);
	assert.equal(sql(target, 'SELECT count(*) FROM migration_fixture'), '2');
	const inspect = JSON.parse(text(['inspect', target]))[0];
	const port = inspect.NetworkSettings.Ports['5432/tcp'][0].HostPort;
	execFileSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test'], {
		cwd: root, stdio: 'inherit', env: { ...process.env,
			PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`,
			DATABASE_URL: `postgres://termincount:migration-fixture-only@127.0.0.1:${port}/termincount` }
	});
	console.log('Database image migration passed: Secrets, untouched legacy cluster, logical restore, XML, identities, restart and browser/API tests.');
} finally {
	for (const id of containers.reverse()) {
		try { docker(['rm', '-f', id]); } catch (error) { console.error('Could not remove owned fixture', id, error.message); }
	}
	for (const name of volumes) {
		try { docker(['volume', 'rm', name]); } catch (error) { console.error('Could not remove owned test volume', name, error.message); }
	}
	if (network) { try { docker(['network', 'rm', network]); } catch (error) { console.error(error.message); } }
	if (path.dirname(await realpath(directory)) !== tempRoot) throw new Error('Unsafe fixture cleanup path');
	await rm(directory, { recursive: true, force: true });
}
