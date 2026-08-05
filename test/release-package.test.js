import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertRegistryMetadata,
  assertTagMatchesVersion,
  isAlreadyPublished,
  versionFromTag,
} from '../scripts/release-package.mjs';

test('release tags contain an exact semver package version', () => {
  assert.equal(versionFromTag('v1.2.3'), '1.2.3');
  assert.equal(versionFromTag('v1.2.3-beta.1'), '1.2.3-beta.1');
  assert.throws(() => versionFromTag('release-1.2.3'), /must be v<semver>/);
  assert.throws(() => assertTagMatchesVersion('v1.2.4', '1.2.3'), /does not match/);
});

test('publish guard recognizes only an exact published version', () => {
  assert.equal(isAlreadyPublished('["0.1.0","0.2.0"]', '0.2.0'), true);
  assert.equal(isAlreadyPublished('["0.1.0","0.2.0"]', '0.2.1'), false);
  assert.equal(isAlreadyPublished('"0.2.0"', '0.2.0'), false);
});

test('registry verification requires the exact version and integrity', () => {
  const metadata = '{"version":"0.1.0","dist":{"integrity":"sha512-example"}}';
  assert.equal(assertRegistryMetadata(metadata, '0.1.0').dist.integrity, 'sha512-example');
  assert.throws(() => assertRegistryMetadata(metadata, '0.1.1'), /expected 0\.1\.1/);
  assert.throws(() => assertRegistryMetadata('{"version":"0.1.0","dist":{}}', '0.1.0'), /dist\.integrity/);
});
