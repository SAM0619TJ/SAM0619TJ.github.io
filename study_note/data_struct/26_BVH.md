# BVH（层次包围体）

> **一句话**：对物体集合递归分组并合并 AABB，光线追踪与物理 broad phase 的工业标准。
>
> 关键词：`BVH` `层次包围盒` `SAH` `光线追踪` `Embree`

[← 数据结构索引](study_note/data_struct/index.html) · [AABB](md.html?file=study_note/data_struct/22_AABB包围盒.md) · [空间索引概览](md.html?file=study_note/data_struct/22_空间索引概览.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 叶节点 | 1～N 个图元 + 其 AABB |
| 内部节点 | 子节点 AABB 的并集 |
| 建树 | O(n log n) |
| 射线查询 | 期望 O(log n) |
| 优化 | SAH（Surface Area Heuristic） |

划分 **物体集合**，不是固定划分空间——与 [四叉树](md.html?file=study_note/data_struct/23_四叉树.md)、[KD-tree](md.html?file=study_note/data_struct/24_KD-tree.md) 本质不同。

---

## 结构

```cpp
// === File: bvh.cpp ===
#include <algorithm>
#include <vector>

struct Vec3 { float x, y, z; };
struct AABB3D {
    Vec3 min, max;
    void expand(const Vec3& p);
    void merge(const AABB3D& o);
};

struct BVHPrimitive { int id; AABB3D bounds; };

struct BVHNode {
    AABB3D bounds;
    int left = -1, right = -1;
    int primStart = 0, primCount = 0;  // primCount > 0 表示叶
};

std::vector<BVHNode> nodes;
std::vector<BVHPrimitive> prims;
```

---

## 朴素建树（中点划分）

```cpp
int buildBVH(int start, int end, int depth) {
    AABB3D box = prims[start].bounds;
    for (int i = start + 1; i < end; ++i) box.merge(prims[i].bounds);

    int nodeIdx = static_cast<int>(nodes.size());
    nodes.push_back({});
    nodes[nodeIdx].bounds = box;

    int count = end - start;
    if (count <= 2) {
        nodes[nodeIdx].primStart = start;
        nodes[nodeIdx].primCount = count;
        return nodeIdx;
    }

    int axis = depth % 3;
    int mid = start + count / 2;
    std::nth_element(prims.begin() + start, prims.begin() + mid, prims.begin() + end,
        [axis](const BVHPrimitive& a, const BVHPrimitive& b) {
            float ca = ((&a.bounds.min.x)[axis] + (&a.bounds.max.x)[axis]) * 0.5f;
            float cb = ((&b.bounds.min.x)[axis] + (&b.bounds.max.x)[axis]) * 0.5f;
            return ca < cb;
        });

    nodes[nodeIdx].left = buildBVH(start, mid, depth + 1);
    nodes[nodeIdx].right = buildBVH(mid, end, depth + 1);
    return nodeIdx;
}
```

---

## SAH 优化

选分割轴与位置，最小化期望遍历代价：

$$\text{Cost} = C_{trav} + C_{isect}\left(\frac{SA_{left}}{SA_{parent}} N_{left} + \frac{SA_{right}}{SA_{parent}} N_{right}\right)$$

Blender Cycles、Intel Embree、离线烘焙广泛使用。朴素中点划分实现简单，质量略逊。

---

## 光线遍历

依赖 [AABB slab 射线测试](md.html?file=study_note/data_struct/22_AABB包围盒.md)：

```cpp
struct Ray { Vec3 origin, dir; };

bool rayHitAABB(const Vec3& ro, const Vec3& rd, const AABB3D& box, float& tMin, float& tMax);

bool intersectBVH(int nodeIdx, const Ray& ray, float& hitT) {
    float tMin, tMax;
    if (!rayHitAABB(ray.origin, ray.dir, nodes[nodeIdx].bounds, tMin, tMax))
        return false;

    const BVHNode& n = nodes[nodeIdx];
    if (n.primCount > 0) {
        bool hit = false;
        for (int i = 0; i < n.primCount; ++i)
            if (intersectTriangle(ray, prims[n.primStart + i], hitT)) hit = true;
        return hit;
    }
    bool h = false;
    if (n.left >= 0)  h |= intersectBVH(n.left, ray, hitT);
    if (n.right >= 0) h |= intersectBVH(n.right, ray, hitT);
    return h;
}
```

百万三角形场景从 O(n) 降至可交互帧率。

---

## 动态 BVH（了解）

物体移动时局部重建或 refit 包围盒。物理引擎（Bullet、PhysX）与实时光追（DXR）常用 **LBVH**（线性 BVH，Morton 码排序建树）。

---

## 对比总结

| | 空间划分（Quad/KD） | BVH |
|---|---------------------|-----|
| 切什么 | 固定区域 | 物体组 |
| 跨格物体 | 常见 | 单路径 |
| 光追 | KD 历史方案 | **主流** |
| 动态场景 | 较难 | refit / 重建 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 内部节点 bounds 未合并子节点 | 必须包住所有子 AABB |
| 叶/内节点判断错误 | `primCount > 0` 为叶 |
| 与 KD-tree 混淆 | BVH 分物体；KD 分空间 |
| 不做射线 AABB 早退 | 每节点先 slab 测试 |

---

## 关联知识

- [AABB 包围盒](md.html?file=study_note/data_struct/22_AABB包围盒.md)
- [Shader · Raymarching](md.html?file=study_note/shader/rendering/raymarching.md)
- [Shader · SDF](md.html?file=study_note/shader/fundamentals/sdf_primitives.md)
