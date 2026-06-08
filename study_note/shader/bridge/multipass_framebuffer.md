# 多 Pass 与 Framebuffer

> **一句话**：Shadertoy 的 Buffer A/B 就是多 Pass；引擎里用 framebuffer + attachment 把「先画场景、再后处理」串起来。
>
> 关键词：`多Pass` `FBO` `framebuffer` `Bloom` `ping-pong` `Render Pass`

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 速查卡

| 目标 | Shadertoy | Vulkan |
|------|-----------|--------|
| 中间结果 | Buffer A / B | Offscreen `VkImage` attachment |
| 最终上屏 | Image 或 Screen | Swapchain image |
| 后处理输入 | `iChannel0` = 上一 pass 输出 | `sampler2D` 绑上一 attachment |
| 双缓冲反馈 | A→B, B→A 交替 | Ping-pong 两个 framebuffer |
| Bloom 模糊 | 多 pass 或单 pass 近似 | 通常 2~4 pass（extract→blur→combine） |

---

## 为什么需要多 Pass

单 Pass 里同时做：

- Raymarching 场景
- HDR Bloom
- 色调映射
- 暗角

会导致 **寄存器压力爆炸、难调试**。拆 Pass 后：

- 每个 shader 只做一件事
- 中间结果存纹理，下一 pass 当 `iChannel` 用
- 与 [后处理笔记](md.html?file=study_note/shader/effects/post_processing.md) 的结构一致

---

## Shadertoy Buffer 心智模型

```
Pass 0 (Image)  →  写入 Buffer A
Pass 1 (Buffer A) 读 A，写 B   ← iChannel0 = A
Pass 2 (Buffer B) 读 B，写 Screen
```

在 Shadertoy 选 **Buffer A** 标签页写 shader，平台自动把上一帧结果塞进 `iChannel0`。

引擎里 **没有平台自动接线**，你要自己：

1. 创建 render target 纹理
2. 指定 Pass1 渲染到 RT1
3. Pass2 采样 RT1，输出到 swapchain

---

## 典型后处理链（艺术向）

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Pass 1      │     │ Pass 2       │     │ Pass 3      │
│ Scene       │ ──► │ Bloom Extract│ ──► │ Composite   │ ──► 屏幕
│ (你的艺术)   │     │ + Blur       │     │ + Tone Map  │
└─────────────┘     └──────────────┘     └─────────────┘
     HDR RT              temp RT              swapchain
```

| Pass | Shader 职责 | 输入 | 输出 |
|------|-------------|------|------|
| 1 | Raymarching / 主画面 | uniform only | `RGBA16F` HDR |
| 2 | 亮部提取 + 高斯模糊 | Pass1 纹理 | `RGBA8` blur |
| 3 | 合成 + vignette + gamma | Pass1 + Pass2 | swapchain |

Pass 1 的 fragment **就是你现在的 Shadertoy 主体**。

---

## Ping-Pong（反馈 / 拖尾）

流体、运动模糊、部分粒子：

```
Frame N:   读 texA → 画 → 写 texB
Frame N+1: 读 texB → 画 → 写 texA
```

```glsl
// 每帧 fragment 里
vec3 prev = texture(historyTex, uv).rgb;
vec3 curr = renderScene(uv);
fragColor = vec4(mix(prev, curr, 0.1), 1.0); // 拖尾
```

CPU 每帧交换「读/写」绑定，不复制像素。

---

## Vulkan Render Pass 概念

一个 `VkRenderPass` 描述：

- 有几个 attachment（color / depth）
- subpass 如何读写
- 布局转换（`COLOR_ATTACHMENT_OPTIMAL` → `SHADER_READ_ONLY`）

**小引擎简化做法**：

- 每个后处理 Pass = **独立 RenderPass + Framebuffer**
- Pass 之间用 `vkCmdPipelineBarrier` 做 layout 转换
- 不急于 subpass 合并（进阶再优化）

---

## 单 Pass 近似 vs 真多 Pass

| 方式 | 优点 | 缺点 |
|------|------|------|
| 单 Pass 近似（你笔记已有） | Shadertoy 友好、快 | 真 Bloom 质量有限 |
| 真多 Pass | 质量高、可拆调试 | 要 FBO 管理 |

建议：**Shadertoy 阶段单 Pass；引擎阶段 Pass1 艺术 + Pass2 后处理**。

---

## 最小双 Pass 伪代码流程

```
// Pass 1: Scene → offscreenTex
bindPipeline(scenePipeline)
bindDescriptor(sceneSet)      // time, resolution
beginRenderPass(offscreenFB)
drawFullscreenTriangle()
endRenderPass()

// barrier: offscreenTex → SHADER_READ_ONLY

// Pass 2: Post → swapchain
bindPipeline(postPipeline)
bindDescriptor(postSet)       // sceneTex as sampler
beginRenderPass(swapchainFB)
drawFullscreenTriangle()
endRenderPass()
```

Post fragment 示例：

```glsl
layout(binding = 0) uniform sampler2D sceneTex;

void main() {
    vec3 col = texture(sceneTex, uv).rgb;
    col += bloomApprox(col);
    col *= vignette(uv);
    fragColor = vec4(pow(col, vec3(1.0/2.2)), 1.0);
}
```

---

## 分辨率策略

| 策略 | 场景 |
|------|------|
| 全分辨率 | 主艺术 Pass |
| 半分辨率 | Bloom blur（性能优化） |
| 固定 512² | 仅预览 / Shadertoy 风格 |

后处理 Pass 可用 `resolution * 0.5` 的 RT，上采样合成时几乎看不出。

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| Pass2 采样 Pass1 时 layout 不对 | barrier 转到 `SHADER_READ_ONLY_OPTIMAL` |
| 读写同一 attachment | 用 ping-pong 或 subpass input attachment |
| HDR 直接送 swapchain | Pass1 用 `RGBA16F`，最后 Pass tone map 到 `RGBA8` |
| 忘记 viewport 匹配 RT 尺寸 | 每个 Pass 设对应 `vkCmdSetViewport` |

---

## 关联知识

- [后处理效果](md.html?file=study_note/shader/effects/post_processing.md)
- [Uniform 与纹理](md.html?file=study_note/shader/bridge/uniforms_and_textures.md)
- [管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md)
