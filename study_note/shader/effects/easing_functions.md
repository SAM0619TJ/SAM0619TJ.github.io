# 缓动函数 (Easing Functions)

> 让动画从"匀速机械"变成"自然有机"。所有函数输入 $t \in [0,1]$，输出也在 $[0,1]$。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. 为什么需要缓动？

```
匀速:     ●──●──●──●──●    (机械、生硬)
缓入:     ··●─●──●───●    (慢慢加速)
缓出:     ●───●──●─●··    (慢慢减速)
缓入缓出: ··●─●──●─●··    (两端慢、中间快 → 最自然)
```

---

## 2. 幂函数族

### 2.1 缓入 (Ease In)

$$f(t) = t^n$$

```glsl
float easeIn(float t, float n) {
    return pow(t, n);
}
```

| n | 效果 |
|----|------|
| 2 | 二次缓入 |
| 3 | 三次缓入 |
| 5 | 强烈缓入 |

### 2.2 缓出 (Ease Out)

$$f(t) = 1 - (1 - t)^n$$

```glsl
float easeOut(float t, float n) {
    return 1.0 - pow(1.0 - t, n);
}
```

### 2.3 缓入缓出 (Ease In Out)

```glsl
float easeInOut(float t, float n) {
    t *= 2.0;
    if (t < 1.0) return 0.5 * pow(t, n);
    return 1.0 - 0.5 * pow(2.0 - t, n);
}
```

---

## 3. Smoothstep（Hermite 缓入缓出）

你已经很熟悉了——`smoothstep` 就是 GLSL 内置的缓入缓出。

$$f(t) = 3t^2 - 2t^3$$

```glsl
float ease = smoothstep(0.0, 1.0, t);
```

**更平滑版（5 次多项式）：**

$$f(t) = 6t^5 - 15t^4 + 10t^3$$

```glsl
float easeSmooth5(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
```

---

## 4. 弹性 (Elastic)

超出目标再弹回来。

```glsl
float easeOutElastic(float t) {
    if (t == 0.0 || t == 1.0) return t;
    return pow(2.0, -10.0 * t) * sin((t - 1.0) * 5.0 * PI) + 1.0;
}
```

---

## 5. 回弹 (Back)

先反方向运动再前进。

```glsl
float easeOutBack(float t) {
    float s = 1.70158;
    return (t - 1.0) * (t - 1.0) * ((s + 1.0) * (t - 1.0) + s) + 1.0;
}
```

---

## 6. 弹跳 (Bounce)

```glsl
float easeOutBounce(float t) {
    if (t < 1.0 / 2.75)      return 7.5625 * t * t;
    else if (t < 2.0 / 2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
    else if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
    else                     return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
}
```

---

## 7. 曲线对比

```
t:  0.0    0.25    0.5     0.75    1.0
─────────────────────────────────────────
线性       │     │     │     │     │
缓入       │   │  │   │   │   │
缓出       │   │   │   │  │   │
缓入缓出   │  │  │  │   │  │  │
弹性缓出   │  │  │ ╱‾‾╲ │  │  │ (过冲)
回弹       │╲ │  │   │  │  │ (先退后进)
弹跳       ││ │╲│ │╲│╲│││ (多次反弹)
```

---

## 8. 实用技巧：分段缓动

不是所有动画都要从 0→1。可以用 `clamp` 截取中间一段：

```glsl
float t = clamp((u_time - startTime) / duration, 0.0, 1.0);
float eased = easeInOut(t, 3.0);

// 在 eased 的 [0,1] 之间映射到实际值
float value = mix(startValue, endValue, eased);
```

---

## 9. 二维缓动

对 x 和 y 分别用不同的缓动 → 有趣的运动路径：

```glsl
float tx = easeInOut(fract(u_time * 0.3), 3.0);
float ty = easeOutElastic(fract(u_time * 0.5));
vec2 pos = mix(vec2(-0.5, -0.5), vec2(0.5, 0.5), vec2(tx, ty));
```

---

## 10. 在 shader 中的应用

```glsl
// 呼吸效果
float breathe = 0.5 + 0.5 * sin(u_time * 2.0);
breathe = easeInOut(breathe, 2.0); // 更柔和的呼吸

// 淡入
float fadeIn = smoothstep(0.0, 1.0, fract(u_time * 0.1));

// 脉冲（心跳）
float beat = fract(u_time);
float heartbeat = 1.0 - pow(1.0 - beat, 3.0);
heartbeat *= step(beat, 0.3); // 只在 0-0.3 区间
```

---

## 11. 速查

```
感觉              函数
─────────────────────────────────
平滑加速           easeIn(t, n); n=2~5
平滑减速           easeOut(t, n); n=2~5
最自然的过渡       smoothstep(0,1,t)
更顺滑的过渡       t*t*t*(t*(t*6-15)+10)
有弹性             easeOutElastic(t)
有回弹             easeOutBack(t)
弹跳落地           easeOutBounce(t)
```

---

*最后更新：2026-06-03*
