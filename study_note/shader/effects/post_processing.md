# 后处理效果

> 渲染完主体画面后叠加的"滤镜"——让画面瞬间有电影感。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. Vignette（暗角）

让画面四角变暗，聚焦中心。

```glsl
float vignette(vec2 uv) {
    uv = uv * 2.0 - 1.0; // 映射到 [-1,1]
    return 1.0 - dot(uv, uv) * 0.4; // 中心=1, 四角=0.6
}

// 使用
color *= vignette(st);
```

---

## 2. Bloom（辉光/泛光）

让亮的部分"溢出"到周围。通常需要多 Pass，但单 Pass 可以近似：

### 2.1 简易 Bloom（亮部提取 + 模糊近似）

```glsl
// 提取亮部
float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
vec3 bright = color * smoothstep(0.6, 0.9, brightness);

// 与原始混合
color += bright * 0.4;
```

### 2.2 方向模糊 Bloom

```glsl
vec3 bloom(vec2 uv, float intensity) {
    vec3 col = vec3(0.0);
    float total = 0.0;
    for (float i = -4.0; i <= 4.0; i++) {
        float weight = exp(-i * i / 4.0);
        col += texture2D(..., uv + i * 0.003).rgb * weight;
        total += weight;
    }
    return col / total * intensity;
}
```

---

## 3. 色差（Chromatic Aberration）

R、G、B 通道略微偏移 → 模拟镜头色散。

```glsl
vec3 chromaticAberration(vec2 uv, float amount) {
    vec2 dir = uv - 0.5; // 从中心向外偏移
    float r = texture2D(..., uv + dir * amount * 0.0).r;
    float g = texture2D(..., uv + dir * amount * 0.5).g;
    float b = texture2D(..., uv + dir * amount * 1.0).b;
    return vec3(r, g, b);
}
```

---

## 4. 胶片颗粒 / 噪点

```glsl
float grain(vec2 uv, float time) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233)) + time) * 43758.5453);
}

// 使用
color += (grain(st, u_time) - 0.5) * 0.05; // 强度 0.05
```

---

## 5. 扫描线（CRT 复古效果）

```glsl
float scanline(vec2 uv, float lines) {
    return sin(uv.y * lines * PI * 2.0) * 0.5 + 0.5;
}
color *= mix(0.7, 1.0, scanline(st, 150.0));
```

---

## 6. 色阶化（Posterization）

```glsl
float levels = 8.0;
color = floor(color * levels) / levels;
```

---

## 7. 色调分离（Split Toning）

高光染一种颜色，阴影染另一种。

```glsl
vec3 splitTone(vec3 color, vec3 shadowColor, vec3 highlightColor) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(shadowColor * gray, highlightColor * gray, gray);
}
```

---

## 8. 锐化

```glsl
vec3 sharpen(vec2 uv, float amount) {
    vec3 center = texture2D(..., uv).rgb;
    vec3 top    = texture2D(..., uv + vec2(0.0, 0.002)).rgb;
    vec3 bot    = texture2D(..., uv - vec2(0.0, 0.002)).rgb;
    vec3 left   = texture2D(..., uv - vec2(0.002, 0.0)).rgb;
    vec3 right  = texture2D(..., uv + vec2(0.002, 0.0)).rgb;
    return center + (center * 4.0 - top - bot - left - right) * amount;
}
```

---

## 9. 柔光 / Glow

不区分亮暗，整体柔化：

```glsl
color = mix(color, vec3(1.0), 0.05); // 轻微提亮
// 或
color = color * 0.9 + 0.1; // 淡化对比
```

---

## 10. 完整后处理链

```glsl
vec3 postProcess(vec3 color, vec2 uv) {
    // 1. Bloom
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 bloom = color * smoothstep(0.7, 1.0, luma) * 0.2;
    color += bloom;

    // 2. Vignette
    float vig = 1.0 - length((uv - 0.5) * 1.2) * 0.5;
    color *= vig;

    // 3. 胶片颗粒
    float g = grain(uv, u_time);
    color += (g - 0.5) * 0.03;

    // 4. Gamma
    color = pow(color, vec3(1.0 / 2.2));

    return color;
}
```

---

## 11. 效果速查

```
效果          核心技巧                    强度建议
────────────────────────────────────────────────
暗角          length(uv-0.5)             0.3-0.6
辉光          提取亮部 + 模糊            0.1-0.3
色差          RGB 通道偏移              0.002-0.01
噪点          hash(uv + time)           0.02-0.05
扫描线        sin(uv.y * N)             0.7-0.9
色阶化        floor(color*N)/N          N=4-16
色调分离      mix(shadow, hi, gray)     0.2-0.5
```

---

*最后更新：2026-06-03*
