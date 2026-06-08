# 2D 图案生成技术

> 不用纹理，纯数学绘制图案 —— Moiré、Truchet、万花筒、伊斯兰几何花纹。

[← Shader 索引](study_note/shader/index.html) · [速查导航](md.html?file=study_note/shader/速查.md)

---

## 1. Moiré 条纹

两个规则图案叠加产生干涉条纹。

```glsl
float moire(vec2 uv) {
    // 两组同心圆
    float c1 = length(uv - vec2(0.5, 0.5));
    float c2 = length(uv - vec2(0.55, 0.45));
    return abs(sin(c1 * 60.0) + sin(c2 * 60.0)) * 0.5;
}
```

---

## 2. Truchet 瓷砖

将空间分为网格，每格随机选择两种旋转方向的图案。

```glsl
float truchet(vec2 uv) {
    vec2 id = floor(uv * 4.0);
    vec2 gv = fract(uv * 4.0);

    float rnd = hash21(id);
    float angle = rnd > 0.5 ? 0.0 : PI * 0.5;

    float s = sin(angle), c = cos(angle);
    gv = (gv - 0.5) * mat2(c, -s, s, c) + 0.5;

    // 四分之一圆弧
    float arc = abs(length(gv - vec2(0.0)) - 0.5);
    arc = min(arc, abs(length(gv - vec2(1.0)) - 0.5));

    return smoothstep(0.02, 0.0, arc);
}
```

---

## 3. 万花筒（Kaleidoscope）

将空间折叠到单个扇区，自动产生对称图案。

```glsl
vec2 kaleidoscope(vec2 uv, float segments) {
    float angle = atan(uv.y, uv.x);
    angle = mod(angle, 2.0 * PI / segments);     // 折叠到 1 个扇区
    angle = abs(angle - PI / segments);           // 再次镜像
    float r = length(uv);
    return vec2(cos(angle), sin(angle)) * r;
}

// 用法
vec2 k = kaleidoscope(st - 0.5, 6.0); // 6 瓣对称
float d = sdCircle(k, 0.3);
```

---

## 4. 伊斯兰几何花纹

用空间折叠 + SDF 画星形和多边形：

```glsl
float islamicPattern(vec2 p) {
    // 6 次旋转对称
    p = kaleidoscope(p, 6.0);

    // 星形
    float star = sdStar5(p, 0.3, 0.5);

    // 外接圆
    float circle = length(p) - 0.35;
    circle = abs(circle) - 0.01; // 圆环

    return min(star, circle);
}
```

---

## 5. 基于 `mod` 的重复图案

```glsl
// 网格重复
vec2 tile(vec2 uv, float cols, float rows) {
    return fract(uv * vec2(cols, rows));
}

// 砖墙错位重复
vec2 brickTile(vec2 uv, float cols, float rows) {
    vec2 id = floor(uv * vec2(cols, rows));
    if (mod(id.y, 2.0) < 1.0) {
        uv.x += 0.5 / cols;
    }
    return fract(uv * vec2(cols, rows));
}
```

---

## 6. Thue-Morse 序列图案

基于二进制位数的奇偶性：

```glsl
float thueMorse(vec2 uv) {
    int n = int(uv.x * 16.0) + int(uv.y * 16.0) * 16;
    // 计算 n 的二进制中 1 的个数
    int count = 0;
    for (int i = 0; i < 16; i++) {
        if ((n & (1 << i)) != 0) count++;
    }
    return mod(float(count), 2.0);
}
```

---

## 7. 极坐标图案

```glsl
// 螺旋
float spiral(vec2 p) {
    float r = length(p);
    float a = atan(p.y, p.x);
    return sin(a * 8.0 + r * 20.0) * 0.5 + 0.5;
}

// 花瓣
float flower(vec2 p, int petals) {
    float a = atan(p.y, p.x);
    float r = length(p);
    return sin(a * float(petals)) * 0.5 + 0.5;
}
```

---

## 8. 闪电 / 分叉图案

```glsl
float lightning(vec2 p, float time) {
    float d = 1e10;
    p.x += sin(p.y * 5.0 + time) * 0.1;
    for (float i = 0.0; i < 1.0; i += 0.1) {
        float seg = abs(p.x - sin(p.y * 8.0 + i * 10.0 + time) * 0.2);
        d = min(d, seg);
    }
    return 1.0 - smoothstep(0.0, 0.02, d);
}
```

---

## 9. 分形图案（逃逸时间法之外）

### 9.1 谢尔宾斯基地毯

```glsl
float sierpinskiCarpet(vec2 uv) {
    vec2 p = uv * 3.0;
    for (int i = 0; i < 5; i++) {
        p = fract(p) * 3.0;
        if (p.x > 1.0 && p.y > 1.0 && p.x < 2.0 && p.y < 2.0) return 0.0;
    }
    return 1.0;
}
```

### 9.2 圆形铺砌（Circle Packing）

```glsl
float circlePack(vec2 uv) {
    vec2 gv = fract(uv * 5.0) - 0.5;
    vec2 id = floor(uv * 5.0);
    // 每隔一行偏移
    if (mod(id.y, 2.0) < 1.0) gv.x += 0.5;
    gv = fract(gv) - 0.5;
    return 1.0 - step(0.4, length(gv));
}
```

---

## 10. 图案工具箱速查

```
效果              核心技术
────────────────────────────────────
Moiré             两个 sin 图案叠加
Truchet           网格 + hash + 旋转选择
万花筒             atan + mod + abs
伊斯兰花纹         万花筒 + SDF 星形
网格重复           fract(uv * N)
砖墙               mod(id.y, 2) 行偏移
螺旋               sin(angle * N + radius * M)
花瓣               sin(angle * petals)
闪电               min(多个线段距离)
谢尔宾斯基地毯     for + fract 递归
```

---

*最后更新：2026-06-03*
