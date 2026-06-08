# AVL 与平衡二叉搜索树

> **一句话**：通过旋转保持平衡，使 BST 高度为 O(log n)，操作稳定 logarithmic。
>
> 关键词：`AVL` `旋转` `平衡因子` `红黑树`

[← 数据结构索引](study_note/data_struct/index.html) · [速查表](md.html?file=study_note/data_struct/速查.md)

---

## 速查卡

| 结构 | 平衡条件 | 查找/插/删 |
|------|----------|------------|
| 朴素 BST | 无 | O(n) 最坏 |
| AVL | 任意节点 \|BF\| ≤ 1 | O(log n) |
| 红黑树 | 黑高平衡（近似） | O(log n) |
| `std::map` | 红黑树实现 | O(log n) |

**平衡因子** BF = 左子树高 - 右子树高。

---

## 四种旋转

| 情况 | 操作 |
|------|------|
| LL（左左） | 右旋 |
| RR（右右） | 左旋 |
| LR（左右） | 先左旋左子，再右旋根 |
| RL（右左） | 先右旋右子，再左旋根 |

```
LL:       z                y
         /                / \
        y        →       x   z
       /
      x
```

---

## AVL 节点与右旋

```cpp
// === File: avl.cpp ===
struct AvlNode {
    int val, height = 1;
    AvlNode *left = nullptr, *right = nullptr;
    explicit AvlNode(int v) : val(v) {}
};

int height(AvlNode* n) { return n ? n->height : 0; }
int bf(AvlNode* n) { return height(n->left) - height(n->right); }

void update(AvlNode* n) {
    n->height = 1 + std::max(height(n->left), height(n->right));
}

AvlNode* rotateRight(AvlNode* y) {
    AvlNode* x = y->left;
    AvlNode* T2 = x->right;
    x->right = y;
    y->left = T2;
    update(y);
    update(x);
    return x;
}

AvlNode* rotateLeft(AvlNode* x) {
    AvlNode* y = x->right;
    AvlNode* T2 = y->left;
    y->left = x;
    x->right = T2;
    update(x);
    update(y);
    return y;
}

AvlNode* rebalance(AvlNode* node) {
    update(node);
    if (bf(node) > 1) {
        if (bf(node->left) < 0) node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    if (bf(node) < -1) {
        if (bf(node->right) > 0) node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node;
}
```

插入后沿父链向上 `rebalance`。

---

## 红黑树（工程）

C++ `std::map` / `std::set` 底层为红黑树：

- 节点红/黑着色 + 五条性质
- 插入删除最多 O(1) 次旋转均摊
- 相比 AVL，插入删除常数更小，查询略逊

```cpp
#include <map>
#include <set>
std::map<int, std::string> ordered;
std::set<int> unique_keys;
```

**实践**：需要有序 + O(log n) 直接用 STL，不必手写红黑树。

---

## AVL vs 红黑树

| | AVL | 红黑树 |
|---|-----|--------|
| 严格程度 | 更严，树更矮 | 较松 |
| 查询 | 略快 | 略慢 |
| 插入删除 | 旋转可能更多 | 常数少 |
| 用途 | 数据库索引理论 | STL、Linux 内核 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 旋转后未更新 height | 先旋后 `update` 子再父 |
| LR/RL 只做一次旋转 | 双旋 |
| 删除后不 rebalance | 沿父链回溯 |
| 竞赛手写红黑树 | 用 `map` 或 Treap |

---

## 关联知识

- [树与 BST](md.html?file=study_note/data_struct/07_树与二叉搜索树.md)
- [跳表](md.html?file=study_note/data_struct/19_跳表.md) — 另一种 O(log n) 有序结构
