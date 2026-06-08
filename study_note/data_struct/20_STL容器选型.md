# STL 容器选型

> **一句话**：C++17 标准库容器覆盖多数场景；理解底层结构才能选对工具。
>
> 关键词：`vector` `map` `unordered_map` `set` `deque`

[← 数据结构索引](study_note/data_struct/index.html) · [速查表](md.html?file=study_note/data_struct/速查.md)

---

## 速查卡

| 需求 | 首选容器 |
|------|----------|
| 动态数组、默认序列 | `vector` |
| 两端队列 | `deque` |
| 栈 / 队列 | `stack` / `queue`（适配器） |
| 快速查找、无序 | `unordered_map` / `unordered_set` |
| 有序键、范围查询 | `map` / `set` |
| 可重复键有序 | `multimap` / `multiset` |
| 小顶堆 / 优先队列 | `priority_queue` |
| 位集合 | `bitset` / `vector<bool>` |

---

## 序列容器

```cpp
#include <vector>
#include <deque>
#include <list>

std::vector<int> v;      // 连续，尾插快
std::deque<int> dq;      // 分段连续，两端快
std::list<int> lst;      // 双向链表，中间插删（少用）
```

**建议**：除非明确需要 `list` 中间迭代器稳定性，否则 `vector` / `deque`。

---

## 关联容器

| 容器 | 底层 | 有序 | 键唯一 |
|------|------|------|--------|
| `map` | 红黑树 | 是 | 是 |
| `multimap` | 红黑树 | 是 | 否 |
| `set` | 红黑树 | 是 | 是 |
| `unordered_map` | 哈希 | 否 | 是 |
| `unordered_set` | 哈希 | 否 | 是 |

```cpp
#include <map>
#include <unordered_map>
#include <set>

std::map<int, std::string> ordered;
std::unordered_map<int, std::string> fast;
std::set<int> unique_sorted;
```

---

## 容器适配器

```cpp
#include <stack>
#include <queue>

std::stack<int> s;                    // 默认 deque 底层
std::queue<int> q;
std::priority_queue<int> pq;          // 大顶堆
```

---

## 迭代器与复杂度

| 操作 | vector | deque | list | map | unordered_map |
|------|--------|-------|------|-----|---------------|
| 随机访问 | O(1) | O(1) | 否 | 否 | 否 |
| 插入尾部 | 均摊 O(1) | O(1) | O(1) | — | — |
| 查找 | O(n) | O(n) | O(n) | O(log n) | 均摊 O(1) |

---

## 选型决策树

1. 要不要键值映射？→ 是：`map` / `unordered_map`
2. 要不要有序？→ 是：`map`；否：`unordered_map`
3. 只是序列？→ `vector`；两端操作多？→ `deque`
4. 要最值？→ `priority_queue`
5. 图？→ `vector<vector<int>>` 邻接表

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 遍历 `map` 时用 `operator[]` | 只读用 `find` / 范围 for |
| `vector` 中间频繁插删 | 换 `deque` 或链表思想 |
| `unordered_map` 自定义键无 hash | 提供 `Hash` 和 `Equal` |
| 以为 `stack` 能遍历 | 适配器无迭代器 |

---

## 关联知识

- [哈希表](md.html?file=study_note/data_struct/06_哈希表.md)
- [AVL与平衡树](md.html?file=study_note/data_struct/14_AVL与平衡树.md) — `map` 底层
