# Vulkan 小引擎模块地图

> **一句话**：按依赖顺序列出小引擎模块；艺术向可先做「全屏 shader 播放器」，再逐步加网格与深度。
>
> 关键词：`Vulkan` `引擎架构` `模块` `swapchain` `roadmap`

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 速查卡

| 阶段 | 模块 | 产出 |
|------|------|------|
| 0 | 窗口 + Instance | 黑窗 |
| 1 | Swapchain + RenderPass | 清屏变色 |
| 2 | Shader + Pipeline | 全屏 Shadertoy 效果 |
| 3 | Uniform + Descriptor | `iTime` / `iResolution` 工作 |
| 4 | Texture | `iChannel0` 工作 |
| 5 | 多 Pass | Bloom 后处理链 |
| 6 | Depth + Mesh | 立方体与 Raymarching 并存 |
| 7 | 同步深化 | 多帧 in-flight、性能 |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      Application                        │
│  main loop: input → update → record → submit → present │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐        ┌──────────┐       ┌──────────┐
   │ Window  │        │ Renderer │       │  Assets  │
   │ (GLFW)  │        │          │       │ shaders  │
   └─────────┘        └────┬─────┘       │ textures │
                             │             └──────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        VkInstance    VkSwapchain     VkPipeline
        VkDevice      RenderPass      Descriptor
        Queues        Framebuffer     CommandPool
```

**艺术向优先路径**：Window → Swapchain → **FullscreenShaderRenderer** → 再接其余。

---

## 模块清单与职责

### 1. 平台层

| 模块 | 职责 | 常用库 |
|------|------|--------|
| Window | 窗口、事件、 framebuffer 尺寸 | GLFW |
| Vulkan Context | Instance、Surface、Device、Queues | Vulkan SDK |

**验收**：窗口打开，validation layer 无致命错误。

---

### 2. 交换链与呈现

| 对象 | 职责 |
|------|------|
| `VkSwapchainKHR` | 双/三缓冲屏幕图像 |
| `VkRenderPass` | 描述 color（+ depth）attachment |
| `VkFramebuffer` | 绑定具体 image view |
| Semaphore / Fence | GPU↔CPU 同步 |

**验收**：每帧清屏为不同颜色，稳定 60fps 呈现。

---

### 3. Shader 系统（你的主场）

| 模块 | 职责 |
|------|------|
| Shader 加载 | 读 `.spv` 或运行时编译 GLSL → SPIR-V |
| Pipeline Cache | 缓存 `VkPipeline` 创建 |
| 全屏 Pass | Vertex（固定三角）+ Fragment（Shadertoy 逻辑） |

**验收**：移植一个简单 Shadertoy（渐变 / 噪声）到窗口。

关联：[管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md)

---

### 4. 资源与描述符

| 模块 | 职责 |
|------|------|
| Buffer | UBO、staging upload |
| Image | 纹理、render target |
| Allocator | 可选 VMA 简化内存 |
| DescriptorPool/Set | 绑定 uniform + texture |

**验收**：`iTime` 驱动动画；一张 PNG 作为 `iChannel0`。

关联：[Uniform 与纹理](md.html?file=study_note/shader/bridge/uniforms_and_textures.md)

---

### 5. 多 Pass 渲染器

| 模块 | 职责 |
|------|------|
| RenderTarget 池 | HDR scene RT、blur temp RT |
| Pass 图 | Scene → Post → Present |
| Barrier 辅助 | layout 转换封装 |

**验收**：场景 Pass 输出 HDR，Post Pass 加 Bloom + gamma 上屏。

关联：[多 Pass 与 Framebuffer](md.html?file=study_note/shader/bridge/multipass_framebuffer.md)

---

### 6. 网格与深度（扩展，非艺术必需）

| 模块 | 职责 |
|------|------|
| Vertex Buffer | 立方体 / 全屏三角 |
| Depth Buffer | `D32` attachment |
| MVP UBO | model / view / proj |
| 与程序化共存 | 同一帧：先 mesh 再 fullscreen，或分 Pass |

**验收**：一个旋转立方体 + 背景 Raymarching 全屏 Pass。

---

### 7. 输入与时间

| 模块 | 职责 |
|------|------|
| Timer | `time`, `deltaTime`, `frame` |
| Mouse | 对应 `iMouse` |
| Resize | 重建 swapchain + RT |

---

## 推荐目录结构（C++）

```
engine/
├── core/           Instance, Device, Swapchain, Sync
├── render/
│   ├── pipeline.h
│   ├── fullscreen_pass.h   ← 艺术 shader 入口
│   ├── multipass.h
│   └── mesh_pass.h         ← 后期
├── resources/      Buffer, Image, Descriptor
├── shaders/
│   ├── fullscreen.vert
│   ├── scene.frag          ← 从 Shadertoy 迁移
│   └── post.frag
└── app/            main loop, input
```

---

## 开发顺序（里程碑）

| # | 里程碑 | 对应 Shadertoy 能力 |
|---|--------|---------------------|
| M0 | 清屏 | — |
| M1 | 全屏 shader | `mainImage` 静态版 |
| M2 | 动画 uniform | `iTime` |
| M3 | 纹理采样 | `iChannel0` |
| M4 | Buffer 反馈 | Buffer A 拖尾 |
| M5 | 后处理链 | Bloom / vignette |
| M6 | 鼠标交互 | `iMouse` |
| M7 | Mesh 层 | 与 3D 引擎愿景衔接 |

**建议每个里程碑对应一个 git tag**，shader 用文件热重载加速迭代。

---

## 艺术向 vs 通用引擎

| 选择 | 艺术向小引擎 | 通用小引擎 |
|------|--------------|------------|
| 默认绘制 | 全屏 fragment | Mesh 列表 |
| 场景表示 | SDF / Raymarching | 三角网格 |
| 扩展方向 | 更多 GLSL 效果 | 场景图、材质系统 |
| 你的路线 | **先左列，M5 后再右列** | 长期目标 |

---

## 推荐学习资源（按需）

| 主题 | 方向 |
|------|------|
| Vulkan 入门 | Vulkan Tutorial（swapchain 流程） |
| shader 编译 | `glslang` / `shaderc` |
| 内存 | VMA（Vulkan Memory Allocator） |
| 艺术参考 | 现有 Shadertoy 笔记 + glslViewer 本地调试 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 一次写完整引擎 | 按 M0→M7 里程碑递进 |
| validation error 堆叠 | 每 milestone 清零再继续 |
| 艺术 shader 与引擎强耦合 | `scene.frag` 独立文件，uniform 接口稳定 |
| 过早抽象 ECS | 小引擎用「几个 Pass 类」足够 |

---

## 关联知识

- [管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md)
- [Uniform 与纹理](md.html?file=study_note/shader/bridge/uniforms_and_textures.md)
- [多 Pass 与 Framebuffer](md.html?file=study_note/shader/bridge/multipass_framebuffer.md)
- [深度与摄像机](md.html?file=study_note/shader/bridge/depth_and_camera.md)
- [Raymarching](md.html?file=study_note/shader/rendering/raymarching.md)
