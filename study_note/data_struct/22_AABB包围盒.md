# AABB 包围盒

> **一句话**：边与坐标轴平行的盒子，O(1) 粗测相交，是 broad phase 与 BVH 的基石。
>
> 关键词：`AABB` `包围盒` `slab` `broad phase` `碰撞粗测`

[← 数据结构索引](study_note/data_struct/index.html) · [空间索引概览](md.html?file=study_note/data_struct/22_空间索引概览.md) · [速查表](md.html?file=study_note/data_struct/速查.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 表示 | `min` + `max` 角点 |
| 2D/3D 相交 | 三轴（或两轴）区间重叠 |
| 射线测试 | slab 法，O(1) |
| 用途 | 碰撞粗筛、BVH 叶节点、视锥剔除 |

**Broad phase**：用 AABB 快速排除不可能碰撞的对；**Narrow phase**：对候选对做精确几何检测。

---

## 定义

AABB（Axis-Aligned Bounding Box）各边与 x/y/z 轴平行。用最小角点 `min` 与最大角点 `max` 唯一确定。

```cpp
// === File: aabb.cpp ===
#include <algorithm>

struct Vec2 { float x, y; };
struct Vec3 { float x, y, z; };

struct AABB2D {
    Vec2 min, max;

    static AABB2D fromPoints(const Vec2& a, const Vec2& b) {
        return {{std::min(a.x, b.x), std::min(a.y, b.y)},
                {std::max(a.x, b.x), std::max(a.y, b.y)}};
    }

    void expand(const Vec2& p) {
        min.x = std::min(min.x, p.x); min.y = std::min(min.y, p.y);
        max.x = std::max(max.x, p.x); max.y = std::max(max.y, p.y);
    }

    void merge(const AABB2D& o) { expand(o.min); expand(o.max); }
};

struct AABB3D {
    Vec3 min, max;
    void expand(const Vec3& p) {
        min.x = std::min(min.x, p.x); min.y = std::min(min.y, p.y); min.z = std::min(min.z, p.z);
        max.x = std::max(max.x, p.x); max.y = std::max(max.y, p.y); max.z = std::max(max.z, p.z);
    }
    void merge(const AABB3D& o) { expand(o.min); expand(o.max); }
};
```

---

## 相交测试

```cpp
bool intersects(const AABB2D& a, const AABB2D& b) {
    return a.min.x <= b.max.x && a.max.x >= b.min.x &&
           a.min.y <= b.max.y && a.max.y >= b.min.y;
}

bool intersects3D(const AABB3D& a, const AABB3D& b) {
    return a.min.x <= b.max.x && a.max.x >= b.min.x &&
           a.min.y <= b.max.y && a.max.y >= b.min.y &&
           a.min.z <= b.max.z && a.max.z >= b.min.z;
}
```

分离轴定理在 AABB 情形下退化为各轴区间是否重叠。

---

## 射线与 AABB（slab 法）

沿每个轴求射线参数区间 $[t_1, t_2]$，三轴交集非空则相交。

```cpp
bool rayHitAABB(const Vec3& ro, const Vec3& rd, const AABB3D& box,
                float& tMin, float& tMax) {
    tMin = 0.f; tMax = 1e30f;
    for (int axis = 0; axis < 3; ++axis) {
        float o = (&ro.x)[axis], d = (&rd.x)[axis];
        float bmin = (&box.min.x)[axis], bmax = (&box.max.x)[axis];
        if (std::abs(d) < 1e-8f) {
            if (o < bmin || o > bmax) return false;
        } else {
            float t1 = (bmin - o) / d, t2 = (bmax - o) / d;
            if (t1 > t2) std::swap(t1, t2);
            tMin = std::max(tMin, t1);
            tMax = std::min(tMax, t2);
            if (tMin > tMax) return false;
        }
    }
    return true;
}
```

[BVH](md.html?file=study_note/data_struct/26_BVH.md) 遍历中每个节点先做此测试。

---

## 从图元构建 AABB

| 图元 | 做法 |
|------|------|
| 三角形 | 三顶点 min/max |
| 点集 | 遍历 expand |
| 圆（2D） | 中心 ± 半径 |
| 装甲板（视觉） | 四灯条角点外接矩形 |

RoboMaster 检测框本质是图像平面上的 2D AABB，用于 ROI 裁剪与 NMS 粗筛。

---

## 典型应用

- 物理引擎 broad phase
- 视锥体剔除（Frustum vs AABB）
- BVH 内部节点合并子包围盒
- 2D 游戏碰撞第一层过滤

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| AABB 当精确碰撞 | 仅粗测，需 narrow phase |
| min/max 颠倒 | 构造时始终 min ≤ max |
| 旋转物体用单一 AABB | 旋转后盒子变大；可用 OBB 或 tighter fit |
| 射线 tMin/tMax 未 clamp | 只关心正向射线时 tMin = max(tMin, 0) |

---

## 关联知识

- [BVH](md.html?file=study_note/data_struct/26_BVH.md)
- [四叉树](md.html?file=study_note/data_struct/23_四叉树.md)
- [空间索引概览](md.html?file=study_note/data_struct/22_空间索引概览.md)
