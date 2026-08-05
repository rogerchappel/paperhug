import process from 'node:process';

export function versionFromTag(tag) {
  const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag ?? '');
  if (!match) throw new Error(`Release tag must be v<semver>; received ${tag || '<empty>'}`);
  return match[1];
}

export function assertTagMatchesVersion(tag, packageVersion) {
  const tagVersion = versionFromTag(tag);
  if (tagVersion !== packageVersion) throw new Error(`Tag ${tag} does not match package version ${packageVersion}`);
  return tagVersion;
}

export function isAlreadyPublished(output, packageVersion) {
  const versions = JSON.parse(output || '[]');
  return Array.isArray(versions) && versions.includes(packageVersion);
}

export function assertRegistryMetadata(output, packageVersion) {
  const metadata = JSON.parse(output || '{}');
  if (metadata.version !== packageVersion) {
    throw new Error(`npm returned version ${metadata.version || '<missing>'}; expected ${packageVersion}`);
  }
  if (typeof metadata.dist?.integrity !== 'string' || metadata.dist.integrity.length === 0) {
    throw new Error(`npm did not return dist.integrity for paperhug@${packageVersion}`);
  }
  return metadata;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'verify-tag') {
    assertTagMatchesVersion(args[0], args[1]);
    console.log(`Verified release tag ${args[0]} for package version ${args[1]}.`);
    return;
  }
  if (command === 'is-published') {
    process.exitCode = isAlreadyPublished(args[0], args[1]) ? 0 : 1;
    return;
  }
  if (command === 'verify-registry') {
    assertRegistryMetadata(args[0], args[1]);
    console.log(`Verified paperhug@${args[1]} registry version and integrity.`);
    return;
  }
  throw new Error('Usage: release-package.mjs <verify-tag TAG VERSION|is-published VERSIONS_JSON VERSION|verify-registry METADATA_JSON VERSION>');
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
