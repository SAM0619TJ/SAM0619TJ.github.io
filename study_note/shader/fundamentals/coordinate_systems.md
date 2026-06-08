# 坐标系统 (Coordinate Systems)

> 从屏幕像素到世界空间的完整管线。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 屏幕空间

`gl_FragCoord.xy` 是 GPU 给你的像素坐标，原点在**左下角**。

| 变量 | 含义 | 范围 |
|---|---|---|
| `gl_FragCoord.xy` | 像素坐标 | `(0,0)` ~ `(W, H)` |
| `u_resolution` | 窗口分辨率 | `vec2(W, H)` |

---

## 2. 归一化 UV — 坐标修正前

最基础的归一化（**有纵横比问题**）：

```glsl
vec2 uv = gl_FragCoord.xy / u_resolution;  // [0, 1]
```

---

## 3. 纵横比修正 (Aspect Ratio Correction)

屏幕是 16:9 的矩形，但我们需要正方形坐标系来画圆、放摄像机。

### 方法 A：UV 居中 + 等比缩放（最常用）

```glsl
// sea.frag 用的就是这种
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy)
        / min(u_resolution.x, u_resolution.y);
// uv.x ∈ [-aspect, +aspect], uv.y ∈ [-1, +1]
```

**效果**：y 轴始终 $[-1, 1]$，x 轴按比例缩放。圆永远不变形。

### 方法 B：直接等比

```glsl
vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
        / min(u_resolution.x, u_resolution.y);
// uv ∈ [-aspect/2, +aspect/2] × [-0.5, 0.5]
```

### 方法 C：保留原始比例（固定轴）

```glsl
float aspect = u_resolution.x / u_resolution.y;
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy)
        / u_resolution.y;
// uv.x = [−aspect, +aspect], uv.y = [−1, 1]
// 等价于 A
```

---

## 4. 极坐标

圆形对称的东西（太阳、光圈、漩涡）用极坐标更方便：

```glsl
vec2 uv = /* ...归一化后的 UV... */;
float angle = atan(uv.y, uv.x);        // [-π, π]
float radius = length(uv);             // [0, ∞)

// 用极坐标画同心环
float rings = sin(radius * 20.0);      // 20 = 圈数
float spokes = sin(angle * 8.0);        // 8 = 辐条数

// 回到笛卡尔坐标
vec2 polar_uv = vec2(angle / 6.28318, radius);
```

---

## 5. 坐标重复 / 平铺 (Tiling)

### 无限重复
```glsl
vec2 repeated = mod(uv, 1.0) - 0.5;  // 每个单元 [−0.5, 0.5]
```

### 镜像重复（无接缝）
```glsl
vec2 mirrored = abs(mod(uv, 2.0) - 1.0) - 0.5;
```

---

## 6. 摄像机空间 (Camera / View Space)

Raymarching 中，摄像机 = 原点 + 方向向量。

### 最简单的透视图摄像机

```glsl
vec3 ro = vec3(0.0, 0.0, -3.0);      // 摄像机位置 (ray origin)
vec3 rd = normalize(vec3(uv, 1.0));   // 射线方向 (ray direction)
// uv 已经是归一化的 [−1,1] 坐标
```

FOV 效果：把 `rd.z` 从 `1.0` 改小 = 更广角。改大 = 更望远。

### LookAt 摄像机

```glsl
mat3 setCamera(vec3 ro, vec3 ta, float cr) {
    // ro = 眼睛位置, ta = 注视目标, cr = roll 角
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = cross(cu, cw);
    return mat3(cu, cv, cw);
}

// 使用:
vec3 ro = vec3(0.0, 2.0, -5.0);
vec3 ta = vec3(0.0, 0.0, 0.0);
mat3 cam = setCamera(ro, ta, 0.0);
vec3 rd = normalize(cam * vec3(uv, 2.0));  // uv 是 [−1,1]
```

---

## 7. 常用坐标空间一览

| 空间 | 来源 | 典型用法 |
|---|---|---|
| 屏幕空间 | `gl_FragCoord.xy` | 后处理、全屏效果 |
| 归一化 UV | `gl_FragCoord / resolution` | 2D 图案、纹理采样 |
| 居中归一化 | `(gl_FragCoord*2 - res) / min(res.x, res.y)` | 3D raymarching |
| 极坐标 | `atan(y,x)`, `length(p)` | 圆形图案、漩涡 |
| 世界空间 | raymarching 中的 `ro + rd * t` | 3D SDF 求值 |
| 本地空间 | `(p - objPos) * rotMatrix` | 物体局部 SDF |

---

## 8. 常见错误

```glsl
// ❌ 忘记纵横比——圆会变成椭圆
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.xy;

// ✅ 用 min 保持正方形
... / min(u_resolution.x, u_resolution.y);

// ❌ 搞错原点——Shadertoy 原点在左上，glslViewer 在左下
// gl_FragCoord.y 从 0 (底) 到 H (顶)，无需翻转
```
