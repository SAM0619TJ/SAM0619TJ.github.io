# Uniform 与纹理：iChannel 在引擎里是什么

> **一句话**：Shadertoy 的 `iTime`、`iResolution`、`iChannel0` 在引擎里分别是 uniform buffer 和 sampler；艺术逻辑不变，传参方式变。
>
> 关键词：`uniform` `UBO` `descriptor` `iChannel` `sampler` `Vulkan`

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 速查卡

| Shadertoy | 类型 | Vulkan / GLSL 侧 |
|-----------|------|------------------|
| `iResolution` | `vec3` | UBO `vec2 resolution` + optional `pixelDensity` |
| `iTime` | `float` | UBO `float time` |
| `iTimeDelta` | `float` | UBO `float deltaTime` |
| `iFrame` | `int` | UBO `uint frame` |
| `iMouse` | `vec4` | UBO `vec4 mouse` 或 input 事件 |
| `iChannel0..3` | `sampler2D` | `combined image sampler` + `VkImageView` |
| `iChannelResolution[]` | `vec3` | 每纹理 UBO 或 push constant |

---

## 为什么需要 Uniform

Shader 是 GPU 上跑的 **静态程序**；每帧变化的数据（时间、分辨率、鼠标）必须从 CPU 传入。

Shadertoy 自动注入；引擎里你要：

1. CPU 端准备数据结构
2. 每帧写入 GPU 可见内存
3. Shader 通过 binding 读取

---

## 常见 Uniform 布局（艺术向）

```cpp
// C++ 侧（std140 对齐）
struct FrameUniforms {
    float time;
    float deltaTime;
    float _pad0[2];
    float resolution[2];  // 宽高像素
    float mouse[4];       // xy, click_xy
    uint32_t frame;
    uint32_t _pad1[3];
};
```

```glsl
// GLSL 450
layout(set = 0, binding = 0) uniform FrameData {
    float time;
    float deltaTime;
    vec2  resolution;
    vec4  mouse;
    uint  frame;
} frame;
```

使用：

```glsl
vec2 uv = gl_FragCoord.xy / frame.resolution;
float t = frame.time;
```

---

## Shadertoy → 引擎 对照示例

### iResolution

```glsl
// Shadertoy
vec2 uv = fragCoord / iResolution.xy;

// 引擎
vec2 uv = gl_FragCoord.xy / frame.resolution;
```

### iTime 动画

```glsl
// 完全相同
float wave = sin(frame.time * 2.0);
```

### iMouse

```glsl
// Shadertoy: iMouse.xy 当前位置，zw 按下时位置
vec2 m = frame.mouse.xy;
bool clicked = frame.mouse.z > 0.0;
```

---

## 纹理：iChannel0 的本质

Shadertoy 里：

```glsl
vec3 col = texture(iChannel0, uv).rgb;
```

引擎里需要 **三件东西**：

| 组件 | 作用 |
|------|------|
| `VkImage` | GPU 上的像素数据 |
| `VkImageView` | 如何解释这张图像（2D、格式） |
| `VkSampler` | 过滤（linear/nearest）、寻址（repeat/clamp） |

GLSL 绑定：

```glsl
layout(set = 0, binding = 1) uniform sampler2D channel0;

vec3 col = texture(channel0, uv).rgb;
```

### Vulkan Descriptor 心智模型

```
Descriptor Set Layout  →  声明「这个 shader 要哪些 slot」
Descriptor Set         →  某一帧实际绑定的 buffer/image
Pipeline Layout          →  把 set 和 shader 绑在一起
vkCmdBindDescriptorSets  →  绘制前绑定
```

艺术向引擎：**一套 layout 用到底**，只换 image 内容（视频、噪声图、上一帧）。

---

## 上一帧 / Buffer 反馈

Shadertoy Buffer A：

```glsl
vec3 prev = texture(iChannel0, uv).rgb; // 上一帧自己
```

引擎做法：

1. 维护两张 color attachment **A / B**
2. 偶数帧：读 A 写 B；奇数帧：读 B 写 A（ping-pong）
3. 每帧把「读的那张」绑到 `sampler2D`

这叫 **双缓冲反馈**，是多 Pass 的特例，见 [多 Pass 笔记](md.html?file=study_note/shader/bridge/multipass_framebuffer.md)。

---

## Push Constants vs UBO

| 方式 | 适合 | 艺术向建议 |
|------|------|------------|
| **UBO** | 每帧都变的全局数据（time、resolution） | 默认首选 |
| **Push Constants** | 小数据、per-draw 变化（色调偏移、图层 ID） | 粒子 / 多效果切换时用 |
| **Storage Buffer** | 大量数据（粒子数组） | 后期扩展 |

小引擎起步：**一个 Frame UBO 足够**。

---

## 每帧更新流程（CPU）

```
1. time += deltaTime; frame++
2. memcpy 到 mapped UBO 内存
3. 若纹理变了：上传 pixel data → layout transition → shader_read
4. bind descriptor set
5. draw
```

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| UBO 不对齐 | 遵循 std140 规则，`vec3` 后常需 padding |
| 忘记 layout transition | 上传纹理后必须从 `TRANSFER_DST` → `SHADER_READ_ONLY` |
| `iChannel` 与 render target 格式不一致 | 统一 `RGBA8` 或 `RGBA16F`，shader 里用 `rgba` |
| 每帧 create sampler | Sampler 可复用，只换 ImageView |

---

## 关联知识

- [管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md)
- [多 Pass 与 Framebuffer](md.html?file=study_note/shader/bridge/multipass_framebuffer.md)
- [Shadertoy 移植](md.html?file=study_note/shader/reference/shadertoy_migration.md)
