# 从 Shadertoy 到引擎：管线心智模型

> **一句话**：Shadertoy 把整条渲染管线藏进一个 `mainImage`；引擎把它拆成可配置的阶段，你的艺术 shader 通常落在最后几步。
>
> 关键词：`管线` `render pass` `Shadertoy` `Vulkan` `fragment`

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 速查卡

| Shadertoy | 引擎（Vulkan） | 你写什么 |
|-----------|----------------|----------|
| `mainImage()` | Fragment Shader + Render Pass | 像素颜色逻辑（几乎不变） |
| `iResolution` | Viewport / Swapchain extent | uniform |
| `iTime` | 每帧 `deltaTime` 累加 | uniform |
| `iChannel0` | `VkImage` + Sampler | 纹理采样 |
| Buffer A/B | Framebuffer attachment | 多 Pass |
| （无） | Vertex Shader | 全屏三角形或 mesh |
| （无） | Command Buffer | CPU 录制绘制命令 |

---

## Shadertoy 里发生了什么

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5, 1.0);
}
```

你只写 **「每个像素算什么颜色」**。其余全部由平台代劳：

1. 铺满屏幕的四边形（或等价全屏 draw）
2. 传入 `fragCoord`、`iResolution`、`iTime` 等 uniform
3. 可选：上一帧 / 纹理 Buffer 作为输入
4. 输出写入屏幕

这就是一条 **单 Pass、单 Fragment Shader** 的极简管线。

---

## 引擎里同一件事被拆开了

以 Vulkan 小引擎为例，一帧大致是：

```
CPU 侧
  ① 处理输入、更新 uniform（time、camera…）
  ② 录制 Command Buffer（画什么、用哪条管线）
  ③ Submit 到 GPU 队列 → 等待呈现

GPU 侧（一个 Render Pass 内）
  ④ Vertex Shader：把顶点变到裁剪空间
  ⑤ Rasterization：生成片元
  ⑥ Fragment Shader：算颜色 ← 你的 Shadertoy 逻辑在这里
  ⑦ 写入 Color Attachment（+ 可选 Depth）
```

**艺术向起步**：第 ④ 步用「全屏三角形」固定写法，你只维护第 ⑥ 步。

---

## 对照表：概念映射

| 概念 | Shadertoy | Vulkan 名词 |
|------|-----------|-------------|
| 画一次 | 一帧 `mainImage` | `vkCmdDraw` / `vkCmdDrawIndexed` |
| 着色器程序 | Shader 字符串 | `VkShaderModule` + `VkPipeline` |
| 全局参数 | `iTime` 等 | Uniform Buffer / Push Constants |
| 输入图像 | `iChannel0` | Combined Image Sampler |
| 输出目标 | 屏幕 / Buffer | `VkFramebuffer` attachment |
| 双缓冲效果 | Buffer A → B | 两个 Render Pass 或 subpass |
| 深度测试 | 一般不用 | `VK_FORMAT_D32_SFLOAT` attachment |

---

## 小引擎最小切片（推荐顺序）

```
Step 0  窗口 + Swapchain + 清屏
Step 1  全屏三角形 + 你的 mainImage 改写的 fragment shader
Step 2  加 UBO：resolution、time（对应 iResolution、iTime）
Step 3  加纹理采样（对应 iChannel0）
Step 4  Pass1 画场景 → Pass2 后处理（Bloom 等，见后处理笔记）
Step 5  加 depth + 简单 mesh（与 Raymarching 并存）
```

前 4 步可 **100% 复用** 现有 Shadertoy 艺术 shader，引擎只是外壳。

---

## 全屏三角形：为何不用四边形

许多引擎用 **一个覆盖 NDC 的大三角形** 而非两个三角组成的四边形：

- 避免对角线共享边带来的插值差异
- 只需 3 个顶点，vertex shader 极简

```glsl
// Vertex（概念代码）
// 顶点位置直接写 NDC 三角：(-1,-1), (3,-1), (-1,3)
// 输出 uv = 顶点.xy * 0.5 + 0.5
```

Fragment 里：

```glsl
void main() {
    vec2 uv = vUv; // 或从 gl_FragCoord 推导
    // 以下与 mainImage 体内逻辑相同
}
```

---

## 从 mainImage 迁移 checklist

| 步骤 | 操作 |
|------|------|
| 1 | `fragCoord / iResolution` → `uv` 或 `gl_FragCoord.xy / resolution` |
| 2 | `iTime` → uniform `float time` |
| 3 | `texture(iChannel0, uv)` → `texture(sampler2D, uv)` |
| 4 | `mainImage` 输出 → `out vec4 fragColor` 或 `layout(location=0) out` |
| 5 | 删掉 `main()`，改引擎规定的 entry（GLSL 450: `main`） |

详见 [Shadertoy 移植](md.html?file=study_note/shader/reference/shadertoy_migration.md)。

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 一上来写 mesh、骨骼、阴影 | 先全屏 fragment 跑通 Shadertoy 效果 |
| 认为 Vulkan = 放弃程序化 | Raymarching / SDF 仍是 fragment 逻辑 |
| 忽略 Y 轴翻转 | Shadertoy 原点左上，NDC/UV 常左下，需 `uv.y = 1.0 - uv.y` |
| 每帧重新 create pipeline | Pipeline 应长期缓存，只更新 uniform |

---

## 关联知识

- [Uniform 与纹理](md.html?file=study_note/shader/bridge/uniforms_and_textures.md)
- [多 Pass 与 Framebuffer](md.html?file=study_note/shader/bridge/multipass_framebuffer.md)
- [Vulkan 引擎模块地图](md.html?file=study_note/shader/bridge/vulkan_engine_map.md)
- [坐标系统](md.html?file=study_note/shader/fundamentals/coordinate_systems.md)
