# LU 分解

> **一句话**：把矩阵 $A$ 写成下三角 $L$ 与上三角 $U$ 的乘积，把求逆和解方程组化为三角系统回代。
>
> 关键词：`LU分解` `三角矩阵` `高斯消元` `PA=LU` `主元` `回代`

[← 数学索引](study_note/math/index.html) · [公式速查](md.html?file=study_note/math/公式速查.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 基本形式 | $A=LU$（$L$ 下三角，$U$ 上三角） |
| 带置换 | $PA=LU$，$P$ 为置换矩阵（行交换记录） |
| $L$ 对角元 | 通常取 $1$（单位下三角） |
| 解 $A\mathbf{x}=\mathbf{b}$ | 先 $L\mathbf{y}=P\mathbf{b}$，再 $U\mathbf{x}=\mathbf{y}$ |
| 存在条件 | 所有顺序主子式非零（或适当选主元） |
| 计算量 | 分解 $O(n^3)$，多次解方程时摊销成本低 |

---

## 定义

### LU 分解

若 $A$ 可写成

$$A=LU$$

其中 $L$ 为 **单位下三角矩阵**（对角全为 1），$U$ 为 **上三角矩阵**，则称 $A$ 有 LU 分解。

### PLU / PA=LU 分解

数值计算中常需行交换（选主元），引入置换矩阵 $P$：

$$PA=LU$$

$P$ 记录消元过程中的行互换。

---

## 与高斯消元的关系

高斯消元本质：用初等行变换把 $A$ 化为上三角 $U$，乘子写入 $L$。

**Doolittle 分解**：$L$ 对角为 1，$U$ 对角为消元结果。

**Crout 分解**：$U$ 对角为 1，$L$ 保留乘子（变体，较少手算）。

消元乘子：第 $k$ 步用第 $i$ 行（$i>k$）消去第 $k$ 列元素时，

$$\ell_{ik}=\frac{a_{ik}^{(k)}}{a_{kk}^{(k)}}$$

写入 $L$ 的 $(i,k)$ 位置。

---

## 求解步骤

解 $A\mathbf{x}=\mathbf{b}$（已知 $PA=LU$）：

1. **前代**：解 $L\mathbf{y}=P\mathbf{b}$（下三角，从上到下）
2. **回代**：解 $U\mathbf{x}=\mathbf{y}$（上三角，从下到上）

### 三角系统回代

**上三角** $U\mathbf{x}=\mathbf{c}$：从 $x_n=c_n/u_{nn}$ 往上求。

**下三角** $L\mathbf{y}=\mathbf{d}$（$L$ 单位对角）：从 $y_1$ 往下求。

---

## 核心公式

| 名称 | 公式 |
|------|------|
| 分解 | $A=LU$ 或 $PA=LU$ |
| 行列式 | $\det(A)=\det(P)\prod u_{ii}$（$U$ 对角元之积，$\det(P)=\pm1$） |
| 逆（概念） | $A^{-1}=U^{-1}L^{-1}$，分别用三角求逆 |
| 主子式条件 | 顺序主子式全非零 $\Rightarrow$ 无需行交换的 LU 存在 |
| 与 Cholesky | 对称正定 $A=LL^T$（更省存储，是 LU 特例） |

---

## 例题

### 例 1：$2\times2$ LU

$$A=\begin{pmatrix}2&1\\4&3\end{pmatrix}$$

消元：$R_2\leftarrow R_2-2R_1$

$$U=\begin{pmatrix}2&1\\0&1\end{pmatrix},\quad L=\begin{pmatrix}1&0\\2&1\end{pmatrix}$$

验证：$LU=\begin{pmatrix}2&1\\4&3\end{pmatrix}=A$ ✓

### 例 2：用 LU 解方程组

$A\mathbf{x}=\mathbf{b}$，$A$ 同上，$\mathbf{b}=(1,5)^T$。

$L\mathbf{y}=\mathbf{b}$：$y_1=1$，$y_2=5-2y_1=3$

$U\mathbf{x}=\mathbf{y}$：$2x_1+x_2=1$，$x_2=3$ → $x_2=3$，$x_1=-1$

### 例 3：需要主元交换

$$A=\begin{pmatrix}0&1\\2&3\end{pmatrix}$$

$a_{11}=0$ 无法直接消元。交换行：$P=\begin{pmatrix}0&1\\1&0\end{pmatrix}$，

$$PA=\begin{pmatrix}2&3\\0&1\end{pmatrix}=LU$$

---

## LU vs 其它分解

| 分解 | 形式 | 适用 |
|------|------|------|
| LU | $A=LU$ | 一般方阵，解方程组 |
| PLU | $PA=LU$ | 需选主元 |
| QR | $A=QR$ | 最小二乘、特征值迭代 |
| QR | $A=QR$ | 最小二乘、正交 |
| Cholesky | $A=LL^T$ | 对称正定 |
| SVD | $A=U\Sigma V^T$ | 任意矩阵，最稳但最贵 |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 忘记记录行交换 | 用 $PA=LU$，解时右端也要乘 $P$ |
| $L$ 对角写成消元乘子 | Doolittle 中 $L$ 对角为 1，乘子在严格下三角 |
| 回代顺序错 | $U$ 从下往上，$L$ 从上往下 |
| 无 pivoting 导致数值不稳定 | 部分选主元（partial pivoting）几乎总是需要 |
| 对奇异矩阵硬分解 | 先检查秩或选主元是否失败 |

---

## 关联知识

- [线性方程组](md.html?file=study_note/math/线性方程组.md) — 高斯消元本质
- [逆矩阵](md.html?file=study_note/math/逆矩阵.md) — 通过 LU 求逆
- [正交性](md.html?file=study_note/math/正交性.md) — QR 分解
- [QR 分解](md.html?file=study_note/math/QR分解.md)
- [Cholesky 分解](md.html?file=study_note/math/Cholesky分解.md)
- [SVD 奇异值分解](md.html?file=study_note/math/SVD奇异值分解.md) — 更一般的分解
