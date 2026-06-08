# Trie 字典树

> **一句话**：按字符前缀共享路径的多叉树，高效做字符串检索与前缀匹配。
>
> 关键词：`Trie` `前缀树` `自动补全` `异或最大`

[← 数据结构索引](study_note/data_struct/index.html) · [速查表](md.html?file=study_note/data_struct/速查.md)

---

## 速查卡

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 插入 | O(L) | L 为字符串长度 |
| 查找 | O(L) | 精确匹配 |
| 前缀查询 | O(L) | 统计以 prefix 开头的词 |
| 空间 | O(Σ·N) | Σ 字符集大小，共享前缀省空间 |

---

## 节点定义

```cpp
// === File: trie.cpp ===
struct TrieNode {
    TrieNode* children[26] = {};
    bool isEnd = false;
};

class Trie {
    TrieNode* root_ = new TrieNode();
public:
    void insert(const std::string& word) {
        TrieNode* node = root_;
        for (char c : word) {
            int i = c - 'a';
            if (!node->children[i]) node->children[i] = new TrieNode();
            node = node->children[i];
        }
        node->isEnd = true;
    }

    bool search(const std::string& word) const {
        TrieNode* node = find(word);
        return node && node->isEnd;
    }

    bool startsWith(const std::string& prefix) const {
        return find(prefix) != nullptr;
    }

private:
    TrieNode* find(const std::string& s) const {
        TrieNode* node = root_;
        for (char c : s) {
            int i = c - 'a';
            if (!node->children[i]) return nullptr;
            node = node->children[i];
        }
        return node;
    }
};
```

数字/多字符集可用 `unordered_map<char, TrieNode*>` 代替固定 26 叉。

---

## 典型应用

| 场景 | 用法 |
|------|------|
| 自动补全 | 沿前缀走，DFS 收集 `isEnd` |
| 词频统计 | 节点存 `int count` |
| 字符串去重前缀 | `startsWith` |
| 最大异或对 | 01 Trie（按位建树） |
| IP 路由 | 最长前缀匹配 |

---

## 01 Trie（最大异或）

```cpp
struct BitTrieNode {
    BitTrieNode* child[2] = {};
};

void insert(BitTrieNode* root, int num) {
    for (int i = 31; i >= 0; --i) {
        int b = (num >> i) & 1;
        if (!root->child[b]) root->child[b] = new BitTrieNode();
        root = root->child[b];
    }
}

int maxXor(BitTrieNode* root, int num) {
    int ans = 0;
    for (int i = 31; i >= 0; --i) {
        int b = (num >> i) & 1;
        int want = 1 - b;
        if (root->child[want]) { ans |= (1 << i); root = root->child[want]; }
        else root = root->child[b];
    }
    return ans;
}
```

---

## 与哈希表对比

| | Trie | 哈希 |
|---|------|------|
| 精确查找 | O(L) | 均摊 O(1) |
| 前缀 | 天然支持 | 不支持 |
| 空间 | 指针多，共享前缀 | 通常更紧凑 |
| 最坏 | 无哈希冲突 | 冲突退化 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 忘记 `isEnd` | 区分「前缀存在」与「单词存在」 |
| 不释放内存 | 析构递归 delete |
| 大小写混合 | 统一转小写或分支 52+ |
| 中文直接用 char | 用 UTF-8 码点或 map |

---

## 关联知识

- [哈希表](md.html?file=study_note/data_struct/06_哈希表.md)
- [树与 BST](md.html?file=study_note/data_struct/07_树与二叉搜索树.md)
