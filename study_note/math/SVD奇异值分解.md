# SVD 奇异值分解

> **一句话**：任意 $m\times n$ 矩阵都可写成 $A=U\Sigma V^T$，揭示秩、伸缩方向和最优低秩逼近。
>
> 关键词：`SVD` `奇异值` `奇异向量` `秩` `伪逆` `低秩逼近` `PCA`

[← 数学索引](study_note/math/index.html) · [公式速查](md.html?file=study_note/math/公式速查.md)

---

## 速查卡

| 项目 | 内容 |
|------|------|
| 分解 | $A=U\Sigma V^T$ |
| $U$ | $m\times m$ 正交，左奇异向量 |
| $V$ | $n\times n$ 正交，右奇异向量 |
| $\Sigma$ | $m\times n$ 对角，对角元 $\sigma_1\ge\sigma_2\ge\cdots\ge0$ |
| 奇异值 | $\sigma_i=\sqrt{\lambda_i(A^TA)}$（$\lambda_i>0$） |
| 秩 | $\mathrm{rank}(A)=$ 非零奇异值个数 |
| 算子范数 | $\|A\|_2=\sigma_1$（最大奇异值） |

---

## 定义

对任意 $m\times n$ 实矩阵 $A$，存在正交矩阵 $U\in\mathbb{R}^{m\times m}$、$V\in\mathbb{R}^{n\times n}$ 和对角矩阵 $\Sigma\in\mathbb{R}^{m\times n}$ 使得：

$$A=U\Sigma V^T$$

- $\sigma_1\ge\sigma_2\ge\cdots\ge\sigma_r>0$ 为 **奇异值**，$r=\mathrm{rank}(A)$
- $U$ 的列 **左奇异向量**，$V$ 的列 **右奇异向量**

**紧凑 SVD**（省空间）：

$$A=U_r\Sigma_r V_r^T$$

$U_r$ 为 $m\times r$，$\Sigma_r$ 为 $r\times r$，$V_r$ 为 $n\times r$。

---

## 与特征值的关系

| 对象 | 关系 |
|------|------|
| $A^TA$ | 对称半正定，特征值 $=\sigma_i^2$，特征向量 $=$ 右奇异向量 |
| $AA^T$ | 对称半正定，特征值 $=\sigma_i^2$，特征向量 $=$ 左奇异向量 |
| $Av_i$ | $=\sigma_i u_i$（当 $\sigma_i>0$） |
| $A^Tu_i$ | $=\sigma_i v_i$ |

**求 SVD 思路**：

1. 算 $A^TA$，求特征值 $\lambda_i$ 和特征向量 $v_i$
2. $\sigma_i=\sqrt{\lambda_i}$
3. $u_i=\dfrac{1}{\sigma_i}Av_i$（$\sigma_i>0$ 时）

---

## 核心公式

| 名称 | 公式 |
|------|------|
| 完整 SVD | $A=U\Sigma V^T$ |
| 秩 | $\mathrm{rank}(A)=\#\{\sigma_i>0\}$ |
| Frobenius 范数 | $\|A\|_F^2=\sum_i\sigma_i^2$ |
| 谱范数 | $\|A\|_2=\sigma_1$ |
| 伪逆 (Moore-Penrose) | $A^+=V\Sigma^+U^T$，$\Sigma^+$ 对非零 $\sigma_i$ 取倒数 |
| 最优低秩逼近 | $A_k=\sum_{i=1}^k\sigma_i u_i v_i^T$ 在 Frobenius / 谱范数下最优 |
| 行列式（方阵） | $|\det(A)|=\prod\sigma_i$ |

### Eckart-Young 定理

秩 $k$ 矩阵中，$A_k$（取前 $k$ 个奇异值）最接近 $A$：

$$\min_{\mathrm{rank}(B)=k}\|A-B\|_F=\sqrt{\sum_{i=k+1}^r\sigma_i^2}$$

---

## 几何意义

$S=\Sigma$ 在标准正交基下沿各轴伸缩 $\sigma_i$ 倍；$V^T$ 旋转输入，$U$ 旋转输出。

**2D 直觉**：任意线性映射 $=$ 旋转 → 沿轴缩放 → 再旋转。

---

## 应用

| 应用 | 说明 |
|------|------|
| 最小二乘 | 病态 $A$ 用 SVD 求 $A^+\mathbf{b}$ 更稳定 |
| 数据压缩 | 图像 / 矩阵低秩逼近 $A_k$ |
| PCA | 协方差矩阵特征分解 $\Leftrightarrow$ 中心化数据 SVD |
| 推荐系统 | 用户-物品矩阵低秩近似 |
| 噪声过滤 | 截断小奇异值 |

---

## 例题

### 例 1：$2\times2$ 矩阵

$$A=\begin{pmatrix}3&0\\0&-2\end{pmatrix}$$

已是对角形，奇异值 $\sigma_1=3$，$\sigma_2=2$（取绝对值）。

$$U=I,\ \Sigma=\mathrm{diag}(3,2),\ V=\begin{pmatrix}1&0\\0&-1\end{pmatrix}$$

（符号吸收到 $V$ 中，保证 $\Sigma$ 非负。）

### 例 2：秩 1 矩阵

$$A=\begin{pmatrix}1&2\\2&4\end{pmatrix}=\mathbf{u}\mathbf{v}^T$$

第二行是第一行 2 倍，$\mathrm{rank}(A)=1$。

仅 $\sigma_1>0$，$A_1=A$ 本身即为最优秩 1 表示。

### 例 3：伪逆解最小二乘

超定或欠定 $A\mathbf{x}=\mathbf{b}$，最小范数最小二乘解：

$$\hat{\mathbf{x}}=A^+\mathbf{b}=V\Sigma^+U^T\mathbf{b}$$

---

## 易错点

| 易错 | 正确做法 |
|------|----------|
| 奇异值可为负 | 定义要求 $\sigma_i\ge0$，符号放入 $U,V$ |
| $A$ 的特征值 $=$ 奇异值 | 一般不等；需看 $A^TA$ |
| 混淆 $U$ 与 $V$ 的角色 | $Av=\sigma u$，$A^Tu=\sigma v$ |
| 截断秩 $k$ 过大或过小 | 看 $\sigma_i$ 衰减曲线（碎石图）选 $k$ |
| 对方阵只算特征值分解 | 非对称方阵应使用 SVD |

---

## 关联知识

- [特征值与特征向量](md.html?file=study_note/math/特征值与特征向量.md) — $A^TA$ 的特征值
- [正交性](md.html?file=study_note/math/正交性.md) — $U,V$ 正交
- [LU 分解](md.html?file=study_note/math/LU分解.md) — 另一类矩阵分解
- [线性变换](md.html?file=study_note/math/线性变换.md) — SVD 的几何解释
