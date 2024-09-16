#!/usr/bin/env node
const {
    parseArgs,
    formatArgsObj,
    getCurrentNodeVersion,
    getCurrentRegistry,
    findDepsVersion,
    insertDeps,
} = require('./utils');

//  Support parameters: --deps --dev-deps --all-version --view --node
(async function () {
    var nodeVersion, deps = [], devDeps = [], currentRegistry;
    var argsObj = parseArgs(process.argv);

    console.log('argsObj', argsObj);

    try {
        formatArgsObj(argsObj);
    } catch (e) {
        console.error(e);

        return;
    }

    nodeVersion = argsObj.node || getCurrentNodeVersion();
    deps = typeof argsObj.deps === 'string' ? [argsObj.deps] : argsObj.deps;
    devDeps = typeof argsObj['dev-deps'] === 'string' ? [argsObj['dev-deps']] : argsObj['dev-deps'];

    try {
        currentRegistry = getCurrentRegistry();
    } catch (e) {
        console.error('Failed to get npm registry', e);

        return;
    }

    console.log({ nodeVersion, currentRegistry, argsObj });

    const versionMap = await findDepsVersion(nodeVersion, currentRegistry, argsObj);

    // console.log('versionMap', versionMap);

    if (!argsObj['view']) insertDeps(versionMap, argsObj);
})();