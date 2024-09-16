const { execSync } = require('child_process');

const {
    isStringOrArray,
    getPackageInfo,
    getVersionNodeEngineMap,
    findPackageVersionRange,
    readPacakgeJson,
    writePackageJson,
} = require('./helper');

/**
 * Parses command line arguments into an object.
 * @param {string[]} argv - The command line arguments.
 * @returns {Object} The parsed arguments as key-value pairs.
 */
exports.parseArgs = (argv) => {
    const args = {};
    let currentKey = null;

    for (let i = 2; i < argv.length; i++) {
        if (argv[i].startsWith('--')) {
            currentKey = argv[i].substring(2);

            if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
                args[currentKey] = argv[i + 1];
                i++;
            } else {
                args[currentKey] = true;
            }
        } else if (currentKey) {
            if (Array.isArray(args[currentKey])) {
                args[currentKey].push(argv[i]);
            } else if (typeof args[currentKey] === 'string') {
                args[currentKey] = [args[currentKey], argv[i]];
            } else {
                args[currentKey] = [argv[i]];
            }
        }
    }

    return args;
}

/**
 * Formats the arguments object to ensure 'deps' and 'dev-deps' are arrays.
 * If 'deps' or 'dev-deps' are missing, it reads from package.json.
 * @param {Object} argsObj - The arguments object to format.
 */
exports.formatArgsObj = (argsObj) => {
    if (!argsObj.deps || !isStringOrArray(argsObj.deps)) {
        console.warn('Missing --deps or --dev-deps parameter, will use package.json dependencies/devDependencies');

        const packageJson = readPacakgeJson();

        if (packageJson.dependencies) {
            argsObj.deps = Object.keys(packageJson.dependencies);
        } else {
            argsObj.deps = [];
        }

        if (packageJson.devDependencies) {
            argsObj['dev-deps'] = Object.keys(packageJson.devDependencies);
        } else {
            argsObj['dev-deps'] = [];
        }
    }

    argsObj.deps = typeof argsObj.deps === 'string' ? [argsObj.deps] : argsObj.deps;
    argsObj.devDeps = typeof argsObj['dev-deps'] === 'string' ? [argsObj['dev-deps']] : argsObj['dev-deps'];
}

/**
 * Gets the current Node.js version.
 * @returns {string} The current Node.js version.
 */
exports.getCurrentNodeVersion = () => {
    return process.version.match(/^v(\d+\.\d+\.\d+)$/)[1];
}

/**
 * Gets the current npm registry URL.
 * @returns {string} The current npm registry URL.
 */
exports.getCurrentRegistry = () => {
    const registry = execSync('npm config get registry', { encoding: 'utf8' }).trim();

    return registry;
}

/**
 * Finds the version ranges of dependency that are compatible with the given Node.js version.
 * @param {string} dep - The dependency to find the version range for.
 * @param {string} nodeVersion - The current Node.js version.
 * @param {string} currentRegistry - The current npm registry URL.
 * @param {Object} argsObj - The arguments object.
 * @returns {Promise<Object>} A promise that resolves to an object mapping dependencies to their version ranges.
 */
async function findDepVersion(dep, nodeVersion, currentRegistry, argsObj) {
    try {
        const depInfo = await getPackageInfo(dep, currentRegistry);

        if (!depInfo) return;

        const versionNodeEngineMap = getVersionNodeEngineMap(depInfo, argsObj);

        // console.log('versionNodeEngineMap', versionNodeEngineMap);
        // console.log('versions', Object.keys(versionNodeEngineMap));

        const result = findPackageVersionRange(versionNodeEngineMap, nodeVersion);

        const transformedArray = result.map((subArray) => `>=${subArray[0]} <=${subArray[1]}`);
        console.log(`${dep} range is: `, transformedArray.join(' || '));

        return result;
    } catch (error) {
        console.error(`Error getting package info for ${dep}:`, error);
    }
}

/**
 * Finds the version ranges of dependencies that are compatible with the given Node.js version.
 * @param {string} nodeVersion - The current Node.js version.
 * @param {string} currentRegistry - The current npm registry URL.
 * @param {Object} argsObj - The arguments object.
 * @returns {Promise<Object>} A promise that resolves to an object mapping dependencies to their version ranges.
 */
exports.findDepsVersion = async (nodeVersion, currentRegistry, argsObj) => {
    const allDeps = [...argsObj.deps, ...argsObj.devDeps];
    const promiseArr = [];

    allDeps.forEach((dep) => {
        promiseArr.push(findDepVersion(dep, nodeVersion, currentRegistry, argsObj));
    });

    const depsRanges = await Promise.all(promiseArr);
    const result = {};

    allDeps.forEach((dep, index) => {
        const depRange = depsRanges[index];
        const latestRange = depRange[depRange.length - 1];

        result[dep] = latestRange[latestRange.length - 1];
    });

    return result;
}

/**
 * Inserts the determined dependency versions into package.json.
 * @param {Object} versionMap - An object mapping dependencies to their version ranges.
 * @param {Object} argsObj - The arguments object.
 */
exports.insertDeps = (versionMap, argsObj) => {
    const packageJson = readPacakgeJson();

    argsObj.deps.forEach((dep) => {
        if (versionMap[dep]) {
            packageJson.dependencies[dep] = versionMap[dep];
        }
    });

    argsObj.devDeps.forEach((dep) => {
        if (versionMap[dep]) {
            packageJson.devDependencies[dep] = versionMap[dep];
        }
    });

    // console.log('packageJson', packageJson);

    writePackageJson(packageJson);
}
