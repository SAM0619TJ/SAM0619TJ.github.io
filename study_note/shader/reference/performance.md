# Shader 性能优化指南

> 在移动端 / GLSL ES 环境下，性能尤为重要。以下技巧帮你避免掉帧。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 精度选择

```glsl
// ✅ 能用低精度就用低精度
precision mediump float;  // 中等精度，移动端首选

// 只在必要时用高精度
// precision highp float;
```

| 精度 | 范围 | 适用 |
|------|------|------|
| `lowp` | -2~2, 1/256 | 颜色（几乎不用） |
| `mediump` | -2¹⁴~2¹⁴, 1/1024 | **默认推荐** |
| `highp` | full float | 位置、大坐标 |

---

## 2. 避免分支（Branching）

GPU 的 SIMD 架构对 `if` 不友好——同一个 warp 内的线程如果分支不同，会串行执行两条路径。

```glsl
// ❌ 避免
if (condition) {
    result = expensiveCalc1();
} else {
    result = expensiveCalc2();
}

// ✅ 用 step / smoothstep / mix 代替
float mask = step(0.0, condition);
result = mix(expensiveCalc2(), expensiveCalc1(), mask);
```

但 `discard` 是例外——它能真正跳过后续计算。

---

## 3. 减少循环

```glsl
// ❌ 循环过多
for (int i = 0; i < 200; i++) { ... }

// ✅ 合理上限
#define MAX_ITER 64

// ✅ 提前退出
for (int i = 0; i < MAX_ITER; i++) {
    if (dist < EPSILON) break;  // 命中就停
    if (t > MAX_DIST)   break;  // 超出范围就停
}
```

---

## 4. 利用 `fwidth`

`fwidth(x)` = `abs(dFdx(x)) + abs(dFdy(x))` —— 屏幕空间导数。

它是**自适应精度的关键**：远处自动放宽精度，近处自动收紧。

```glsl
// ❌ 固定模糊宽度
float aa = 0.002;

// ✅ 自适应（远处不闪烁，近处不模糊）
float aa = fwidth(d) * 1.5;
```

`fwidth` 的原理：GPU 以 2×2 像素为一组执行，`fwidth` 取相邻像素间的差值 → 该值自然反映了"这个像素上的图案变化有多快"。

---

## 5. 减少函数调用

```glsl
// ❌ 每步都算 noise
for (int i = 0; i < 5; i++) {
    float n = noise(p * freq); // noise 内部有 hash + floor + mix
}

// ✅ 如果可以，复用中间结果
float n0 = noise(p);
for (int i = 0; i < 5; i++) {
    // 复用或做更轻量的操作
}
```

---

## 6. 使用内置函数

内置函数通常比手写快很多：

```glsl
// ✅ 用内置
float d = length(v);
float n = normalize(v);
float c = clamp(x, 0.0, 1.0);

// ❌ 不要手写
float d = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
```

---

## 7. 减少纹理采样

纹理采样是 shader 中最昂贵的操作之一。

```glsl
// ❌ 多次采样同一位置
float r = texture2D(tex, uv).r;
float g = texture2D(tex, uv).g;

// ✅ 一次采样
vec4 texel = texture2D(tex, uv);
float r = texel.r;
float g = texel.g;
```

---

## 8. 常数折叠

编译器会自动优化常量表达式，但尽量写清楚：

```glsl
// ✅ 编译器会优化
const float PI = 3.14159265;
float tau = PI * 2.0; // const 传播，编译时计算

// ✅ 预计算
const float SQRT3 = 1.7320508; // 不要写成 sqrt(3.0)
```

---

## 9. 反向思考：先算便宜的

```glsl
// ✅ 先用便宜的判断筛掉大部分像素
void main() {
    float dist = length(st - 0.5);
    if (dist > 0.6) {  // 便宜的判断
        // 60% 的像素直接走这里，不进入昂贵计算
        gl_FragColor = vec4(bgColor, 1.0);
        return;
    }
    // 复杂计算只对中心 40% 的像素执行
    ...
}
```

---

## 10. 移动端特别注意事项

| 问题 | 说明 | 对策 |
|------|------|------|
| `mediump` 精度不足 | 屏幕坐标 > 1024 时闪烁 | 关键计算用 `highp` |
| for 循环展开 | 某些 GPU 不允许动态循环 | 用常量上限 `const int MAX` |
| `discard` 性能 | 某些 GPU 上 `discard` 会禁用 early-Z | 谨慎使用 |
| `sin/cos` 精度 | `mediump sin` 精度比 `highp` 差很多 | 必要时用 `highp` 声明局部变量 |

---

## 11. 性能检查清单

```
□ 用 mediump 而非 highp（除非必要）
□ 用 fwidth 做自适应抗锯齿
□ for 循环有上限且能提前退出
□ 用 step/smoothstep/mix 代替 if/else
□ 昂贵计算之前先做便宜的筛选
□ 用内置函数（length, normalize, clamp）
□ 尽可能复用中间计算结果
□ 纹理只采样一次，存到变量里
□ 常量预计算，不要运行时算 sqrt(3.0)
```

---

*最后更新：2026-06-03*
