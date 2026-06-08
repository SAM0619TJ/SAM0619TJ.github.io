# 深度缓冲与摄像机

> **一句话**：Shadertoy 在 fragment 里手造摄像机；引擎用 uniform 传 view/proj，depth buffer 处理遮挡。Raymarching 与光栅化可并存。
>
> 关键词：`depth` `camera` `MVP` `Raymarching` `NDC` `Z-buffer`

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 速查卡

| 概念 | Shadertoy / Raymarching | 光栅化引擎 |
|------|-------------------------|------------|
| 摄像机 | `ro`, `rd` 在 fragment 手算 | View + Projection 矩阵 |
| 深度 | Raymarching 最近交点 `t` | `gl_FragDepth` / Z-buffer |
| 遮挡 | `min(d1,d2)` 距离场 | depth test `LESS` |
| 屏幕 UV | `fragCoord/iResolution` | NDC 或 varyings |
| 3D 点 | 场景 SDF 坐标 | `model * vec4(pos,1)` |

---

## Shadertoy 摄像机（你已在用）

```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
vec3 ro = vec3(0, 1, -3);                    // 射线原点
vec3 rd = normalize(vec3(uv, 1.0));          // 射线方向
// Raymarching: t += map(ro + rd*t)
```

**全部在 fragment 内完成**，不需要 vertex shader 传矩阵。

见 [Raymarching](md.html?file=study_note/shader/rendering/raymarching.md)、[坐标系统](md.html?file=study_note/shader/fundamentals/coordinate_systems.md)。

---

## 引擎摄像机（光栅化）

```
世界坐标 --[View]--> 相机坐标 --[Proj]--> 裁剪坐标 --[透视除法]--> NDC
```

| 矩阵 | 作用 |
|------|------|
| Model | 物体摆哪、转多少 |
| View | 相机在哪、看哪 |
| Projection | 透视或正交 |

```glsl
layout(binding = 0) uniform Camera {
    mat4 view;
    mat4 proj;
    mat4 viewProj;
    vec3 camPos;
} camera;

// Vertex
gl_Position = camera.viewProj * model * vec4(position, 1.0);
```

Fragment 里仍可用 `camera.camPos` 算光照方向。

---

## 深度缓冲（Z-Buffer）

光栅化时 GPU 对每个像素保留 **最近** 片元的深度。

| 项 | 说明 |
|----|------|
| Attachment | `VK_FORMAT_D32_SFLOAT` 或 `D24_UNORM_S8` |
| 比较 | 默认 `VK_COMPARE_OP_LESS` |
| 范围 | 透视投影下非线性，近密远疏 |

**Raymarching 不用 Z-buffer**：深度隐含在 `t` 最小值里。

---

## 两条路线如何共存（小引擎）

### 方案 A：分层 Pass（推荐起步）

```
Pass 1: 全屏 Raymarching → color RT（无 depth）
Pass 2: Mesh 场景 + depth → 与 color 合成，或清 depth 后画 mesh 前景
Pass 3: Post → swapchain
```

艺术背景 + 简单 mesh 前景（UI 立方体、调试网格）。

### 方案 B：单 Pass 混合（进阶）

同一 fragment 比较 `t_ray` 与 mesh 深度，取更近者着色。实现复杂，后期再考虑。

---

## Raymarching 摄像机扩展

| 技巧 | 公式 / 代码 |
|------|-------------|
| 轨道相机 | `ro = vec3(sin(t)*r, h, cos(t)*r)` |
| 鼠标环视 | 用 `iMouse` 改 yaw/pitch |
| 焦距 | `rd = normalize(vec3(uv * fov, 1.0))` |
| 景深 | 主射线 + 偏移光圈采样（多 tap） |

这些 **迁移到 Vulkan 时仍写在 scene.frag**，只需把 `iTime`/`iMouse` 换 uniform。

---

## MVP 与 Shadertoy UV 对照

| Shadertoy | 引擎等价 |
|-----------|----------|
| `uv = fragCoord/resolution` | `gl_FragCoord.xy / resolution` |
| `uv` 中心在原点 | `uv * 2.0 - 1.0` 或 NDC |
| 纵横比修正 | `uv.x *= resolution.x / resolution.y` |
| `fragCoord` 原点左上 | GL 默认左下 → 注意 Y 翻转 |

---

## 深度相关易错

| 现象 | 原因 | 修复 |
|------|------|------|
| Z-fighting | 两面太近、depth 精度不够 | 略分离、反转 depth range、log depth |
| 物体消失 | depth test 方向反了 | 检查 `COMPARE_OP`、投影矩阵 handedness |
| 透明排序错 | 透明物体写了 depth | 透明 Pass 关闭 depth write |
| Raymarch 穿模 | 步进过大 | 减小步长、加 safeguard |

---

## 里程碑建议

| 阶段 | 目标 |
|------|------|
| 现在 | 熟练 `ro/rd`、在 Shadertoy/glslViewer 调相机 |
| M1 引擎 | 全屏 fragment，相机逻辑不变 |
| M6 引擎 | 加 depth + 立方体，理解 Z-buffer |
| 后期 | 统一相机 UBO，mesh 与 ray 共用 `camPos` 做光照 |

---

## 关联知识

- [管线心智模型](md.html?file=study_note/shader/bridge/pipeline_mental_model.md)
- [Vulkan 引擎地图](md.html?file=study_note/shader/bridge/vulkan_engine_map.md)
- [坐标系统](md.html?file=study_note/shader/fundamentals/coordinate_systems.md)
- [Raymarching](md.html?file=study_note/shader/rendering/raymarching.md)
