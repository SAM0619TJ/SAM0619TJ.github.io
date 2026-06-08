# QR 分解

> **一句话**：$A=QR$，$Q$ 列正交、$R$ 上三角，是 Gram-Schmidt 的矩阵形式，稳定解最小二乘。
>
> 关键词：`QR分解` `Gram-Schmidt` `正交` `上三角` `最小二乘` `Householder`

[← 数学索引](study_note/math/index.html) · [公式速查](md.html?file=study_note/math/公式速查.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 分解 | $A=QR$ |
| $Q$ | $m\times n$（瘦 QR）或 $m\times m$（完整 QR），列正交：$Q^TQ=I$ |
| $R$ | $n\times n$ 上三角 |
| 存在条件 | $A$ 列满秩（瘦 QR 总是可做） |
| 最小二乘 | $\hat{\mathbf{x}}=R^{-1}Q^T\mathbf{b}$ |
| 与 LU | QR 更稳定；LU 更快但需主元 |

---

## 定义

对 $m\times n$ 矩阵 $A$（通常 $m\ge n$），若

$$A=QR$$

其中 $Q$ 的列向量标准正交（$Q^TQ=I_n$），$R$ 为上三角矩阵，则称此为 **QR 分解**（瘦 QR）。

若 $A$ 列满秩（$\mathrm{rank}(A)=n$），则 $R$ 对角元可取为正，分解在符号意义下唯一。

---

## 与 Gram-Schmidt 的关系

对 $A$ 的列 $\mathbf{a}_1,\ldots,\mathbf{a}_n$ 做 Gram-Schmidt：

- 得标准正交列 $\mathbf{q}_1,\ldots,\mathbf{q}_n$ → 组成 $Q$
- 消元系数写入 $R$：$r_{ij}=\mathbf{a}_j\cdot\mathbf{q}_i$，$r_{jj}=\|\mathbf{u}_j\|$

**数值实现**常用 Householder 反射或 Givens 旋转，避免经典 Gram-Schmidt 的精度问题。

---

## 核心公式

| 名称 | 公式 |
|------|------|
| 分解 | $A=QR$ |
| 正交性 | $Q^TQ=I_n$ |
| 最小二乘 | $\min\|A\mathbf{x}-\mathbf{b}\|_2 \Rightarrow R\hat{\mathbf{x}}=Q^T\mathbf{b}$ |
| 正规方程等价 | $R^TR\hat{\mathbf{x}}=A^T\mathbf{b}$（因 $A=QR$） |
| 特征值（进阶） | QR 迭代求特征值 |
| 与 LU | 正交变换保范数，数值更稳 |

---

## 求解最小二乘步骤

1. 分解 $A=QR$
2. 计算 $\mathbf{c}=Q^T\mathbf{b}$
3. 回代解 $R\hat{\mathbf{x}}=\mathbf{c}$

**优势**：避免直接算 $A^TA$ 的条件数平方放大。

---

## 例题

### 例 1：$2\times2$

$$A=\begin{pmatrix}1&1\\0&1\\0&0\end{pmatrix}$$

列 $\mathbf{a}_1=(1,0,0)^T$，$\mathbf{a}_2=(1,1,0)^T$。

$\mathbf{q}_1=\mathbf{a}_1$，$\mathbf{u}_2=\mathbf{a}_2-\frac{\mathbf{a}_2\cdot\mathbf{q}_1}{\mathbf{q}_1\cdot\mathbf{q}_1}\mathbf{q}_1=(0,1,0)^T$

$$Q=\begin{pmatrix}1&0\\0&1\\0&0\end{pmatrix},\ R=\begin{pmatrix}1&1\\0&1\end{pmatrix}$$

验证 $QR=A$ ✓

### 例 2：最小二乘

$$A=\begin{pmatrix}1\\1\\1\end{pmatrix},\ \mathbf{b}=\begin{pmatrix}1\\2\\2\end{pmatrix}$$

$A=QR$ 中 $Q=\frac{1}{\sqrt{3}}(1,1,1)^T$（$1\times1$ 情形），$R=(\sqrt{3})$。

$\hat{x}=\frac{Q^T\mathbf{b}}{R}=\frac{5}{\sqrt{3}}\cdot\frac{1}{\sqrt{3}}=\frac{5}{3}$

---

## QR vs 其它分解

| 分解 | 形式 | 典型用途 |
|------|------|----------|
| QR | $A=QR$ | 最小二乘、特征值迭代 |
| LU | $PA=LU$ | 解方阵方程组 |
| Cholesky | $A=LL^T$ | 对称正定 |
| SVD | $A=U\Sigma V^T$ | 通用、最稳 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| $Q$ 必须是方阵 | 瘦 QR 中 $Q$ 为 $m\times n$ |
| $R$ 对角可为负 | 约定取 $r_{ii}>0$ 保唯一性 |
| 直接 Gram-Schmidt 于病态矩阵 | 用修正 Gram-Schmidt 或 Householder |
| $Q^TQ=I$ 则 $QQ^T=I$ | 仅当 $Q$ 为方阵正交时成立 |

---

## 关联知识

- [正交性](md.html?file=study_note/math/正交性.md) — Gram-Schmidt
- [线性方程组](md.html?file=study_note/math/线性方程组.md) — 最小二乘
- [LU 分解](md.html?file=study_note/math/LU分解.md)
- [SVD 奇异值分解](md.html?file=study_note/math/SVD奇异值分解.md)
