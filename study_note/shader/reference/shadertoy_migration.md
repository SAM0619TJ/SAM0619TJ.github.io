# Shadertoy → glslViewer 移植指南

> 把 Shadertoy 上的炫酷 shader 搬到你本地 glslViewer 跑的完整对照。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 入口函数替换

| Shadertoy | glslViewer |
|-----------|------------|
| `void mainImage(out vec4 fragColor, in vec2 fragCoord)` | `void main()` |
| `fragColor = ...` | `gl_FragColor = ...` |
| `fragCoord` | `gl_FragCoord` |

### 改装模板

```glsl
// Shadertoy 原版:
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = vec3(uv, 0.0);
    fragColor = vec4(col, 1.0);
}

// glslViewer 改装后:
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 col = vec3(uv, 0.0);
    gl_FragColor = vec4(col, 1.0);
}
```

---

## 2. Uniform 对照表

| Shadertoy | glslViewer | 类型 | 说明 |
|-----------|------------|------|------|
| `iResolution` | `u_resolution` | `vec2` | 窗口分辨率 |
| `iTime` | `u_time` | `float` | 运行时间(秒) |
| `iMouse` | `u_mouse` | `vec2` | 鼠标位置(像素) |
| `iFrame` | — | 无直接替代 | 帧计数，可用 `u_time` 推算 |
| `iChannel0..3` | — | 无直接替代 | 纹理输入 |

**没有 `iChannel` 怎么处理？** 见第 6 节。

---

## 3. 版本与精度声明

Shadertoy 使用 `#version 300 es`（WebGL 2），glslViewer 用 desktop GLSL 或 GLSL ES。

```glsl
// glslViewer 标准头（务必加上）
#ifdef GL_ES
precision mediump float;
#endif
```

**注意**：不要手动写 `#version`，glslViewer 会自动处理。

---

## 4. 常见语法差异

| Shadertoy | glslViewer (GLSL ES) | 说明 |
|-----------|---------------------|------|
| `mat2(a,b,c,d)` | ✅ 相同 | |
| `const mat2 m = mat2(...)` | ❌ 可能不支持 | 去掉 `const` |
| `texture(iChannel0, uv)` | 无纹理 | 自建噪声代替 |
| `fragColor.rgb` | `gl_FragColor.rgb` | |
| `int` 循环 | `for (int i = 0; ...)` | ✅ 相同 |

---

## 5. 编译错误速查

| 错误信息 | 原因 | 解决 |
|----------|------|------|
| `'precision' : syntax error` | 缺少 `#ifdef GL_ES` | 加上标准头 |
| `Missing return for function` | 函数体为空 `{ /* ... */ }` | 补全实现 |
| `'const' : cannot initialize` | `const mat2` 用构造函数初始化 | 去掉 `const` |
| `malloc: pointer being freed` | glslViewer 的 bug（非 shader 错误） | 移除未使用的 uniform / 重装 glslViewer |
| `array index out of bounds` | 数组越界 | 检查循环边界 |
| `'texture' : no matching overloaded function` | 用了不存在纹理的 `texture()` | 替换为纯色或噪声 |

---

## 6. 无纹理替代方案

### 6.1 用噪声代替

```glsl
// 原版 Shadertoy 用纹理做噪声
// iChannel0 = 噪声纹理
float n = texture(iChannel0, uv).r;

// glslViewer → 自建噪声函数
float n = noise(uv);  // 你的 noise() 函数
```

### 6.2 用纯色代替

```glsl
// 如果纹理只用来取颜色 → 直接用 vec3
vec3 bg = vec3(0.1, 0.2, 0.4);
```

### 6.3 用数学图案代替

```glsl
// 原版 iChannel0 是一张渐变图
// → 用 mix / smoothstep 生成
float gradient = smoothstep(0.3, 0.7, uv.y);
```

---

## 7. iMouse 处理

Shadertoy 的 `iMouse` 是 `vec4`：`(x, y, 按下时的x, 按下时的y)`。

glslViewer 的 `u_mouse` 是 `vec2`：当前鼠标位置（归一化或像素坐标取决于版本）。

```glsl
// Shadertoy
float click = iMouse.z > 0.0 ? 1.0 : 0.0;
vec2 mouseUV = iMouse.xy / iResolution.xy;

// glslViewer
uniform vec2 u_mouse; // 声明即可（不一定需要用到）
float click = length(u_mouse) > 0.0 ? 1.0 : 0.0;
```

---

## 8. 时间与循环

Shadertoy 没有帧率上限意识；glslViewer 也一样。但避免：

```glsl
// ❌ 危险：在移动端/es精度下可能溢出
for (int i = 0; i < 200; i++) { ... }

// ✅ 安全
#define MAX_ITER 64
for (int i = 0; i < MAX_ITER; i++) { ... }
```

---

## 9. 完整移植示例

以一个 Shadertoy 热门效果为例：

```glsl
// ===== 原 Shadertoy 代码 =====
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float mask = 1.0 - smoothstep(0.3, 0.31, d);
    vec3 col = vec3(mask) * vec3(0.2, 0.6, 1.0);
    fragColor = vec4(col, 1.0);
}

// ===== glslViewer 移植版 =====
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float d = length(uv);
    float mask = 1.0 - smoothstep(0.3, 0.31, d);
    vec3 col = vec3(mask) * vec3(0.2, 0.6, 1.0);
    gl_FragColor = vec4(col, 1.0);
}
```

---

## 10. 一键替换脚本（用于参考）

```
iResolution   →  u_resolution
iTime         →  u_time
iMouse.xy     →  u_mouse
iMouse.z      →  0.0 (或保留 click 逻辑)
fragColor     →  gl_FragColor
fragCoord     →  gl_FragCoord
mainImage     →  main
texture(      →  手动替换为噪声/纯色
```

---

## 关联知识

- [管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md) — 移植到 Vulkan 的下一步
- [Uniform 与纹理](md.html?file=study_note/shader/bridge/uniforms_and_textures.md)
- [Vulkan 引擎地图](md.html?file=study_note/shader/bridge/vulkan_engine_map.md)

*最后更新：2026-06-03*
