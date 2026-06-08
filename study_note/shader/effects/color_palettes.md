# 色彩与调色板

> 在 shader 中生成、变换、映射颜色。数学 = 美感的配方。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 色彩空间

### 1.1 RGB

最直接的空间，硬件原生。问题是 RGB 的三个通道**不感知均匀**——等量变化在人眼中不是等量亮度变化。

### 1.2 HSV / HSL

```glsl
// RGB → HSV
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV → RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
```

用途：固定 S/V，只变 H → 饱和度/亮度恒定的彩虹。

---

## 2. IQ 的 cos 调色板

Inigo Quilez 的经典技巧——用三个不同相位的余弦波生成自然调色板：

$$color(t) = a + b \cdot \cos(2\pi(c \cdot t + d))$$

```glsl
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}
```

| 预设名 | a | b | c | d |
|--------|---|---|---|---|
| 日落 | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (1.0,1.0,1.0) | (0.0,0.33,0.67) |
| 海洋 | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (2.0,1.0,0.0) | (0.5,0.2,0.25) |
| 森林 | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (1.0,1.0,0.5) | (0.0,0.1,0.2) |
| 火焰 | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (1.0,0.5,0.0) | (0.0,0.15,0.2) |
| 赛博朋克 | (0.2,0.5,0.8) | (0.8,0.3,0.2) | (2.0,1.0,0.5) | (0.0,0.4,0.8) |

```glsl
// 用法：t 在 [0,1] 之间扫描整条调色板
vec3 col = palette(st.x, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0,0.33,0.67));
```

---

## 3. 渐变映射 (Gradient Mapping)

把灰度值映射到彩色：先算出亮度，然后用亮度去查渐变色。

```glsl
vec3 gradientMap(float t) {
    // 3-色渐变: t=0→红, t=0.5→绿, t=1→蓝
    return mix(
        mix(vec3(1,0,0), vec3(0,1,0), smoothstep(0.0, 0.5, t)),
        vec3(0,0,1),
        smoothstep(0.5, 1.0, t)
    );
}

// 用法
float gray = fbm(st);  // 某种灰度图案
vec3 col = gradientMap(gray);
```

---

## 4. Gamma 校正

### 4.1 问题

显示器对电压的响应不是线性的 → 直接在 shader 里算出的线性颜色，显示出来偏暗。

### 4.2 解决方法

```glsl
// 线性 → sRGB（输出前做）
vec3 linearToSRGB(vec3 c) {
    return pow(c, vec3(1.0 / 2.2));
}

// sRGB → 线性（输入纹理时做）
vec3 sRGBToLinear(vec3 c) {
    return pow(c, vec3(2.2));
}
```

```glsl
// 在 main 最后
vec3 color = ...;  // 所有计算在线性空间
gl_FragColor = vec4(pow(color, vec3(0.4545)), 1.0); // ≈ 1/2.2
```

---

## 5. 常用颜色操作

### 5.1 去饱和

```glsl
float gray = dot(color, vec3(0.299, 0.587, 0.114)); // 人眼感知亮度
vec3 desaturated = mix(color, vec3(gray), amount);
```

### 5.2 对比度

```glsl
vec3 contrast(vec3 c, float amount) {
    return (c - 0.5) * amount + 0.5;
}
```

### 5.3 亮度

```glsl
vec3 brighter = color * 1.5;
vec3 darker   = color * 0.5;
// 或保持色相
float h = rgb2hsv(color).x;
float s = rgb2hsv(color).y;
float v = rgb2hsv(color).z * factor;
vec3 adjusted = hsv2rgb(vec3(h, s, clamp(v, 0.0, 1.0)));
```

---

## 6. 彩虹色

```glsl
vec3 rainbow(float t) {
    // t ∈ [0, 1]
    return hsv2rgb(vec3(t, 1.0, 1.0));
}

// 基于角度的彩虹
vec3 angleRainbow(vec2 p) {
    float angle = atan(p.y, p.x) / (2.0 * PI) + 0.5;
    return hsv2rgb(vec3(fract(angle), 1.0, 1.0));
}
```

---

## 7. 色温 / 冷暖

```glsl
// 色温: 0=冷(蓝) → 1=暖(橙)
vec3 temperature(float t) {
    return mix(
        vec3(0.1, 0.3, 0.8),  // 冷
        vec3(0.9, 0.5, 0.1),  // 暖
        t
    );
}
```

---

## 8. 快速参考

```
效果              代码
─────────────────────────────────────────
彩虹循环          hsv2rgb(vec3(t, 1, 1))
自然调色板        palette(t, a, b, c, d)
渐变映射          mix(mix(a,b,t1), c, t2)
Gamma 校正        pow(color, 1.0/2.2)
去饱和            mix(color, gray, amt)
对比度            (color-0.5)*amt+0.5
暖色/冷色         mix(blue, orange, t)
灰度              dot(color, vec3(0.299,0.587,0.114))
```

---

*最后更新：2026-06-03*
