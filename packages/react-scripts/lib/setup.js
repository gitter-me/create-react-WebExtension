'use strict';

const fs = require('fs-extra');
const path = require('path');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const { loadBundles } = require('./bundle');

const processPublicFolder = appPaths => {
  fs.copySync(appPaths.appPublic, appPaths.appBuild, {
    dereference: true,
  });

  if (process.env.NODE_ENV === 'development') {
    setupHotReloadSupport(appPaths);
  }
};

const setupHotReloadSupport = appPaths => {
  if (process.env.NODE_ENV !== 'development') {
    throw 'Hot module reload is only supported in development.';
  }

  // Copy over hot update service script to the build dir.
  const bgScriptRelPath = 'js/hot-update-runtime.js';
  const bgScript = require.resolve('./hot-update/background-runtime');
  const bgScriptInBuild = path.join(appPaths.appBuild, bgScriptRelPath);
  fs.copySync(bgScript, bgScriptInBuild);

  // Add hot reload scripts to the manifest file.
  const manifestInBuild = path.join(appPaths.appBuild, 'manifest.json');
  // We're requiring a json file, so make sure we don't get a cached version.
  delete require.cache[require.resolve(appPaths.appManifest)];
  const manifest = require(appPaths.appManifest);
  fs.writeFileSync(
    manifestInBuild,
    JSON.stringify(
      injectHotUpdateSupportIntoManifest(manifest, bgScriptRelPath),
      null,
      2
    )
  );
};

const injectHotUpdateSupportIntoManifest = (manifest, bgScriptRelPath) => {
  // Make sure the 'background' entry exists in the manifest.
  manifest.background = manifest.background || {};
  manifest.background.scripts = manifest.background.scripts || [];
  // Add our hot update script.
  manifest.background.scripts.push(bgScriptRelPath);
  return manifest;
};

const setupBuild = appPaths => {
  // Warn and crash if required files are missing.
  if (!checkRequiredFiles([appPaths.appManifest])) {
    process.exit(1);
  }

  fs.emptyDirSync(appPaths.appBuild);
  processPublicFolder(appPaths);
  return loadBundles(appPaths);
};

module.exports = {
  setupBuild,
  processPublicFolder,
};
