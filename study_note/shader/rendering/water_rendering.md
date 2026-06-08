# 水体渲染原理与技术

> 基于 `sea.frag` 的逐行拆解。从高度场合成到光线步进，从菲涅尔方程到镜面高光。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 总览：渲染管线

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────┐
│ 屏幕像素  │ →  │ 构造视线Ray  │ →  │ 高度图步进   │ →  │ 法线+光照    │ →  │ 像素色 │
│ (x, y)   │    │ ori + dir   │    │ 找交点 P     │    │ 菲涅尔+反射  │    │        │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘    └────────┘
                     ↑                                       ↑
                fromEuler(ang)                          map_detailed(p)
                摄像机旋转                              高度场(5层octave)
```

核心思想：**不是画一个平面再贴纹理，而是对每个像素发射一条射线，在数学描述的海面上找到交点，然后着色。**

---

## 2. 波浪高度场（Height Field）

### 2.1 数学定义

海面是一个**高度场** $h(x, z)$：对于水平位置 $(x, z)$，水面高度为 $y = h(x, z)$。

SDF 形式：
$$map(p) = p.y - h(p.x, p.z)$$

- $map(p) < 0$ → 在水面**之下**
- $map(p) > 0$ → 在水面**之上**
- $map(p) = 0$ → 恰好在水面上

### 2.2 单层波形：`sea_octave`

```glsl
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);                    // ① 噪声扰动坐标 → 打破规律感
    vec2 wv = 1.0 - abs(sin(uv));       // ② |sin| 产生尖峰波浪
    vec2 swv = abs(cos(uv));            // ③ |cos| 产生相位偏移的波
    wv = mix(wv, swv, wv);              // ④ 混合 sin/cos → 不对称波形
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}
```

**逐行数学含义：**

| 步骤 | 公式 | 效果 |
|------|------|------|
| ① 扰动 | $uv' = uv + noise(uv)$ | 波浪不再完美周期，有自然的不规则感 |
| ② sin 波 | $1 - |\sin(uv)|$ | 产生网格状的波峰（值 → 1 处为峰） |
| ③ cos 波 | $|\cos(uv)|$ | 相位偏移 $\pi/2$ 的波 |
| ④ 混合 | $mix(wv, swv, wv)$ | sin 峰处用 sin，谷处用 cos → 不对称 |
| ⑤ choppy | $(\dots)^{choppy}$ | 指数压缩 → 控制波峰尖锐程度 |

### 2.3 多层叠加（FBM 风格）

$$h(x,z) = \sum_{i=0}^{N-1} amp_i \cdot octave(uv \cdot freq_i)$$

每一层的 uv 还经过**旋转矩阵**变换：

$$uv_{i+1} = uv_i \cdot \begin{bmatrix} 1.6 & 1.2 \\ -1.2 & 1.6 \end{bmatrix}$$

这个矩阵 = 缩放 $\times 2.0$ + 旋转 $\approx 36.87°$，打破网格对齐。

```glsl
float map(vec3 p) {
    float freq = SEA_FREQ;    // 0.16 → 基础频率
    float amp  = SEA_HEIGHT;  // 0.6  → 基础振幅
    vec2 uv = p.xz;

    float h = 0.0;
    for (int i = 0; i < ITER_GEOMETRY; i++) {
        // 两股交叉方向的海浪叠加
        d = sea_octave((uv + SEA_TIME) * freq, choppy)
          + sea_octave((uv - SEA_TIME) * freq, choppy);
        h += d * amp;

        uv *= mat2(1.6, 1.2, -1.2, 1.6);  // 旋转+缩放
        freq *= 1.9;                        // 频率递增
        amp  *= 0.22;                       // 振幅递减
    }
    return p.y - h;
}
```

**参数演变（3 层 octave）：**

| 层 | freq | amp | 效果 |
|----|------|-----|------|
| 0 | 0.16 | 0.60 | 大尺度涌浪 (swell) |
| 1 | 0.30 | 0.13 | 中等波浪 |
| 2 | 0.58 | 0.03 | 细小波纹 (ripple) |

**为什么有两套 `map`？**
- `map` (3 层) → 用于光线步进，快速但粗糙
- `map_detailed` (5 层) → 用于法线计算，精细但慢，只在交点处算一次

---

## 3. 高度图光线步进（Height-map Raymarching）

### 3.1 问题

给定射线 $R(t) = O + t \cdot D$，找到与海面 $y = h(x,z)$ 的第一个交点。

普通 Raymarching（固定步长）太慢。高度图有一个特性可以加速。

### 3.2 二分法加速（Secant Method）

利用高度场的性质：**从上方一定能看到表面，不会穿透**。

```
算法：Secant Method（割线法）

初始：tm = 0（近端，在水面上方 → hm < 0）
      tx = 1000（远端，可能在水面下 → hx > 0）

每步：
  tmid = mix(tm, tx, hm/(hm-hx))    ← 线性插值猜测根的位置
  如果 hmid < 0:  tx = tmid         ← 交点在更近处
  如果 hmid > 0:  tm = tmid         ← 交点在更远处
  直到 |hmid| < EPSILON
```

**图解：**

```
  y ↑
    │    水面 y=h(x,z)
    │       ╱╲    ╱╲
    │      ╱  ╲  ╱  ╲___
    │  ●  ╱    ╲╱        ╲___    ● = 采样点
    │   ╲╱   ●             ╲___
    │────●─────────────────────→ t
    │  tm   tmid            tx
    │
    │  射线从空中射入水中
```

### 3.3 代码

```glsl
float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
    float tm = 0.0;
    float tx = 1000.0;
    float hx = map(ori + dir * tx);
    if (hx > 0.0) { p = ori + dir * tx; return tx; } // 全程未击中

    float hm = map(ori);
    for (int i = 0; i < NUM_STEPS; i++) {
        float tmid = mix(tm, tx, hm / (hm - hx));  // 插值猜测
        p = ori + dir * tmid;
        float hmid = map(p);
        if (hmid < 0.0) { tx = tmid; hx = hmid; }
        else            { tm = tmid; hm = hmid; }
        if (abs(hmid) < EPSILON) break;
    }
    return mix(tm, tx, hm / (hm - hx));
}
```

**为什么只有 32 步就能收敛？** 因为 Secant Method 是超线性收敛的（比二分法快），每次迭代区间缩小比例远大于 1/2。

---

## 4. 法线计算

### 4.1 数值梯度

有了高度场 $h(x,z)$，水面法线 = 梯度的归一化：

$$\mathbf{n} = \frac{(-\frac{\partial h}{\partial x},\ 1,\ -\frac{\partial h}{\partial z})}{\|\cdots\|}$$

用中心差分近似偏导：

$$\frac{\partial h}{\partial x} \approx \frac{h(x+\varepsilon, z) - h(x-\varepsilon, z)}{2\varepsilon}$$

### 4.2 自适应步长

```glsl
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);                          // h(x,z)
    n.x = map_detailed(vec3(p.x+eps, p.y, p.z)) - n.y;  // h(x+ε) - h(x)
    n.z = map_detailed(vec3(p.x, p.y, p.z+eps)) - n.y;  // h(z+ε) - h(z)
    n.y = eps;
    return normalize(n);
}
```

注意这里 `eps = dot(dist, dist) * EPSILON_NRM`，即步长**正比于距离的平方**——远处交点用大步长（避免闪烁），近处用小步长（保证精度）。

---

## 5. 海水着色：菲涅尔方程

### 5.1 物理原理

当光从空气射向水面时，一部分反射、一部分折射。**反射比例由入射角决定**。

- **垂直看水** → 大部分透射，看到水底颜色
- **斜着看水** → 大部分反射，看到天空倒影

这就是**菲涅尔效应**。

### 5.2 Schlick 近似

$$F = F_0 + (1 - F_0)(1 - \mathbf{n} \cdot \mathbf{v})^5$$

简化版（我们的代码）：

$$F = \min((1 - \mathbf{n} \cdot \mathbf{v})^3,\ 0.5)$$

```glsl
float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
fresnel = min(fresnel * fresnel * fresnel, 0.5);
```

### 5.3 反射 + 折射合成

```glsl
vec3 reflected = getSkyColor(reflect(eye, n));  // 反射 → 天空色
vec3 refracted = SEA_BASE + diffuse(...);        // 折射 → 水体色
vec3 color = mix(refracted, reflected, fresnel); // 菲涅尔混合
```

**效果：**

```
        视线垂直 (fresnel≈0)        视线倾斜 (fresnel≈0.5)
        ┌───── eye                  eye ╲
        │                                ╲
    ────▼──── 水面                  ──────▼── 水面
    ═══════════                    ═══════════
    看到深蓝水体                    看到天空倒影
```

---

## 6. 光照模型

### 6.1 漫反射（水体内部散射）

$$I_{diffuse} = (\mathbf{n} \cdot \mathbf{l} \times 0.4 + 0.6)^p$$

`0.4 + 0.6` 保证了即使背光面也有环境光，不会全黑。`p=80` 让高光非常集中——模拟水下散射的方向性。

### 6.2 镜面高光（Blinn-Phong 变体）

$$I_{specular} = \frac{s + 8}{8\pi} \cdot \max(\mathbf{r} \cdot \mathbf{l},\ 0)^s$$

其中 $\mathbf{r} = reflect(\mathbf{e}, \mathbf{n})$ 是视线关于法线的反射向量。

$$\frac{s+8}{8\pi}$$

是**归一化因子**，保证不同 s 值时总能量守恒。

`s=60` → 非常锐利的太阳高光，模拟平静海面的镜面反射。

### 6.3 距离衰减

```glsl
float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
```

远处的海水颜色贡献减弱 → 大气透视效果。

---

## 7. 天空渲染

```glsl
vec3 getSkyColor(vec3 e) {
    e.y = (max(e.y, 0.0) * 0.8 + 0.2) * 0.8;
    return vec3(
        pow(1.0 - e.y, 2.0),   // R: 地平线附近偏红
        1.0 - e.y,              // G: 线性过渡
        0.6 + (1.0 - e.y) * 0.4 // B: 始终偏蓝
    ) * 1.1;
}
```

| 方向 | R | G | B | 颜色 |
|------|---|---|---|------|
| 天顶 (e.y≈1) | 0.00 | 0.00 | 0.66 | 深蓝 |
| 地平线 (e.y≈0) | 1.00 | 1.00 | 1.00 | 白色 |
| 中间 | 渐变 | 渐变 | 渐变 | 淡蓝 |

---

## 8. 摄像机系统

### 8.1 欧拉角 → 旋转矩阵

通过 Yaw (绕 Y)、Pitch (绕 X)、Roll (绕 Z) 三个角度构建旋转矩阵：

$$R = R_z(roll) \cdot R_x(pitch) \cdot R_y(yaw)$$

展开后的 3×3 矩阵即 `fromEuler` 的实现。

### 8.2 视线构造

```glsl
vec3 ori = vec3(0.0, 3.5, time * 5.0);       // 摄像机在高空绕圈
vec3 dir = normalize(vec3(uv, -2.0));          // 基础方向：朝前下方
dir.z += length(uv) * 0.14;                    // 桶形畸变 → 广角感
dir = normalize(dir) * fromEuler(ang);         // 旋转摄像机
```

`dir.z += length(uv) * 0.14` 给画面加了轻微桶形畸变 → 边缘有广角拉伸，视觉更宽广。

---

## 9. 完整数据流

```
getPixel(屏幕坐标)
  │
  ├─ 构造 uv（[-1,1] 归一化坐标）
  │
  ├─ fromEuler(时间) → 旋转矩阵
  │    └─ 每帧角度: (sin(3t)·0.1, sin(t)·0.2+0.3, t)
  │
  ├─ 摄像机: ori=(0, 3.5, 5t), dir=旋转后的视线
  │
  ├─ heightMapTracing(ori, dir) → 交点 P
  │    └─ 32 步 Secant Method 在 map() 上搜索
  │         └─ map(p) = p.y - h(p.xz)
  │              └─ h = Σ 3层 sea_octave(旋转·频率·坐标)
  │                   └─ sea_octave: |sin| + noise 扰动
  │
  ├─ getNormal(P, 自适应eps) → 法线 N
  │    └─ 对 map_detailed 做数值差分 (5层)
  │
  ├─ getSeaColor(P, N, light, eye, dist)
  │    ├─ fresnel = (1 - N·V)³
  │    ├─ reflected = getSkyColor(reflect(eye, N))
  │    ├─ refracted = 水体基色 + 漫反射·水体色
  │    ├─ color = mix(refracted, reflected, fresnel)
  │    ├─ color += 深度衰减
  │    └─ color += 镜面高光
  │
  └─ 与天空按 dir.y 混合 → 平滑过渡到纯天空
       └─ pow(color, 0.65) → Gamma 调整
```

---

## 10. 参数调优指南

| 参数 | 默认值 | 增大效果 | 减小效果 |
|------|--------|----------|----------|
| `SEA_HEIGHT` | 0.6 | 浪更高更剧烈 | 海面更平静 |
| `SEA_CHOPPY` | 4.0 | 波峰尖锐、碎浪感 | 圆滑的涌浪 |
| `SEA_SPEED` | 0.8 | 加速流动 | 缓慢起伏 |
| `SEA_FREQ` | 0.16 | 更密集的小波浪 | 更宽阔的大浪 |
| `ITER_GEOMETRY` | 3 | 光线步进更精确(慢) | 更快但可能漏掉细节 |
| `ITER_FRAGMENT` | 5 | 法线更精细 | 法线更平滑 |
| `NUM_STEPS` | 32 | 更精确(慢) | 更快但可能伪影 |
| `fresnel` 指数 | 3 | 反射过渡更锐利 | 过渡更柔和 |
| `specular` s | 60 | 高光更小更亮 | 高光更大更散 |

---

## 11. 简化版 vs 完整版

如果你想要更轻量的水面，可以这样降级：

```
完整版                           简化版
────────────────────────────────────────────
高度图 Raymarching (32步)  →   固定水面平面
5层 octave 法线             →   2层 sin 叠加
菲涅尔 + 反射 + 折射       →   直接 mix 天色和水色
镜面高光 (s=60)            →   step/smoothstep 闪光
欧拉角摄像机               →   固定视角
```

简化版的 `example.frag` 和第一版 `sea.frag` 就是这条路，效果偏向风格化/卡通。

---

## 12. 进阶方向

- **次表面散射 (SSS)**：光射入水面后在水体内散射 → 浅水区呈青绿色
- **焦散 (Caustics)**：水面透镜效应在水底投射的光纹
- **白沫 (Foam)**：波峰处 `choppy > threshold` 时叠加白色
- **水下折射**：在交点处生成第二根折射射线继续追踪
- **FFT 海浪**：用海洋学频谱（JONSWAP / Phillips）替代程序化波形 → 更真实

---

*最后更新：2026-06-03*
