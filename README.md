# package-version-compat
package-version-compat is a command-line tool that finds the compatible version range of npm dependencies based on the specified version of Node.js.

[简体中文](https://github.com/wopelo/package-version-compat/blob/main/README.zh-CN.md)

## Install
```bash
npm install -g package-version-compat
```

## Usage

### pvc

```bash
pvc
```

By default, executing this command will cause package-version-compat to read the current Node version and the current npm registry URL, and attempt to read dependencies and devDependencies from the package.json file in the root path where the command is executed.
Package-version-compat will then find the version ranges of dependencies and devDependencies that are compatible with the current Node environment from the npm registry, and update the package.json with the latest versions within those ranges.

For example, assuming the current Node version is 16.20.2, the package.json is as follows:

```json
"dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
},
"devDependencies": {
    "typescript": "^5.6.2"
}
```

After executing the pvc command, package-version-compat will find that under Node.js v16.20.2, the compatible version range for react is >=0.1.2 <=18.3.1, for react-dom is >=0.1.0 <=18.1.0, and for typescript is >=0.8.0 <=5.6.2. The package.json will be updated as follows:

```json
"dependencies": {
    "react": "18.3.1",
    "react-dom": "18.1.0"
},
"devDependencies": {
    "typescript": "5.6.2"
}
```

### --deps

```bash
pvc --deps react react-dom
```

The deps parameter is used to specify the dependencies to be searched. When the deps parameter is present, package-version-compat will not retrieve dependencies and devDependencies from the package.json file. After the command is executed, the dependency versions will be updated in the package.json file.

### --dev-deps

```bash
pvc --dev-deps typescript eslint
```

The dev-deps parameter is used to specify the devDependencies to be searched. When the dev-deps parameter is present, package-version-compat will not retrieve dependencies and devDependencies from the package.json file. After the command is executed, the dependency versions will be updated in the package.json file.

### --node

```bash
pvc --deps react react-dom --node 14.13.0
```

The node parameter is used to specify the Node version to be adapted.

### --all-version

```bash
pvc --deps react react-dom --all-version
```

By default, package-version-compat will only search for stable versions of (dev)dependencies, versions such as beta and alpha are not included in the search. You can set this parameter to search for all versions of dependencies.

### --view

```bash
pvc --deps react react-dom --view
```

By default, package-version-compat will modify the version numbers of (dev)dependencies in the package.json file. If you only want to view the version ranges of (dev)dependencies that are compatible with the Node version, you can use the view parameter. In this case, the version ranges will only be printed to the terminal and the package.json file will not be modified.