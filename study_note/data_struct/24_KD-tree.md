# KD-tree（K-Dimensional Tree）

> **一句话**：按坐标轴交替二分空间，适合最近邻与 k-D 点集检索。
>
> 关键词：`KD-tree` `最近邻` `k-NN` `空间二分`

[← 数据结构索引](study_note/data_struct/index.html) · [四叉树](md.html?file=study_note/data_struct/23_四叉树.md) · [空间索引概览](md.html?file=study_note/data_struct/22_空间索引概览.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 分叉 | 每节点 2 子（左/右） |
| 分割轴 | depth % k 轮换（2D: x,y；3D: x,y,z） |
| 建树 | O(n log n)（nth_element） |
| 最近邻 | 平均 O(log n)，最坏 O(n) |
| 应用 | k-NN、点云、光线追踪事件排序 |

---

## 定义

KD-tree 是 **二叉** 空间划分树：每个内部节点用垂直或水平（或 z）平面将空间一分为二，分割位置常取 **中位数** 以平衡树高。

与 [四叉树](md.html?file=study_note/data_struct/23_四叉树.md) 一次四分不同，KD-tree 每次只二分，更适应非均匀点分布。

---

## 建树

```cpp
// === File: kdtree.cpp ===
#include <algorithm>
#include <memory>
#include <vector>

struct Point2D { float x, y; int id; };

struct KDNode {
    Point2D point;
    int axis;  // 0=x, 1=y
    std::unique_ptr<KDNode> left, right;
};

std::unique_ptr<KDNode> buildKD(std::vector<Point2D>& pts, int depth, int lo, int hi) {
    if (lo > hi) return nullptr;
    int axis = depth % 2;
    int mid = lo + (hi - lo) / 2;
    std::nth_element(pts.begin() + lo, pts.begin() + mid, pts.begin() + hi + 1,
        [axis](const Point2D& a, const Point2D& b) {
            return axis == 0 ? a.x < b.x : a.y < b.y;
        });
    auto node = std::make_unique<KDNode>();
    node->point = pts[mid];
    node->axis = axis;
    node->left = buildKD(pts, depth + 1, lo, mid - 1);
    node->right = buildKD(pts, depth + 1, mid + 1, hi);
    return node;
}
```

3D 时将 `depth % 2` 改为 `depth % 3`。

---

## 最近邻搜索

```cpp
float dist2(const Point2D& a, const Point2D& b) {
    float dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
}

void nearest(const KDNode* node, const Point2D& target,
             const KDNode*& best, float& bestD) {
    if (!node) return;
    float d = dist2(node->point, target);
    if (d < bestD) { bestD = d; best = node; }

    int axis = node->axis;
    float diff = axis == 0 ? target.x - node->point.x : target.y - node->point.y;
    const KDNode* near = diff < 0 ? node->left.get() : node->right.get();
    const KDNode* far  = diff < 0 ? node->right.get() : node->left.get();

    nearest(near, target, best, bestD);
    if (diff * diff < bestD)  // 远侧可能更近
        nearest(far, target, best, bestD);
}
```

**关键**：分割平面到查询点的距离平方 < 当前最优时，必须搜索「远侧」子树。

---

## k 近邻

用大小为 k 的优先队列维护当前 k 个最近点，剪枝条件改为 `diff² < 队列中最远点距离²`。

---

## 典型应用

| 场景 | 说明 |
|------|------|
| k-NN 分类 | 机器学习基础 |
| 点云配准 | 激光雷达匹配 |
| 光线追踪 | SAH KD-tree 对三角形事件排序 |
| 点击选最近单位 | 2D 游戏 |

---

## 与 BVH 区别

| | KD-tree | BVH |
|---|---------|-----|
| 划分对象 | **空间** | **物体集合** |
| 同一物体 | 单点/小单元 | 整条路径一个包围盒 |
| 光追主流 | 历史常用 | 当前工业主流 |

见 [BVH](md.html?file=study_note/data_struct/26_BVH.md)。

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 最近邻只搜近侧 | 检查 `diff² < bestD` |
| 点共线导致不平衡 | 随机化或滑动中位数 |
| 2D/3D 轴轮换写错 | `axis = depth % dim` |
| 与四叉树混淆 | 四叉固定四分；KD 二分且分割位置灵活 |

---

## 关联知识

- [四叉树](md.html?file=study_note/data_struct/23_四叉树.md)
- [BVH](md.html?file=study_note/data_struct/26_BVH.md)
- [二分查找](md.html?file=study_note/data_struct/12_二分查找.md) — 搜索思想类似
