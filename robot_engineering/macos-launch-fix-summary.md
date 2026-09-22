# Serial Studio macOS 启动问题修复总结

## 背景

环境：

- 项目目录：`/Users/kyoko/tool/Serial-Studio-4.0.1`
- App 路径：`build/app/Serial-Studio-GPL3.app`
- 系统：Apple Silicon macOS
- 版本：Serial Studio GPL3 `4.0.1`

正常启动命令：

```bash
open /Users/kyoko/tool/Serial-Studio-4.0.1/build/app/Serial-Studio-GPL3.app
```

## 最初现象

启动时出现过以下问题：

```text
Class ... is implemented in both .../Serial-Studio-GPL3.app/.../QtCore
and /opt/homebrew/Cellar/qtbase/6.11.1/.../QtCore
```

```text
module "QtCore" is not installed
```

```text
SIGKILL (Code Signature Invalid)
Termination Reason: Namespace CODESIGNING, Code 2, Invalid Page
```

后续还出现过：

```text
No functional TLS backend was found
No TLS backend is available
QSslSocket::connectToHostEncrypted: TLS initialization failed
```

## 根因

主要有三类问题叠加：

1. `Contents/Resources/qml` 中的 QML 模块曾指向 Homebrew Qt，导致 app 同时加载包内 Qt 和 `/opt/homebrew` Qt。
2. 一些 app 内部库仍引用 `/opt/homebrew/...` 的 Qt 或第三方库，导致运行时混用外部依赖。
3. QML 插件位于 `Contents/Resources/qml`，`codesign --deep` 没有可靠地覆盖这些 `.dylib`，运行时加载时触发 `Code Signature Invalid`。

TLS 警告的直接原因是：

为了绕过早期 TLS 插件触发的签名崩溃，`Contents/PlugIns/tls` 曾被移到 `Contents/DisabledPlugIns/tls-active-disabled`，导致 Qt 找不到 TLS 后端。

## 已做修复

### 1. 修复 QML 模块来源

将 `Contents/Resources/qml` 下指向 Homebrew 的符号链接替换为真实文件。

验证：

```bash
find build/app/Serial-Studio-GPL3.app/Contents/Resources/qml -type l -print
```

结果为空，表示没有残留 symlink。

### 2. 修复 Homebrew 依赖

将 app 包内库的 `/opt/homebrew/...` 依赖改为包内依赖，例如：

```text
@rpath/QtCore.framework/Versions/A/QtCore
@rpath/libssl.3.dylib
@rpath/libcrypto.3.dylib
```

验证：

```bash
find build/app/Serial-Studio-GPL3.app -type f -exec sh -c '
for f do
  m=$(otool -L "$f" 2>/dev/null | rg "/opt/homebrew" || true)
  if [ -n "$m" ]; then
    printf "%s\n%s\n" "$f" "$m"
  fi
done
' sh {} +
```

结果为空，表示没有发现 `/opt/homebrew` 动态库引用。

### 3. 显式签名 QML 插件

QML 插件需要单独签名：

```bash
find build/app/Serial-Studio-GPL3.app/Contents/Resources/qml \
  -type f -name '*.dylib' \
  -exec codesign --force --sign - {} +
```

然后重新签整个 app：

```bash
codesign --force --deep --sign - build/app/Serial-Studio-GPL3.app
```

验证：

```bash
codesign --verify --deep --strict --verbose=2 \
  build/app/Serial-Studio-GPL3.app
```

结果：

```text
build/app/Serial-Studio-GPL3.app: valid on disk
build/app/Serial-Studio-GPL3.app: satisfies its Designated Requirement
```

### 4. 恢复 TLS 后端

恢复以下插件到：

```text
build/app/Serial-Studio-GPL3.app/Contents/PlugIns/tls/
```

插件：

```text
libqsecuretransportbackend.dylib
libqopensslbackend.dylib
```

恢复后重新签名：

```bash
codesign --force --sign - \
  build/app/Serial-Studio-GPL3.app/Contents/PlugIns/tls/libqsecuretransportbackend.dylib \
  build/app/Serial-Studio-GPL3.app/Contents/PlugIns/tls/libqopensslbackend.dylib

codesign --force --deep --sign - build/app/Serial-Studio-GPL3.app
```

没有恢复：

```text
Contents/DisabledPlugIns/tls/libqcertonlybackend.dylib.disabled
```

保留它禁用，避免 Qt 扫描非标准扩展时再次引发问题。

## 最终验证

启动验证：

```bash
open /Users/kyoko/tool/Serial-Studio-4.0.1/build/app/Serial-Studio-GPL3.app
```

进程仍在运行：

```text
.../Serial-Studio-GPL3.app/Contents/MacOS/Serial-Studio-GPL3
```

日志中未再出现以下关键错误：

```text
No functional TLS backend
No TLS backend
QSslSocket::connectToHostEncrypted
Code Signature Invalid
module "QtCore" is not installed
implemented in both
Critical QML error
QQmlApplicationEngine failed
```

## 注意事项

如果之后重新构建 app、重新运行 `macdeployqt`，或者覆盖 `build/app/Serial-Studio-GPL3.app`，这些修复可能会被覆盖，需要重新检查：

1. `Contents/Resources/qml` 是否还有 symlink。
2. `otool -L` 是否还有 `/opt/homebrew` 依赖。
3. QML 插件 `.dylib` 是否已经显式签名。
4. `Contents/PlugIns/tls` 是否存在两个 TLS 后端插件。
5. `codesign --verify --deep --strict` 是否通过。

建议最终把这些步骤固化到 macOS 打包脚本中，而不是只修 build 产物。
