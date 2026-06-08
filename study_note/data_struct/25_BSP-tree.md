# BSP-tree（二叉空间分割）

> **一句话**：用任意平面递归切分空间，可确定静态室内的绘制顺序。
>
> 关键词：`BSP` `空间分割` `画家算法` `CSG`

[← 数据结构索引](study_note/data_struct/index.html) · [空间索引概览](md.html?file=study_note/data_struct/22_空间索引概览.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 分割面 | 任意朝向平面（不限轴对齐） |
| 子树 | 前侧（front）/ 后侧（back） |
| 渲染 | 视点决定遍历顺序，近似正确深度 |
| 现代引擎 | 多让位于 Z-buffer + BVH |
| 强项 | 室内关卡、CSG 布尔、无深度缓冲时代 |

---

## 定义

BSP（Binary Space Partitioning）每个节点存储一个**分割平面**，将空间分为两半；多边形按与平面的关系分到前侧或后侧子树。

```
           平面 P
      前侧子树  |  后侧子树
```

与 [KD-tree](md.html?file=study_note/data_struct/24_KD-tree.md) 的轴对齐分割不同，BSP 平面通常贴合墙面，适合室内结构。

---

## 点与平面分类

```cpp
// === File: bsp.cpp ===
struct Vec3 { float x, y, z; };
struct Plane { Vec3 n; float d; };  // n·x + d = 0

enum Side { FRONT, BACK, ON };

Side classify(const Plane& p, const Vec3& point) {
    float v = p.n.x * point.x + p.n.y * point.y + p.n.z * point.z + p.d;
    if (v > 1e-5f) return FRONT;
    if (v < -1e-5f) return BACK;
    return ON;
}
```

多边形跨平面时需**裁剪**为两片分别归入两侧。

---

## 渲染遍历（画家算法）

给定视点 `eye`：

1. 判断 `eye` 在节点平面的哪一侧
2. **先**遍历远侧子树
3. 绘制本节点多边形
4. **再**遍历近侧子树

无需 Z-buffer 即可在静态室内获得近似正确遮挡（老引擎 Quake 等）。

```cpp
void renderBSP(BSPNode* node, const Vec3& eye) {
    if (!node) return;
    Side s = classify(node->plane, eye);
    if (s == FRONT) {
        renderBSP(node->back, eye);
        drawPolygons(node->polys);
        renderBSP(node->front, eye);
    } else {
        renderBSP(node->front, eye);
        drawPolygons(node->polys);
        renderBSP(node->back, eye);
    }
}
```

---

## 特点

| 优点 | 缺点 |
|------|------|
| 任意平面，贴合建筑 | 平面选择影响树质量 |
| 确定绘制序 | 可能产生大量分割碎片 |
| CSG 实体建模 | 动态物体更新昂贵 |
| 室内可见性 | 室外大场景不适合 |

---

## 与 BVH / Z-buffer

现代实时渲染管线：

```
几何 → BVH 加速求交 → 光栅化 + Z-buffer 深度测试
```

BSP 仍见于：关卡编辑器 CSG、部分老引擎资源、软件光栅无 Z-buffer 场景。

---

## 典型应用

- 1990s 室内 FPS 地图（Quake 系）
- 布尔运算构造实体（墙 ∪ 柱 − 门洞）
- 静态室内前后遮挡排序（软件渲染）

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 平面选不好 | 树极不平衡、多边形激增 |
| 跨平面多边形未裁剪 | 分类错误、破洞 |
| 动态物体塞进 BSP | 应单独 pass + Z-buffer |
| 与 KD-tree 混淆 | BSP 平面任意；KD 轴对齐 |

---

## 关联知识

- [BVH](md.html?file=study_note/data_struct/26_BVH.md)
- [KD-tree](md.html?file=study_note/data_struct/24_KD-tree.md)
- [树与二叉搜索树](md.html?file=study_note/data_struct/07_树与二叉搜索树.md)
