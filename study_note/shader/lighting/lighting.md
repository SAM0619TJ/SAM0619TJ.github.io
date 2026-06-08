# 光照与着色模型

> 从最简单的 `NdotL` 到 PBR 标准模型。每种模型给出 GLSL 实现。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 基础：Lambert 漫反射

### 公式

$$I = I_{light} \cdot \rho \cdot \max(\mathbf{n} \cdot \mathbf{l},\ 0)$$

```glsl
vec3 lambert(vec3 n, vec3 l, vec3 albedo, vec3 lightColor) {
    float NdotL = max(dot(n, l), 0.0);
    return albedo * lightColor * NdotL;
}
```

问题：背光面完全黑 → 不自然。

---

## 2. 半 Lambert（Valve 的改进）

$$I = I_{light} \cdot \rho \cdot (\mathbf{n} \cdot \mathbf{l} \times 0.5 + 0.5)$$

```glsl
float halfLambert(vec3 n, vec3 l) {
    return dot(n, l) * 0.5 + 0.5;
}
```

- 背光面也有微弱光照
- 常用于风格化渲染（如 Team Fortress 2）
- **不物理**，但好看

---

## 3. Blinn-Phong 镜面反射

### 3.1 Phong（经典）

$$I_s = I_{light} \cdot (\mathbf{r} \cdot \mathbf{v})^{shininess}$$

```glsl
float phong(vec3 n, vec3 l, vec3 v, float shininess) {
    vec3 r = reflect(-l, n);
    return pow(max(dot(r, v), 0.0), shininess);
}
```

### 3.2 Blinn-Phong（优化版）

用**半向量** $\mathbf{h} = normalize(\mathbf{l} + \mathbf{v})$ 替代反射向量：

$$I_s = I_{light} \cdot (\mathbf{n} \cdot \mathbf{h})^{shininess}$$

```glsl
float blinnPhong(vec3 n, vec3 l, vec3 v, float shininess) {
    vec3 h = normalize(l + v);
    return pow(max(dot(n, h), 0.0), shininess);
}
```

| shininess | 效果 |
|-----------|------|
| 1-4 | 哑光 |
| 8-32 | 塑料 |
| 64-256 | 金属/玻璃 |

### 3.3 归一化 Blinn-Phong（能量守恒近似）

$$I_s = I_{light} \cdot \frac{shininess + 8}{8\pi} \cdot (\mathbf{n} \cdot \mathbf{h})^{shininess}$$

```glsl
float blinnPhongNormalized(vec3 n, vec3 l, vec3 v, float s) {
    vec3 h = normalize(l + v);
    return pow(max(dot(n, h), 0.0), s) * (s + 8.0) / (8.0 * PI);
}
```

---

## 4. Fresnel（菲涅尔效应）

### 4.1 Schlick 近似

$$F = F_0 + (1 - F_0)(1 - \mathbf{n} \cdot \mathbf{v})^5$$

```glsl
vec3 fresnelSchlick(vec3 F0, float NdotV) {
    return F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
}
```

| 材质 | F0 (RGB) |
|------|----------|
| 水 | (0.02, 0.02, 0.02) |
| 塑料 | (0.03-0.05) |
| 玻璃 | (0.04, 0.04, 0.04) |
| 金 | (1.00, 0.71, 0.29) |
| 铜 | (0.95, 0.64, 0.54) |
| 铁 | (0.56, 0.57, 0.58) |

### 4.2 简化版（用于风格化）

```glsl
float fresnelSimplified(float NdotV) {
    return pow(1.0 - NdotV, 3.0);
}
```

---

## 5. Cook-Torrance（PBR 微面元模型）

### 5.1 公式

$$f_r = \frac{D \cdot F \cdot G}{4 (\mathbf{n} \cdot \mathbf{l})(\mathbf{n} \cdot \mathbf{v})}$$

三个函数描述微面元的统计行为：

| 函数 | 含义 |
|------|------|
| **D** (Normal Distribution) | 有多少微面元朝向半向量 h |
| **F** (Fresnel) | 有多少光被反射（非折射） |
| **G** (Geometry) | 有多少微面元互相遮挡 |

### 5.2 D: GGX / Trowbridge-Reitz

$$D_{GGX} = \frac{\alpha^2}{\pi((\mathbf{n} \cdot \mathbf{h})^2(\alpha^2 - 1) + 1)^2}$$

```glsl
float D_GGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float d = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
    return a2 / (PI * d * d);
}
```

### 5.3 G: Smith + Schlick-GGX

```glsl
float G_SchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = r * r / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float G_Smith(float NdotV, float NdotL, float roughness) {
    return G_SchlickGGX(NdotV, roughness) * G_SchlickGGX(NdotL, roughness);
}
```

### 5.4 完整 Cook-Torrance BRDF

```glsl
vec3 cookTorrance(vec3 n, vec3 l, vec3 v,
                  vec3 albedo, float roughness, float metallic) {
    vec3 h = normalize(l + v);
    float NdotL = max(dot(n, l), 0.0);
    float NdotV = max(dot(n, v), 0.0);
    float NdotH = max(dot(n, h), 0.0);

    if (NdotL <= 0.0 || NdotV <= 0.0) return vec3(0.0);

    vec3 F0 = mix(vec3(0.04), albedo, metallic); // 金属用 albedo 做 F0
    float D = D_GGX(NdotH, roughness);
    vec3  F = fresnelSchlick(F0, max(dot(h, v), 0.0));
    float G = G_Smith(NdotV, NdotL, roughness);

    vec3 specular = (D * F * G) / max(4.0 * NdotL * NdotV, 0.001);
    vec3 diffuse  = albedo / PI * (1.0 - metallic); // 金属无漫反射
    vec3 kD = (1.0 - F) * (1.0 - metallic);

    return kD * diffuse + specular;
}
```

---

## 6. Oren-Nayar（粗糙漫反射）

Lambert 的改进版，考虑了表面粗糙度对漫反射的影响（如月球表面）。

```glsl
float orenNayar(vec3 n, vec3 l, vec3 v, float roughness) {
    float NdotL = max(dot(n, l), 0.0);
    float NdotV = max(dot(n, v), 0.0);
    float r2 = roughness * roughness;

    float A = 1.0 - 0.5 * r2 / (r2 + 0.57);
    float B = 0.45 * r2 / (r2 + 0.09);

    float s = dot(normalize(l - n * NdotL), normalize(v - n * NdotV));
    return NdotL * (A + B * max(0.0, s) * sqrt((1.0 - NdotL * NdotL) * (1.0 - NdotV * NdotV)) / max(NdotL, NdotV));
}
```

---

## 7. 色调映射 (Tone Mapping)

HDR → LDR 的转换。

### 7.1 Reinhard

$$c_{out} = \frac{c_{in}}{1 + c_{in}}$$

```glsl
vec3 reinhard(vec3 color) {
    return color / (1.0 + color);
}
```

### 7.2 ACES Filmic（电影级）

```glsl
vec3 aces(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
```

| 方法 | 特点 |
|------|------|
| Reinhard | 简单，高光容易偏灰 |
| Uncharted 2 | 电影感，保持色相 |
| ACES | 最自然的高光滚降 |
| 不用 | 高光直接 clip 到 1.0 → 丢失细节 |

---

## 8. 光照模型速选指南

```
你要的效果               →  推荐模型
────────────────────────────────────────
最简单的漫反射            →  Lambert
风格化 / 卡通            →  半Lambert + step()
塑料 / 简单镜面           →  Blinn-Phong (归一化)
写实金属 / 粗糙度可控     →  Cook-Torrance PBR
粗糙表面 (月球/粉笔)      →  Oren-Nayar
水面反射 / 玻璃           →  Fresnel Schlick
HDR 最终输出              →  ACES Tone Mapping
```

---

## 9. 综合示例：多光源 + PBR

```glsl
vec3 shade(vec3 p, vec3 n, vec3 v, vec3 albedo, float roughness, float metallic) {
    vec3 Lo = vec3(0.0);
    for (int i = 0; i < NUM_LIGHTS; i++) {
        vec3 l = normalize(lightPos[i] - p);
        float dist = length(lightPos[i] - p);
        float atten = 1.0 / (dist * dist);
        vec3 Li = lightColor[i] * atten;
        Lo += cookTorrance(n, l, v, albedo, roughness, metallic) * Li * max(dot(n, l), 0.0);
    }
    vec3 ambient = albedo * 0.03; // 环境光
    vec3 color = ambient + Lo;
    return aces(color); // 色调映射
}
```

---

*最后更新：2026-06-03*
