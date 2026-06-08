# Raymarching（光线步进）完全指南

> SDF 的自然延伸 —— 不靠三角形，用数学直接渲染 3D 场景。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 核心思想

```
传统光栅化:  顶点 → 三角形 → 投影 → 片段着色
Raymarching: 屏幕像素 → 发射射线 → 一步步沿射线走 → SDF 测距 → 命中表面
```

每条射线 = 从摄像机穿过像素的 3D 直线。每步用 SDF 问"离最近的物体还有多远"，然后安全地前进该距离。

---

## 2. 摄像机模型

### 2.1 针孔摄像机

```glsl
vec3 getRayDirection(vec2 uv, vec3 camPos, vec3 camTarget) {
    vec3 forward = normalize(camTarget - camPos);
    vec3 right   = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up      = cross(right, forward);

    float fov = 1.5; // 视场角控制
    return normalize(uv.x * right + uv.y * up + fov * forward);
}
```

### 2.2 另一种常用写法（lookAt）

```glsl
mat3 setCamera(vec3 eye, vec3 center, float zoom) {
    vec3 f = normalize(center - eye);
    vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
    vec3 u = cross(r, f);
    // 返回旋转矩阵
    return mat3(r, u, -f);
}
```

---

## 3. 核心步进循环：Sphere Tracing

### 3.1 算法

```glsl
float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0; // 从原点出发的距离
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sceneSDF(p);    // 问 SDF：最近的表面有多远？
        if (d < EPSILON) return t;  // 命中
        if (t > MAX_DIST)  break;   // 超出范围
        t += d;                     // 安全前进 d
    }
    return -1.0; // 未命中
}
```

### 3.2 为什么叫 Sphere Tracing？

每次前进距离 = `sceneSDF(p)` → 相当于以当前点为球心、d 为半径画球 → 球内绝对没有物体 → 安全跳过去。

```
射线 ──●────●────●────●──→
       │↔d↔│↔d↔│↔d↔│
       ╰ 球 ╯   命中!
         (球内空)
```

### 3.3 对比：固定步长 vs Sphere Tracing

| | 固定步长 | Sphere Tracing |
|---|---|---|
| 步长 | 恒定 | 动态 = 到最近表面的距离 |
| 安全性 | 可能穿透薄物体 | 永远不会穿透 |
| 速度 | 在空旷区域浪费步数 | 大步跳过空旷区域 |
| 精度 | 取决于步长 | 自适应 |

---

## 4. SDF 场景搭建

```glsl
float sceneSDF(vec3 p) {
    float sphere   = length(p - vec3(0.0, 0.0, 0.0)) - 0.5;
    float box      = sdBox(p - vec3(1.0, 0.0, 0.0), vec3(0.3));
    float ground   = p.y + 0.6;
    return min(min(sphere, box), ground); // 并集
}
```

---

## 5. 法线计算

从 SDF 求法线：梯度 = 法线方向。

### 5.1 中心差分（6 采样）

```glsl
vec3 calcNormal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
        sceneSDF(p + vec3(eps, 0.0, 0.0)) - sceneSDF(p - vec3(eps, 0.0, 0.0)),
        sceneSDF(p + vec3(0.0, eps, 0.0)) - sceneSDF(p - vec3(0.0, eps, 0.0)),
        sceneSDF(p + vec3(0.0, 0.0, eps)) - sceneSDF(p - vec3(0.0, 0.0, eps))
    ));
}
```

### 5.2 四点差分（4 采样，更快）

```glsl
vec3 calcNormal(vec3 p) {
    float eps = 0.001;
    vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * sceneSDF(p + k.xyy * eps) +
        k.yyx * sceneSDF(p + k.yyx * eps) +
        k.yxy * sceneSDF(p + k.yxy * eps) +
        k.xxx * sceneSDF(p + k.xxx * eps)
    );
}
```

---

## 6. 软阴影

从表面点向光源方向再发射一条射线，SDF 值越小阴影越软。

```glsl
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 64; i++) {
        float h = sceneSDF(ro + rd * t);
        if (h < 0.001) return 0.0;           // 被遮挡
        res = min(res, k * h / t);            // 软阴影公式
        if (t > maxt) break;
        t += h;
    }
    return res;
}
```

| k 值 | 效果 |
|------|------|
| 2 | 非常软的阴影 |
| 8 | 适中的软影 |
| 32 | 接近硬阴影 |

---

## 7. 环境光遮蔽 (AO)

从表面点向法线方向的半球随机采样：

```glsl
float ambientOcclusion(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = sceneSDF(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}
```

---

## 8. 完整渲染循环模板

```glsl
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // 1. 摄像机
    vec3 ro = vec3(0.0, 1.0, 5.0);
    vec3 rd = normalize(vec3(uv, -1.5));

    // 2. Raymarch
    float t = rayMarch(ro, rd);
    vec3 color;

    if (t < 0.0) {
        color = vec3(0.3, 0.5, 0.9); // 天空
    } else {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 l = normalize(vec3(1.0, 2.0, -1.0));

        // 3. 光照
        float diff = max(dot(n, l), 0.0);
        float shadow = softShadow(p + n * 0.01, l, 0.02, 5.0, 8.0);
        float ao = ambientOcclusion(p, n);

        color = vec3(0.8) * diff * shadow * ao;
    }

    gl_FragColor = vec4(color, 1.0);
}
```

---

## 9. 高度图步进 vs Sphere Tracing

你的 `sea.frag` 用了一种特殊形式：

| | Sphere Tracing | Height-map Tracing (sea.frag) |
|---|---|---|
| 场景定义 | 任意 3D SDF | 高度场 $y = h(x,z)$ |
| 步进策略 | 步长 = 到最近表面距离 | 二分法 / Secant Method |
| 适用场景 | 任意 3D 形状 | 地形、海面 |
| 速度 | 慢（每步调 SDF） | 快（32 步即可收敛） |
| 能否处理悬垂 | ✅ | ❌（高度场只能单值） |

---

## 10. 常见参数调优

| 参数 | 典型值 | 说明 |
|------|--------|------|
| `MAX_STEPS` | 64-256 | 越多越精确越慢 |
| `MAX_DIST` | 50-200 | 最远能看到多远 |
| `EPSILON` | 0.001 | 命中判定精度 |
| 法线 `eps` | 0.001-0.01 | 太小→数值误差，太大→模糊 |
| 软阴影 `k` | 4-32 | 越小越软 |

---

## 11. 进阶技巧

- **用 `fwidth` 自适应 EPSILON**：远处自动增大精度阈值
- **多次步进 + 二分细化**：先用大步长找到区间，再用二分法精确求交
- **包围盒加速**：先用 AABB SDF 剔除远处物体
- **Mandelbulb**：把分形当 SDF 用，ray march 纯分形世界

---

## 12. 分形光线步进高级技巧

> 以下技巧来自一个 raymarching 分形隧道示例（十字交叉盒子 + 无限平铺 + 辉光累积）。

### 12.1 空间重复 — `mod` 无限平铺

用 `mod` 将坐标空间分割成无限重复的单元：

```glsl
// 将任意坐标映射到 [-repeat, repeat] 区间
pos = mod(pos + repeat, repeat * 2.0) - repeat;
```

**原理**：每个 3D 空间中的点都被"折叠"回同一个参考单元中，光线每步都会重新映射 → 同一个 box_set 图案无限重复，形成无限隧道。

| 参数 | 效果 |
|------|------|
| `repeat` 越小 | 图案越密集，重复越快 |
| `repeat` 越大 | 图案越稀疏 |

---

### 12.2 时间深度偏移 — 波动分形核心

**让每步光线的时间不同**，产生分形的"呼吸/波动"效果：

```glsl
// 每步减去一个小偏移，深度越深时间越"早"
gTime = iTime - float(i) * 0.01;
```

```glsl
// 场景中所有动态元素都基于 gTime 而非 iTime
pos.y += sin(gTime * 0.4) * 2.5;  // 盒子位置振荡
float s = 2.0 - abs(sin(gTime * 0.4)) * 1.5;  // 缩放振荡
```

**视觉效果**：离摄像机越近的层时间越接近当前时间，越远的层时间越早 → 产生波浪般传播的动画，类似"时间涟漪"。

---

### 12.3 空心化 SDF — `abs()` 技巧

将 SDF 的值取绝对值，使**物体内部也产生距离场**：

```glsl
d = max(abs(d), 0.01);
```

**效果对比**：

| | 普通 SDF | `abs(d)` 后 |
|---|---|---|
| 内部 | 负值（光线已穿透） | 正值（继续有距离） |
| 光线行为 | 穿过内部不再有反应 | 内外都产生辉光和步进 |
| 视觉 | 实心物体 | 空心轮廓 / 线框感 |

加上 `max(..., 0.01)` 保证最小步长，防止光线因距离过小停滞。

---

### 12.4 距离辉光累积

在 raymarching 循环中累积表面的"接近度"：

```glsl
float ac = 0.0;

for (int i = 0; i < 99; i++) {
    // ... 步进计算 d ...
    d = max(abs(d), 0.01);
    ac += exp(-d * 23.0);  // 越接近表面贡献越大
    t += d * 0.55;
}

vec3 col = vec3(ac * 0.02);  // 辉光亮度
```

**公式解读**：
- `exp(-d * 23.0)`：d 越接近 0，值越接近 1.0；d > 0.3 时几乎为 0
- 乘 `0.02`：平衡累积值到可视范围
- 结果：表面边缘产生明亮的发光效果，类似**霓虹灯管**

---

### 12.5 符号反转与 `max` 并集

反转 SDF 符号，使常规的 `min`（并集）变为 `max`：

```glsl
float box(vec3 pos, float scale) {
    pos *= scale;
    float base = sdBox(pos, vec3(0.4, 0.4, 0.1)) / 1.5;
    return -base;  // ← 符号反转：内部为正，外部为负
}

// 组合时用 max（因为符号反转了，max 等价于并集）
return max(max(max(max(max(b1, b2), b3), b4), b5), b6);
```

当与 `abs()` 空心化配合时，盒子的**内外边缘都会产生辉光**，形成发光的框体效果。

---

### 12.6 完整示例模板

```glsl
// 摄像机前进 + 摇摆
vec3 ro = vec3(0.0, -0.2, iTime * 4.0);
vec3 ray = normalize(vec3(p, 1.5));
ray.xy *= rot(sin(iTime * 0.03) * 5.0);   // 水平摇摆
ray.yz *= rot(sin(iTime * 0.05) * 0.2);   // 垂直微摆

float t = 0.1;
float ac = 0.0;

for (int i = 0; i < 99; i++) {
    vec3 pos = ro + ray * t;
    pos = mod(pos - 2.0, 4.0) - 2.0;          // 空间重复
    gTime = iTime - float(i) * 0.01;           // 时间偏移

    float d = sceneSDF(pos);
    d = max(abs(d), 0.01);                     // 空心化
    ac += exp(-d * 23.0);                      // 辉光累积
    t += d * 0.55;
}

// 着色
vec3 col = vec3(ac * 0.02);
col += vec3(0.0, 0.2 * abs(sin(iTime)), 0.5 + sin(iTime) * 0.2);
```

---

*最后更新：2026-06-04*
