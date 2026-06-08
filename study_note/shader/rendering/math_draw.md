# 数学绘图完全指南 —— SDF + 分形 + 噪声 + 变换

> 用 shader 进行纯数学绘图的完整工具箱。从欧几里得几何到 Mandelbrot 分形，从 SDF 到域扭曲。
>
> **SDF**（有符号距离函数）：输入空间中任意一点，输出该点到最近物体表面的**有符号距离**。
> - **正数** = 点在物体外部 / **0** = 点在物体表面 / **负数** = 点在物体内部

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

# 第一部分：SDF 几何绘图

## 1. 为什么用 SDF？

在 shader 中，SDF 让你**不需要顶点 / 模型数据**就能画出任意几何图形。

```
传统方式：顶点 → 光栅化 → 片段着色
SDF 方式：对每个像素 → 计算到形状的距离 → 距离 < 0 = 内部 → 着色
```

核心优势：
- 纯数学描述，精度无限（抗锯齿天然）
- 布尔运算（并、交、差）极其简单
- 可以组合出极其复杂的形状
- 是 **Raymarching（光线步进）** 的基础

---

## 2. 2D SDF 基础公式

所有 2D SDF 的输入是 `vec2 p`（当前点坐标），输出是 `float d`（到形状的距离）。

### 2.1 圆形

$$d = length(p) - r$$

```glsl
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}
```

### 2.2 矩形（轴对齐）

$$d = \max(|p_x| - b_x,\ |p_y| - b_y)$$

```glsl
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
```

### 2.3 圆角矩形

```glsl
float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
```

### 2.4 线段

```glsl
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}
```

### 2.5 等边三角形

```glsl
float sdEquilateralTriangle(vec2 p, float r) {
    float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}
```

### 2.6 菱形

$$d = |p_x| + |p_y| - r$$

```glsl
float sdRhombus(vec2 p, float r) {
    return abs(p.x) + abs(p.y) - r;
}
```

### 2.7 圆环

```glsl
float sdTorus(vec2 p, float outerR, float innerR) {
    return abs(length(p) - outerR) - innerR;
}
```

### 2.8 星形

```glsl
float sdStar5(vec2 p, float r, float rf) {
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
```

---

## 3. 3D SDF 基础公式

输入 `vec3 p`，输出 `float d`。

### 3.1 球体

```glsl
float sdSphere(vec3 p, float r) { return length(p) - r; }
```

### 3.2 立方体

```glsl
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
```

### 3.3 圆角立方体

```glsl
float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
```

### 3.4 平面

```glsl
float sdPlane(vec3 p, vec3 n, float h) { return dot(p, n) - h; }
```

### 3.5 圆柱

```glsl
float sdCylinder(vec3 p, float r) { return length(p.xz) - r; }

float sdCappedCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
```

### 3.6 圆环 / 胶囊 / 椭球

```glsl
// 圆环
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}
// 胶囊
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
// 椭球
float sdEllipsoid(vec3 p, vec3 r) {
    float k0 = length(p / r);
    float k1 = length(p / (r * r));
    return k0 * (k0 - 1.0) / k1;
}
```

---

## 4. SDF 组合运算（CSG）

### 4.1 基本布尔

```glsl
float opUnion(float d1, float d2)        { return min(d1, d2); }      // 并集 ∪
float opSubtraction(float d1, float d2)  { return max(d1, -d2); }     // 差集 A-B
float opIntersection(float d1, float d2) { return max(d1, d2); }      // 交集 ∩
```

### 4.2 平滑布尔（融化粘稠效果）

```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}
float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}
```

---

## 5. 位置变换

SDF 不直接移动形状，而是**反向变换采样点**。

| 操作 | 代码 | 说明 |
|------|------|------|
| 平移 | `p -= offset;` | 形状移到 offset 处 |
| 2D 旋转 | `p = mat2(c,-s, s,c) * p;` | 绕原点旋转 |
| 缩放 | `p /= s;` 然后 `d *= s;` | 非均匀缩放需修正 |
| 镜像 | `p.x = abs(p.x);` | 左右对称 |
| 全镜像 | `p = abs(p);` | 4 象限 (2D) / 8 卦限 (3D) |
| 无限重复 | `q = mod(p+c/2, c) - c/2;` | 周期 c 的空间折叠 |

---

## 6. 从 SDF 到像素：渲染方法

```glsl
// 硬边缘
float mask = 1.0 - step(0.0, d);

// 抗锯齿 (推荐)
float aa = fwidth(d) * 1.5;
float mask = 1.0 - smoothstep(0.0, aa, d);

// 描边
float stroke = smoothstep(0.0, aa, abs(d) - 0.02);

// 发光
float glow = exp(-abs(d) * 30.0);
```

---

# 第二部分：SDF 之外 —— 数学绘图的另一半

## 7. 噪声：FBM（分形布朗运动）

噪声是一切**有机纹理**（云、山、木材、大理石）的基础。

### 7.1 基础值噪声

```glsl
// 2D 随机（基于格点哈希）
float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}
```

### 7.2 梯度噪声（类 Perlin）

```glsl
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep 平滑

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

### 7.3 FBM —— 多层叠加

每一层：频率翻倍 + 振幅减半 = 自相似细节。

```glsl
float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;      // 振幅
    float freq = 1.0;     // 频率

    for (int i = 0; i < 6; i++) {
        value += amp * noise(p * freq);
        freq *= 2.0;      // 频率倍增 → 细节翻倍
        amp *= 0.5;       // 振幅衰减 → 贡献减半
    }

    return value; // 范围约 [0, 1]
}
```

### 经典用法

```glsl
float n = fbm(st * 3.0 + u_time * 0.1);        // 流动的云
vec3 wood = mix(vec3(.4,.2,.1), vec3(.6,.4,.2), fbm(st * 8.0)); // 木纹
float mountain = fbm(st * 2.0) * st.y;          // 山脉剪影
```

---

## 8. 域扭曲（Domain Warping）

**在采样噪声之前扭曲坐标**——是噪声 → 艺术的分界线。

### 原理

```
正常：     color = f(p)
域扭曲：   color = f(p + g(p))
          其中 g(p) 本身也可以是一个噪声场
```

### 基础实现

```glsl
float fbm(vec2 p); // 如前定义

float warpedFbm(vec2 p) {
    // 用一层 FBM 扭曲坐标
    vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0)),
        fbm(p + vec2(5.2, 1.3))
    );

    vec2 r = vec2(
        fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * u_time),
        fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * u_time)
    );

    return fbm(p + 4.0 * r);
}
```

### 视觉效果

```glsl
// 基础 FBM → 云雾
// + 1 层扭曲 → 扭曲的云、熔岩纹理
// + 2 层扭曲 → 大理石花纹、抽象艺术
// + 3 层扭曲 → 完全超现实的有机形态
```

---

## 9. 迭代分形：Mandelbrot 与 Julia 集

**不同于 SDF**——这里不是"到表面的距离"，而是**发散速度**。

### 9.1 Mandelbrot 集

$$z_{n+1} = z_n^2 + c, \quad z_0 = 0$$

```glsl
float mandelbrot(vec2 c) {
    vec2 z = vec2(0.0);
    for (int i = 0; i < 128; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if (dot(z, z) > 256.0) return float(i) / 128.0;
    }
    return 1.0; // 集内 → 黑色
}
```

### 9.2 Julia 集

$$z_{n+1} = z_n^2 + k, \quad z_0 = c$$

```glsl
float julia(vec2 z, vec2 k) {
    for (int i = 0; i < 128; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + k;
        if (dot(z, z) > 256.0) return float(i) / 128.0;
    }
    return 1.0;
}
```

### 9.3 距离估计着色（SDF 思想！）

比迭代次数着色更平滑：

```glsl
float mandelbrotDE(vec2 c) {
    vec2 z = vec2(0.0);
    vec2 dz = vec2(1.0, 0.0); // 导数
    for (int i = 0; i < 128; i++) {
        dz = 2.0 * vec2(z.x*dz.x - z.y*dz.y, z.x*dz.y + z.y*dz.x) + vec2(1.0, 0.0);
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if (dot(z, z) > 256.0) break;
    }
    float d = 0.5 * log(dot(z, z)) * length(z) / length(dz);
    return d; // < 0.01 ≈ 在边界附近
}
```

### 9.4 牛顿分形

求解 $z^3 - 1 = 0$ 的牛顿迭代，每个像素根据收敛到哪个根来着色：

```glsl
vec3 newtonFractal(vec2 c) {
    vec2 z = c;
    for (int i = 0; i < 32; i++) {
        // z = z - (z³ - 1) / (3z²)
        z -= (z*z*z - vec2(1.0, 0.0)) / (3.0 * z*z);
    }
    // 判断最接近哪个根: 1, -0.5±0.866i
    float d1 = length(z - vec2(1.0, 0.0));
    float d2 = length(z - vec2(-0.5, 0.866));
    float d3 = length(z - vec2(-0.5, -0.866));
    float m = min(min(d1, d2), d3);
    // 红色/绿色/蓝色 对应三个根
    if (m == d1) return vec3(1,0,0);
    if (m == d2) return vec3(0,1,0);
    return vec3(0,0,1);
}
```

---

## 10. Voronoi / 细胞噪声

不是连续噪声，而是**基于最近邻距离**的图案。

### 基础 Voronoi

```glsl
float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float minDist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash21(i + neighbor); // 格点内的随机位置
            vec2 diff = neighbor + point - f;
            float d = dot(diff, diff);
            minDist = min(minDist, d);
        }
    }

    return sqrt(minDist); // 到最近特征点的距离
}
```

### 扩展用法

```glsl
// 细胞壁（边线）
float cellEdge = 1.0 - smoothstep(0.0, 0.02, voronoiEdge);

// 按细胞着色（不同细胞不同颜色）
float cellColor = hash21(cellIndex);

// 到第二近点的距离 → 裂痕效果
float crack = dist2 - dist1;
```

---

## 11. 极坐标与对称变换

### 11.1 基础极坐标

```glsl
// 直角坐标 → 极坐标
vec2 toPolar(vec2 p) {
    return vec2(length(p), atan(p.y, p.x));
}

// 极坐标 → 直角坐标
vec2 toCartesian(vec2 polar) {
    return polar.x * vec2(cos(polar.y), sin(polar.y));
}
```

### 11.2 万花筒 / Kaleidoscope

```glsl
float kaleidoscope(vec2 p, float segments) {
    float angle = atan(p.y, p.x);
    angle = mod(angle, 2.0 * 3.14159265 / segments);
    angle = abs(angle - 3.14159265 / segments);
    // 现在 p 被折叠到单个扇区内
    return sdCircle(vec2(length(p) * cos(angle), length(p) * sin(angle)), 0.3);
}
```

### 11.3 对数极坐标（Log-Polar）

将**缩放 + 旋转**变成**平移 + 平移**，产生无限螺旋：

```glsl
vec2 logPolar(vec2 p) {
    float r = length(p);
    float theta = atan(p.y, p.x);
    return vec2(log(r), theta); // 缩放→平移，旋转→平移
}
// 然后在这个空间里用 mod 做重复 → 无限螺旋分形
```

---

## 12. IFS（迭代函数系统）

一系列仿射变换，以概率选择 → 产生自相似形状（蕨类、谢尔宾斯基三角）。

### 谢尔宾斯基三角

```glsl
float sierpinski(vec2 p) {
    for (int i = 0; i < 12; i++) {
        // 三个仿射变换，每个将三角形缩小 1/2 并移到不同位置
        if (p.x + p.y > 1.0) {
            p = 2.0 * p - vec2(1.0, 1.0);
        } else if (p.x > 0.5) {
            p = 2.0 * p - vec2(1.0, 0.0);
        } else {
            p = 2.0 * p;
        }
    }
    // p 落到三角形内→黑色，外→白色
    float d = sdEquilateralTriangle(p - vec2(0.5), 0.5);
    return step(0.0, d);
}
```

---

## 13. 实战模板：组合多种技术

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// ========== 噪声 ==========
float hash21(vec2 p) { /* ... */ }
float noise(vec2 p) { /* ... */ }
float fbm(vec2 p) { /* ... */ }

// ========== SDF ==========
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // --- 背景：域扭曲的 FBM ---
    vec2 q = vec2(fbm(st * 2.0 + 0.1 * u_time),
                  fbm(st * 2.0 + 5.2 + 0.15 * u_time));
    float bg = fbm(st * 3.0 + 3.0 * q);

    // --- 前景：旋转的几何形状 ---
    float angle = u_time * 0.5;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = rot * st;

    float d1 = sdCircle(p - vec2(0.3, 0.0), 0.2 + 0.05 * sin(u_time * 3.0));
    float d2 = sdBox(p - vec2(-0.3, 0.0), vec2(0.15));

    float geo = min(d1, d2);
    float mask = 1.0 - smoothstep(0.0, fwidth(geo) * 1.5, geo);

    // --- 合成 ---
    vec3 bgColor = mix(vec3(0.05, 0.05, 0.15), vec3(0.3, 0.1, 0.4), bg);
    vec3 fgColor = vec3(0.2, 0.8, 1.0);
    vec3 color = mix(bgColor, fgColor, mask);

    gl_FragColor = vec4(color, 1.0);
}
```

---

## 14. 完整工具箱速查

```
┌──────────────────────────────────────────────────────────────┐
│  你想要的效果             │  使用的技术                       │
├──────────────────────────────────────────────────────────────┤
│  干净几何形状             │  SDF + 布尔运算                   │
│  抗锯齿边缘               │  fwidth + smoothstep              │
│  融化/粘稠过渡            │  SDF 平滑布尔                     │
│  周期性动画               │  sin(u_time) + 坐标变换           │
│  万花筒/对称图案          │  极坐标 + mod + abs               │
│  无限复制/空间折叠        │  mod(p, c) - c/2                 │
│  云雾/烟雾                │  FBM 噪声                         │
│  山脉地形                 │  FBM 噪声 + 高度图                │
│  木材/大理石纹理          │  FBM + sin 条纹                   │
│  熔岩/有机抽象纹理        │  域扭曲 (Domain Warping)          │
│  细胞/鳞片/裂纹           │  Voronoi 噪声                     │
│  Mandelbrot/Julia 分形    │  复数迭代 + 发散速度              │
│  牛顿分形                 │  牛顿迭代法                       │
│  蕨类/自相似树            │  IFS (迭代函数系统)               │
│  3D 场景                  │  SDF + Raymarching                │
│  光照/法线/AO/软阴影      │  Raymarching 后处理               │
│  反应-扩散 (斑点/条纹)    │  偏微分方程模拟 (进阶)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 15. 学习路线图

```
阶段 1: 基础形状
  圆/方/线 → step/smoothstep 填充 → 抗锯齿

阶段 2: 组合与变换
  布尔运算 → 平移/旋转/缩放 → 对称/重复

阶段 3: 动画
  sin(u_time) → 缓动函数 → 复杂运动路径

阶段 4: 纹理
  噪声 → FBM → 域扭曲 → Voronoi

阶段 5: 分形
  Mandelbrot → Julia → 牛顿 → IFS

阶段 6: 3D
  SDF 3D 形状 → Raymarching → 光照/法线/AO

阶段 7: 自由创作
  混合以上全部技术，创造你自己的数学艺术
```

---

## 16. 进阶参考

- **Inigo Quilez 的 SDF 大全**：`iquilezles.org/articles/distfunctions/`
- **The Book of Shaders**：`thebookofshaders.com`
- **Shadertoy**：`shadertoy.com`（成千上万的数学绘图作品）
- **Raymarching 入门**：搜索 "Ray Marching for Dummies"

---

*最后更新：2026-06-03*
