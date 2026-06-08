# LRU 缓存

> **一句话**：哈希表 O(1) 定位 + 双向链表 O(1) 维护「最近使用」顺序。
>
> 关键词：`LRU` `缓存淘汰` `哈希链表` `get put`

[← 数据结构索引](study_note/data_struct/index.html) · [速查表](md.html?file=study_note/data_struct/速查.md)

---

## 速查卡

| 操作 | 复杂度 | 行为 |
|------|--------|------|
| `get(key)` | O(1) | 命中则移到最近使用，返回值 |
| `put(key,val)` | O(1) | 更新/插入；超容量删最久未用 |
| 容量 | cap | 最多 cap 个键值对 |

---

## 设计

```
hash: key → 链表节点指针
双向链表: MRU ... LRU（头最近，尾最久）
```

- `get`：哈希找到节点，移到头部
- `put`：存在则更新并移头；不存在则头插，若超容删尾

---

## C++17 实现

```cpp
// === File: lru_cache.cpp ===
#include <list>
#include <unordered_map>

class LRUCache {
    int cap_;
    std::list<std::pair<int,int>> list_;  // (key, val)，头 MRU
    std::unordered_map<int, std::list<std::pair<int,int>>::iterator> map_;

    void touch(std::list<std::pair<int,int>>::iterator it) {
        list_.splice(list_.begin(), list_, it);
    }

public:
    explicit LRUCache(int capacity) : cap_(capacity) {}

    int get(int key) {
        auto it = map_.find(key);
        if (it == map_.end()) return -1;
        touch(it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        auto it = map_.find(key);
        if (it != map_.end()) {
            it->second->second = value;
            touch(it->second);
            return;
        }
        if (static_cast<int>(list_.size()) >= cap_) {
            int oldKey = list_.back().first;
            list_.pop_back();
            map_.erase(oldKey);
        }
        list_.emplace_front(key, value);
        map_[key] = list_.begin();
    }
};
```

`list::splice`  O(1) 移动节点，无需新建。

---

## 变体

| 策略 | 说明 |
|------|------|
| LFU | 按访问频率淘汰，需频次桶 |
| FIFO | 队列即可，无 `get` 提升 |
| LRU-K | 考虑最近 K 次访问 |

---

## 例题思路

设计类题：构造函数 + `get` + `put`，注意边界 `cap=0`。

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| `put` 更新未移头 | 更新也算使用 |
| 删尾忘记删 map | 双向同步 |
| 用 `vector` 模拟移头 | O(n)，应用链表 |
| `get`  miss 未定义 | 题目约定返回 -1 |

---

## 关联知识

- [哈希表](md.html?file=study_note/data_struct/06_哈希表.md)
- [数组与链表](md.html?file=study_note/data_struct/04_数组与链表.md) — 双向链表
