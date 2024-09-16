# package-version-compat
package-version-compat 是一个命令行工具，用于根据指定的 Node.js 版本查找 npm 依赖项的兼容版本范围。

[English](https://github.com/wopelo/package-version-compat/blob/main/README.md)

## 安装
```bash
npm install -g package-version-compat
```

## 使用

### pvc

```bash
pvc
```

默认情况下，执行上述命令 package-version-compat 将会读取当前环境 Node.js 版本、当前 npm 源地址、从命令执行的根路径中寻找 package.json，并读取 dependencies 和 devDependencies。
package-version-compat 会从 npm 源中查找与当前 Node.js 版本兼容的依赖项版本范围，并将范围内的最新版本更新到 package.json 中。

举个例子，假设当前 Node.js 版本是 16.20.2，package.json中内容如下：

```json
"dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
},
"devDependencies": {
    "typescript": "^5.6.2"
}
```

当执行 ```pvc``` 命令后，package-version-compat 将会找出 Node.js v16.20.2 下，react 适配的版本区间是 >=0.1.2 <=18.3.1，react-dom 的版本区间是 >=0.1.0 <=18.1.0，typescript 的版本区间是 >=0.8.0 <=5.6.2。最终会更新package.json如下：

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

deps 参数用于设置将要查找的 dependencies。当设置 deps 参数后，package-version-compat 不会从 package.json 中读取 dependencies 和 devDependencies。当命令执行完成后，适配当前 Node.js 的版本将会更新到 package.json 中。

### --dev-deps

```bash
pvc --dev-deps typescript eslint
```

deps 参数用于设置将要查找的 devDependencies。当设置 dev-deps 参数后，package-version-compat 不会从 package.json 中读取 dependencies 和 devDependencies。当命令执行完成后，适配当前 Node.js 的版本将会更新到 package.json 中。

### --node

```bash
pvc --deps react react-dom --node 14.13.0
```

node 参数用于指定 Node.js 版本。

### --all-version

```bash
pvc --deps react react-dom --all-version
```

默认情况下，package-version-compat 只会查找依赖的正式版本，诸如 beta 版本、alpha 版本等将会被忽略。可以设置 all-version 参数用于设置查找依赖的所有版本。

### --view

```bash
pvc --deps react react-dom --view
```

默认情况下，package-version-compat 会修改 package.json 中依赖的版本号。如果仅想查看与 Node.js 版本依赖的版本区间，可以使用 view 参数。此时版本区间范围将会被打印到终端，package.json文件不会被修改。