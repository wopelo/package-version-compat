const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const semver = require('semver');

/**
 * Fetches data from a given URL using the specified HTTP method.
 * @param {string} url - The URL to fetch data from.
 * @param {string} [method='GET'] - The HTTP method to use.
 * @returns {Promise<Object>} A promise that resolves to the fetched data as a JSON object.
 */
function fetch(url, method) {
    const options = {
        method: method || 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const httpModule = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        const req = httpModule.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonResult = JSON.parse(data);

                    resolve(jsonResult);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

/**
 * Checks if a version string is in the formal version format (e.g., "1.0.0").
 * @param {string} version - The version string to check.
 * @returns {boolean} True if the version string is in the formal version format, false otherwise.
 */
function isFormalVersion(version) {
    const regex = /^\d+\.\d+\.\d+$/;
    return regex.test(version);
}

/**
 * Checks if a value is a string or an array.
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is a string or an array, false otherwise.
 */
exports.isStringOrArray = (value) => {
    return typeof value === 'string' || Array.isArray(value);
}

/**
 * Fetches package information from the npm registry.
 * @param {string} packageName - The name of the package to fetch information for.
 * @param {string} currentRegistry - The current npm registry URL.
 * @returns {Promise<Object|null>} A promise that resolves to the package information, or null if an error occurs.
 */
exports.getPackageInfo = async (packageName, currentRegistry) => {
    const url = currentRegistry.endsWith('/') ? `${currentRegistry}${packageName}` : `${currentRegistry}/${packageName}`;

    try {
        const packageInfo = await fetch(url);

        return packageInfo;
    } catch (error) {
        console.error(`Error fetching ${packageName} info:`, error);

        throw error;
    }
}

/**
 * Creates a map of package versions to their Node.js engine requirements.
 * @param {Object} packageInfo - The package information object.
 * @param {Object} argsObj - The arguments object containing dependencies.
 * @returns {Object} A map of package versions to their Node.js engine requirements.
 */
exports.getVersionNodeEngineMap = (packageInfo, argsObj) => {
    const versionNodeEngineMap = {};

    if (!packageInfo.versions) return versionNodeEngineMap;

    const versions = packageInfo.versions;

    Object.keys(versions).forEach((version) => {
        if (!argsObj['all-version'] && !isFormalVersion(version)) return;

        const versionInfo = versions[version];
        const engines = versionInfo.engines;
        const _nodeVersion = versionInfo._nodeVersion;
        const _npmVersion = versionInfo._npmVersion;

        const info = {
            enginesNode: engines && engines.node,
            _nodeVersion,
            _npmVersion,
        }

        if (engines && engines.node) {
            // if has engines.node, use it
            versionNodeEngineMap[version] = {
                value: engines.node,
                from: 'engines.node',
                info,
            };
        } else if (_nodeVersion) {
            // no engines.node, but has _nodeVersion, use _nodeVersion
            versionNodeEngineMap[version] = {
                value: `>=${_nodeVersion}`,
                from: '_nodeVersion',
                info,
            };
        } else {
            versionNodeEngineMap[version] = {
                value: '*',
                from: 'default',
                info,
            }
        }
    });

    return versionNodeEngineMap;
}

/**
 * Finds the version ranges of a package that are compatible with a given Node.js version.
 * @param {Object} versionNodeEngineMap - A map of package versions to their Node.js engine requirements.
 * @param {string} targetNodeVersion - The target Node.js version.
 * @returns {Array<Array<string>>} An array of version ranges that are compatible with the target Node.js version.
 */
exports.findPackageVersionRange = (versionNodeEngineMap, targetNodeVersion) => {
    let versionMap = Object.keys(versionNodeEngineMap);
    versionMap.sort(semver.compare);

    let compatibleVersions = [[]];

    versionMap.forEach((version) => {
        const nodeVersionRange = versionNodeEngineMap[version].value;

        if (semver.satisfies(targetNodeVersion, nodeVersionRange)) {
            if (compatibleVersions[compatibleVersions.length - 1].length === 0) {
                compatibleVersions[compatibleVersions.length - 1].push(version);
            } else if (compatibleVersions[compatibleVersions.length - 1].length === 1) {
                compatibleVersions[compatibleVersions.length - 1].push(version);
            } else {
                compatibleVersions[compatibleVersions.length - 1][1] = version;
            }
        } else {
            if (compatibleVersions[compatibleVersions.length - 1].length) compatibleVersions.push([]);
        }
    });

    if (compatibleVersions.length === 0) {
        return [];
    }

    compatibleVersions = compatibleVersions.filter((subArray) => subArray.length > 0);

    return compatibleVersions;
}

/**
 * Reads the package.json file from the current working directory.
 * @returns {Object} The parsed package.json object.
 * @throws {Error} If the package.json file does not exist.
 */
exports.readPacakgeJson = () => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`${packageJsonPath} does not exist`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return packageJson;
}

/**
 * Writes the given package.json object to the package.json file in the current working directory.
 * @param {Object} packageJson - The package.json object to write.
 */
exports.writePackageJson = (packageJson) => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}