# Cholesky 分解

> **一句话**：对称正定矩阵 $A=LL^T$，$L$ 下三角，是 LU 的特例，高效且数值稳定。
>
> 关键词：`Cholesky` `正定` `LL^T` `对称` `分解`

[← 数学索引](study_note/math/index.html) · [公式速查](md.html?file=study_note/math/公式速查.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 分解 | $A=LL^T$ |
| 条件 | $A$ 对称正定（或 Hermitian 正定） |
| $L$ | 下三角，对角元 $>0$（常取正） |
| 计算量 | 约为 LU 的一半 |
| 解方程 | $L\mathbf{y}=\mathbf{b}$，$L^T\mathbf{x}=\mathbf{y}$ |
| 与 LU | Cholesky 不用主元交换（正定保证稳定） |

---

## 定义

若 $A\in\mathbb{R}^{n\times n}$ **对称正定**，则存在下三角矩阵 $L$（对角元为正）使得

$$A=LL^T$$

称为 **Cholesky 分解**。

复数情形：$A=LL^*$（$L$ 下三角，$*$ 共轭转置）。

---

## 计算公式

对 $i=1,\ldots,n$：

$$\ell_{ii}=\sqrt{a_{ii}-\sum_{k=1}^{i-1}\ell_{ik}^2}$$

$$\ell_{ji}=\frac{1}{\ell_{ii}}\left(a_{ji}-\sum_{k=1}^{i-1}\ell_{jk}\ell_{ik}\right),\quad j>i$$

---

## 求解 $A\mathbf{x}=\mathbf{b}$ 步骤

1. 分解 $A=LL^T$
2. **前代**：$L\mathbf{y}=\mathbf{b}$
3. **回代**：$L^T\mathbf{x}=\mathbf{y}$

---

## 核心公式

| 名称 | 公式 |
|------|------|
| 分解 | $A=LL^T$ |
| 存在性 | $A$ 对称正定 $\Leftrightarrow$ Cholesky 存在 |
| 行列式 | $\det(A)=\prod_{i=1}^n\ell_{ii}^2$ |
| 逆 | 先求 $L$，再解 $LL^TA^{-1}=I$ |
| $A^TA$ | 若 $A$ 列满秩，$A^TA$ 正定，可 Cholesky |

---

## 例题

### 例 1

$$A=\begin{pmatrix}4&2\\2&3\end{pmatrix}$$

$\ell_{11}=2$，$\ell_{21}=\dfrac{2}{2}=1$，$\ell_{22}=\sqrt{3-1}=\sqrt{2}$

$$L=\begin{pmatrix}2&0\\1&\sqrt{2}\end{pmatrix}$$

验证 $LL^T=A$ ✓

### 例 2：非正定不能用

$$A=\begin{pmatrix}1&2\\2&1\end{pmatrix}$$

特征值 $3,-1$，不定，$\ell_{11}$ 可算但某步 $\ell_{ii}^2<0$，分解失败。

---

## 与其它分解

| 分解 | 条件 | 形式 |
|------|------|------|
| Cholesky | 对称正定 | $A=LL^T$ |
| LU | 一般方阵 | $PA=LU$ |
| QR | 任意 | $A=QR$ |
| 谱分解 | 对称 | $A=Q\Lambda Q^T$ |

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 对非对称矩阵用 Cholesky | 先验证 $A=A^T$ 且正定 |
| 对半正定矩阵期望唯一正 $\ell_{ii}$ | 半正定时 $\ell_{ii}$ 可为 0（需 pivoting 进阶） |
| 写成 $A=L^TL$ | 约定是 $A=LL^T$（$L$ 下三角） |
| 忘记正定才稳定 | 不定矩阵应用 LU/QR |

---

## 关联知识

- [正定矩阵](md.html?file=study_note/math/正定矩阵.md)
- [LU 分解](md.html?file=study_note/math/LU分解.md)
- [二次型](md.html?file=study_note/math/二次型.md)
