# 辐射度量学 —— 光的物理量

> 理解光照模型之前，必须先理解光到底是什么物理量。这是 PBR（基于物理的渲染）的数学基础。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 为什么需要辐射度量学？

日常说"这个东西很亮"是模糊的。辐射度量学用**精确定义的物理量**描述光：

| 口语 | 物理量 | 单位 |
|------|--------|------|
| "灯泡总共发出多少光" | 辐射通量 $\Phi$ | 瓦特 W |
| "每平方米接收到多少光" | 辐照度 $E$ | W/m² |
| "从这个方向看有多亮" | 辐射率 $L$ | W/(m²·sr) |

在 shader 中，几乎所有光照计算的本质都在操作这些量。

---

## 2. 核心物理量

### 2.1 辐射通量 (Radiant Flux) $\Phi$

$$\Phi = \frac{dQ}{dt} \quad \text{单位: 瓦特 W}$$

- 光源**总共**发射的能量功率。
- 类比：水龙头每秒流出多少升水。
- 在 shader 中：`lightColor * lightIntensity`

### 2.2 辐射强度 (Radiant Intensity) $I$

$$I = \frac{d\Phi}{d\omega} \quad \text{单位: W/sr}$$

- 光源在**某个方向上**每单位立体角发射的功率。
- 立体角 $\omega$：球面上的一块面积除以半径平方，单位是球面度 (sr)。
- 点光源的 $I$ 在所有方向均匀；聚光灯在某方向集中。

```
立体角 ω 的直观理解：
  半径为 r 的球面上，面积 A 对应的立体角 ω = A / r²
  整个球面 = 4π sr  (约 12.57 sr)
  半个球面 = 2π sr
```

### 2.3 辐照度 (Irradiance) $E$

$$E = \frac{d\Phi}{dA} \quad \text{单位: W/m²}$$

- 表面**每平方米接收到**的辐射通量。
- 这就是"照度"——多少光打到了这一小块表面上。
- **Lambert 余弦定律**：斜着照射时，同样光束覆盖更大面积 → 单位面积能量降低。

$$E = \frac{\Phi \cos\theta}{A}$$

```
    平行光
      │  │  │
      │  │  │
      ▼  ▼  ▼
   ┌────────────┐  ← 垂直照射: 光束截面 = 表面面积 → E = Φ/A
   └────────────┘

    平行光
      ╲  ╲  ╲
        ╲  ╲  ╲
          ╲  ╲  ╲   ← 斜射: 同样光束覆盖更大面积 → E = Φ·cosθ/A
   ┌──────────────┐
   └──────────────┘
```

**shader 中的辐照度：**

```glsl
// 半球面上所有入射光的加权积分 = 辐照度
float irradiance = max(dot(N, L), 0.0) * lightColor;
```

### 2.4 辐射率 (Radiance) $L$

$$L = \frac{d^2\Phi}{dA\ d\omega\ \cos\theta} \quad \text{单位: W/(m²·sr)}$$

- **最重要的量**——"从这个表面点、朝这个方向，有多亮"。
- 同时考虑了面积和方向。
- 渲染方程的核心：我们最终画到屏幕上的像素值，就是传感器接收到的辐射率。

**直观区分 $E$ vs $L$：**

| | 辐照度 $E$ | 辐射率 $L$ |
|---|---|---|
| 问什么 | "这里接收了多少光" | "从这里看过去有多亮" |
| 方向 | 只关心"到达"，不管"来自哪里" | 既关心到达，也关心方向 |
| 类比 | 皮肤被晒到的总阳光 | 盯着太阳的那个点有多刺眼 |

---

## 3. BRDF（双向反射分布函数）

### 3.1 定义

$$f_r(\omega_i, \omega_o) = \frac{dL_o(\omega_o)}{dE_i(\omega_i)} = \frac{dL_o(\omega_o)}{L_i(\omega_i) \cos\theta_i \ d\omega_i}$$

- 输入：入射方向 $\omega_i$、出射方向 $\omega_o$
- 输出：出射辐射率与入射辐照度的比值
- 描述：一束光从一个方向来，有多少被反射到另一个方向去

### 3.2 物理约束

| 约束 | 公式 | 含义 |
|------|------|------|
| **Helmholtz 互易性** | $f_r(a, b) = f_r(b, a)$ | 光路可逆 |
| **能量守恒** | $\int_\Omega f_r \cos\theta_o\ d\omega_o \leq 1$ | 不会反射出比入射更多的光 |
| **非负** | $f_r \geq 0$ | 不存在"负的光" |

### 3.3 常见 BRDF 一览

| BRDF | 公式（核心部分） | 适用表面 |
|------|------------------|----------|
| Lambert | $f_r = \frac{\rho}{\pi}$ | 完全漫反射（粉笔、墙面） |
| Blinn-Phong | $\propto (\mathbf{n}\cdot\mathbf{h})^s$ | 经验镜面（非物理） |
| Cook-Torrance | $f_r = \frac{DFG}{4(\mathbf{n}\cdot\mathbf{l})(\mathbf{n}\cdot\mathbf{v})}$ | **PBR 标准** |
| Oren-Nayar | Lambert + 粗糙度修正 | 粗糙漫反射（月球表面） |

---

## 4. 渲染方程 (The Rendering Equation)

Kajiya 1986，一切全局光照的基石：

$$L_o(\mathbf{p}, \omega_o) = L_e(\mathbf{p}, \omega_o) + \int_\Omega f_r(\mathbf{p}, \omega_i, \omega_o)\ L_i(\mathbf{p}, \omega_i)\ (\mathbf{n} \cdot \omega_i)\ d\omega_i$$

```
出射光  =  自发光  +  半球面上所有入射光的 BRDF 加权积分
```

### 在 shader 中

实时渲染通常把积分近似为少数几个光源的求和：

```glsl
vec3 Lo = vec3(0.0);
for (int i = 0; i < NUM_LIGHTS; i++) {
    vec3 L = normalize(lightPos[i] - P);     // 入射方向
    vec3 Li = lightColor[i] * attenuation;   // 入射辐射率
    float NdotL = max(dot(N, L), 0.0);       // cosθ
    Lo += BRDF(N, V, L) * Li * NdotL;        // 渲染方程离散化
}
```

---

## 5. 立体角深入

### 5.1 微分立体角

在球坐标中：

$$d\omega = \sin\theta \ d\theta \ d\phi$$

```glsl
// 半球面积分时，采样点的权重必须包含 sinθ
float pdf = 1.0 / (2.0 * PI);       // 均匀采样的概率密度
float weight = sin(theta);          // 立体角修正
```

### 5.2 为什么半球面是 $2\pi$

$$\int_0^{2\pi} \int_0^{\pi/2} \sin\theta \ d\theta \ d\phi = 2\pi$$

Lambert BRDF 的归一化因子 $\frac{1}{\pi}$ 就来源于此——保证能量守恒。

---

## 6. 常见量的归一化因子速查

| 量 | 归一化因子 | 来源 |
|----|-----------|------|
| Lambert BRDF | $\frac{1}{\pi}$ | $\int_\Omega \frac{1}{\pi} \cos\theta\ d\omega = 1$ |
| Blinn-Phong 归一化 | $\frac{s+8}{8\pi}$ | 保证 $\int_\Omega \dots \leq 1$ |
| GGX 法线分布 | $\frac{\alpha^2}{\pi(\dots)^2}$ | 保证 $\int_\Omega D(\mathbf{h})(\mathbf{n}\cdot\mathbf{h})\ d\omega = 1$ |
| 半球面积分 | $\sin\theta\ d\theta\ d\phi$ | 球坐标雅可比 |

---

## 7. 从辐射度量学到 `sea.frag`

你的海洋 shader 中的光照正是这套理论的简化应用：

```glsl
// sea.frag 中的光照
float diffuse  = pow(dot(n, l) * 0.4 + 0.6, p);   // 半 Lambert → 辐照度近似
float specular = nrm * pow(max(dot(r, l), 0.0), s); // 镜面 → 出射辐射率
vec3 color = mix(refracted, reflected, fresnel);     // Fresnel → 反射/折射能量分配
```

| sea.frag 代码 | 辐射度量学含义 |
|---------------|----------------|
| `diffuse(n, l, p)` | 漫反射 BRDF × 入射辐照度 |
| `specular(n, l, e, s)` | 镜面反射 BRDF × 入射辐射率 |
| `fresnel` | 反射能量 / 折射能量的菲涅尔分配比 |
| `getSkyColor(...)` | 环境辐射率（天空的 $L_i$） |

---

## 8. 术语对照表

| 英文 | 中文 | 符号 | 单位 |
|------|------|------|------|
| Radiant Energy | 辐射能 | $Q$ | J |
| Radiant Flux / Power | 辐射通量 | $\Phi$ | W |
| Radiant Intensity | 辐射强度 | $I$ | W/sr |
| Irradiance | 辐照度 | $E$ | W/m² |
| Radiance | 辐射率 | $L$ | W/(m²·sr) |
| Solid Angle | 立体角 | $\omega$ | sr |
| BRDF | 双向反射分布函数 | $f_r$ | 1/sr |
| Lambert's Cosine Law | 朗伯余弦定律 | — | — |
| Fresnel Equations | 菲涅尔方程 | $F$ | — |
| Rendering Equation | 渲染方程 | — | — |

---

*最后更新：2026-06-03*
