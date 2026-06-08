# 法线计算 (Normal Computation)

> 有 SDF 就有法线——法线是光照、反射、折射的前提。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 什么是法线

法线是表面朝外的单位向量 $n$。在 SDF 渲染中，法线 = SDF 的**梯度方向**：

$$
n = \frac{\nabla f(p)}{|\nabla f(p)|}
$$

---

## 2. 数值差分法（最常用）

### 前向差分

```glsl
vec3 calcNormal(vec3 p) {
    const float eps = 0.001;  // 或 EPSILON_NRM
    return normalize(vec3(
        map(p + vec3(eps, 0.0, 0.0)) - map(p),
        map(p + vec3(0.0, eps, 0.0)) - map(p),
        map(p + vec3(0.0, 0.0, eps)) - map(p)
    ));
}
```

**问题**：在距离场中心求值 `map(p)` 3 次，共 6 次 `map()`。

### 优化：只求 4 次

```glsl
// sea.frag 用的方法——先求中心值，避免重复
vec3 calcNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map(p);                                 // 只算 1 次
    n.x = map(vec3(p.x + eps, p.y, p.z)) - n.y;   // +1
    n.z = map(vec3(p.x, p.y, p.z + eps)) - n.y;   // +1
    n.y = eps;                                     // 直接用 eps 梯度
    return normalize(n);
}
// 共 3 次 map()
```

### 中心差分（更精确）

```glsl
vec3 calcNormalCentral(vec3 p, float eps) {
    return normalize(vec3(
        map(p + vec3(eps, 0, 0)) - map(p - vec3(eps, 0, 0)),
        map(p + vec3(0, eps, 0)) - map(p - vec3(0, eps, 0)),
        map(p + vec3(0, 0, eps)) - map(p - vec3(0, 0, eps))
    ));
}
// 精度高，但 6 次 map()
```

---

## 3. eps 的选择

| 场景 | 推荐 eps | 理由 |
|---|---|---|
| 常规 | `0.001` ~ `0.01` | 通用 |
| 距离相关的 eps | `dot(dist, dist) * 0.1 / res.x` | 远近自适应，`sea.frag` 用的方法 |
| 微观细节 | `0.0001` | 减少平滑化 |
| 大场景 | `0.1` | 比噪声尺度大 |

**原则**：eps 太小 → 浮点误差；eps 太大 → 细节丢失。

---

## 4. 解析法线（不常用）

某些 SDF 可以直接求解析梯度，但大多数组合体不值得。

```glsl
// 球体的解析法线：直接从球心指向表面点
vec3 sphereNormal(vec3 p, vec3 center) {
    return normalize(p - center);
}
```

---

## 5. 法线可视化

调试法线的三种方式：

### 直接输出法线作为颜色
```glsl
vec3 n = calcNormal(p, 0.001);
fragColor = vec4(n * 0.5 + 0.5, 1.0);  // 映射 [-1,1] → [0,1]
```

### 伪彩色（分量独立显示）
```glsl
fragColor = vec4(abs(n), 1.0);
// R = |nx|, G = |ny|, B = |nz|
// ● ny 大 = 顶面 = 绿色
// ● nx 大 = 侧面 = 红色
// ● nz 大 = 前面 = 蓝色
```

### 法线 + 固定光照验证
```glsl
vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
float diffuse = max(dot(n, lightDir), 0.0);
fragColor = vec4(vec3(diffuse), 1.0);
```

---

## 6. 常见陷阱

### 渐进式曲面（高度场 raymarching）

`sea.frag` 的场景——法线用 `map_detailed`（比 raymarching 更多 octave）：

```glsl
// sea.frag 的做法：raymarch 用 3 层，法线用 5 层
float map(vec3 p) { /* ... 3 octaves ... */ }        // 给 raymarching
float map_detailed(vec3 p) { /* ... 5 octaves ... */ } // 给法线

vec3 getNormal(vec3 p, float eps) {
    // 用 map_detailed 而非 map，获取更多表面细节
}
```

### 法线翻转

如果光照反了，法线取反：
```glsl
n = -n;  // 或 normalize(-n)
```

### eps 方向选择

不要忽略 `p.y` 方向的差分——`sea.frag` 里的 `n.y = eps` 是一种优化假设（高度场法线主要依赖 xz 差分）。对一般 3D SDF，三个方向都要差分。

---

## 7. 性能对照

| 方法 | map() 调用次数 | 精度 | 场景 |
|---|---|---|---|
| 前向差分（优化版） | 3 | 一般 | 大多数项目 |
| 前向差分（naive） | 6 | 一般 | 不推荐 |
| 中心差分 | 6 | 高 | 需要高精度时 |
| 解析法线 | 0 | 精确 | 仅简单几何体 |
