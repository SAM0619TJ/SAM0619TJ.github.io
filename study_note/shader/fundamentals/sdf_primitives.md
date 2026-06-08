# SDF 基本图元速查表 (SDF Primitives)

> Signed Distance Function：返回到最近表面的有符号距离。正=外部，负=内部，0=表面。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 2D SDF

### 圆
```glsl
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}
```

### 圆角矩形
```glsl
float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}
```

### 线段
```glsl
float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}
```

### 等边三角形
```glsl
float sdEquilateralTriangle(vec2 p, float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}
```

### 星形
```glsl
float sdStar5(vec2 p, float r, float rf) {
    // r=外半径, rf=内半径比(0~1)
    const vec2 k1 = vec2(0.809016994375, 0.587785252292);
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

## 2. 3D SDF

### 球
```glsl
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}
```

### 立方体
```glsl
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
```

### 圆角立方体
```glsl
float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}
```

### 环面 (Torus)
```glsl
float sdTorus(vec3 p, vec2 t) {
    // t.x = 大半径, t.y = 小半径
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}
```

### 胶囊 / 线段
```glsl
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
```

### 圆柱（无限）
```glsl
float sdCylinder(vec3 p, float r) {
    return length(p.xz) - r;
}
```

### 圆柱（有限高）
```glsl
float sdCappedCylinder(vec3 p, float r, float h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
```

### 圆锥
```glsl
float sdCone(vec3 p, vec2 c, float h) {
    // c = (sin(angle), cos(angle))
    vec2 q = h * vec2(c.x / c.y, -1.0);
    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
    vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
    return sqrt(d) * sign(s);
}
```

### 平面（无限）
```glsl
float sdPlane(vec3 p, vec3 n, float d) {
    // n = 法线, d = 到原点距离
    return dot(p, n) - d;
}
```

---

## 3. SDF 组合运算

### 并集 (Union) — 两物体合并
```glsl
float opUnion(float d1, float d2) {
    return min(d1, d2);
}
```

### 差集 (Subtraction) — 挖洞
```glsl
float opSubtract(float d1, float d2) {
    return max(-d1, d2);  // d1 被 d2 挖去
}
```

### 交集 (Intersection)
```glsl
float opIntersect(float d1, float d2) {
    return max(d1, d2);
}
```

### 平滑并集 (Smooth Blend)
```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}
```

### 平滑差集
```glsl
float opSmoothSubtract(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}
```

### 平滑交集
```glsl
float opSmoothIntersect(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}
```

---

## 4. SDF 变换

在计算 SDF **之前**变换采样点：

```glsl
// 平移：直接加减
p -= vec3(1.0, 0.0, 0.0);  // 物体右移 1

// 旋转：乘旋转矩阵
p *= mat2(cos(a), -sin(a), sin(a), cos(a));  // 绕 z 轴

// 缩放：除以 scale（法线需要特殊处理，见 raymarching.md）
p /= 2.0;  // 物体放大 2 倍

// 镜像对称（无限重复）
p = abs(p) - 0.5;  // 对原点镜像

// 有限重复
float c = 2.0;
vec3 q = mod(p, c) - 0.5 * c;
// 然后用 q 代替 p 计算 SDF
```

---

## 5. 距离估算优化

raymarching 中不需要精确距离，"低估但不为负"即可：

```glsl
// 不精确但高效的估算（用曼哈顿距离代替欧氏距离）
float sdBoxFast(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return max(q.x, max(q.y, q.z));  // 比精确 SDF 更快
}
```

---

## 可视化调试技巧

将距离场映射到颜色来验证 SDF：

```glsl
float d = sdTorus(p, vec2(0.5, 0.2));
// 在表面附近画轮廓线
float line = abs(d) < 0.01 ? 1.0 : 0.0;
// 或平滑高亮
float glow = exp(-abs(d) * 50.0);
```
