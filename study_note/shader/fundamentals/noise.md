# 噪声家族 (Noise Family)

> 噪声是程序化生成的核心基石——纹理、地形、云、水面、域扭曲全部依赖它。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 哈希函数 (Hash)

所有噪声的起点：一个确定的、外观随机的函数。

```glsl
// 基础哈希：输入 vec2，输出 0~1 的伪随机浮点数
float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

// 哈希变体：输出 vec3（更丰富）
float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
```

**关键原则**：`sin()` × 大数 → `fract()` = 伪随机。大数越大，随机感越强。

---

## 2. 值噪声 (Value Noise)

在格点上哈希，在格点间插值。

```glsl
float noise(vec2 p) {
    vec2 i = floor(p);           // 格点坐标
    vec2 f = fract(p);           // 格内位置
    vec2 u = f * f * (3.0 - 2.0 * f);  // smoothstep 插值权重

    return mix(
        mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
        u.y
    );
}
```

$$
\text{noise}(p) = \text{lerp}(\text{lerp}(h_{00}, h_{10}, u_x), \text{lerp}(h_{01}, h_{11}, u_x), u_y)
$$

**插值曲线对比**：

| 函数 | 公式 | 特点 |
|---|---|---|
| 线性 | $u$ | 有尖角 |
| Smoothstep | $u^2(3 - 2u)$ | C¹ 平滑，最常用 |
| Smootherstep | $u^3(u(6u - 15) + 10)$ | C² 平滑 |

---

## 3. 梯度噪声 / Perlin 噪声

值噪声用标量哈希，Perlin 用梯度向量哈希。视觉上格子感更弱。

```glsl
vec2 grad(vec2 p) {
    // 用哈希生成 8 方向随机梯度
    float h = hash(p);
    float a = h * 6.28318530718;  // 0~2π
    return vec2(cos(a), sin(a));
}

float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(dot(grad(i + vec2(0,0)), f - vec2(0,0)),
            dot(grad(i + vec2(1,0)), f - vec2(1,0)), u.x),
        mix(dot(grad(i + vec2(0,1)), f - vec2(0,1)),
            dot(grad(i + vec2(1,1)), f - vec2(1,1)), u.x),
        u.y
    );
}
```

---

## 4. Simplex 噪声（略）

Perlin 在高维（3D+）有方向性伪影。Simplex 用单形格而非方格，但实现复杂。**实际项目中值噪声 + fbm 通常够用。**

---

## 5. 分形布朗运动 (fBM)

多层噪声叠加 = 细节自相似。

```glsl
float fbm(vec2 p) {
    float value = 0.0;
    float amp   = 0.5;   // 振幅（每次减半）
    float freq  = 1.0;   // 频率（每次翻倍）
    float lacunarity  = 2.0;   // 频率倍增因子
    float gain        = 0.5;   // 振幅衰减因子

    for (int i = 0; i < 5; i++) {
        value += amp * noise(p * freq);
        freq  *= lacunarity;
        amp   *= gain;
    }
    return value;
}
```

### 参数调参指南

| 参数 | 默认 | 增大效果 |
|---|---|---|
| Octaves (迭代数) | 5~6 | 更多细节，更耗性能 |
| Lacunarity | 2.0 | 细节更密，纹理更"碎" |
| Gain | 0.5 | 细节更明显，画面更"噪" |

### fBM 变体

```glsl
// 山脊噪声 (Ridged)
float ridged(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amp * (1.0 - abs(noise(p)));  // 绝对值取反
        p *= 2.0;
        amp *= 0.5;
    }
    return value;
}

// 湍流 (Turbulence)
float turb(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amp * abs(noise(p));  // 取绝对值
        p *= 2.0;
        amp *= 0.5;
    }
    return value;
}
```

---

## 6. 域扭曲 (Domain Warping)

用噪声扭曲采样坐标，产生流动感——`sea.frag` 里就在用。

```glsl
// 一层扭曲
float warped(vec2 p) {
    vec2 offset = vec2(
        noise(p),
        noise(p + vec2(5.2, 1.3))
    );
    return noise(p + offset * 2.0);
}

// 多层嵌套扭曲（更强流动感）
float warped_fbm(vec2 p) {
    vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2)),
                   fbm(p + 4.0 * q + vec2(8.3, 2.8)));
    return fbm(p + 4.0 * r);
}
```

---

## 7. Voronoi / 细胞噪声

按最近特征点距离着色，产生细胞/石纹/水面网格效果。

```glsl
float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float minDist = 1.0;

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash(i + neighbor);       // 邻格内随机点
            vec2 diff = neighbor + point - f;       // 到随机点的距离
            float d = dot(diff, diff);
            minDist = min(minDist, d);
        }
    }
    return sqrt(minDist);
}

// 返回最近距离和次近距离（做边缘/纹理更丰富）
vec2 voronoi2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float d1 = 1.0, d2 = 1.0;  // 最近、次近

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash(i + neighbor);
            float d = length(neighbor + point - f);
            if (d < d1) { d2 = d1; d1 = d; }
            else if (d < d2) { d2 = d; }
        }
    }
    return vec2(d1, d2);
}
```

---

## 快速选型

| 效果 | 推荐 |
|---|---|
| 云、烟雾 | fBM + 域扭曲 |
| 水面纹理 | 值噪声 + 多层 octave |
| 大理石纹理 | fBM × sin(PI × fBM) |
| 细胞/皮肤/龟裂 | Voronoi |
| 山脊/闪电 | Ridged fBM |
| 火焰/熔岩 | 湍流 fBM + 域扭曲 |
