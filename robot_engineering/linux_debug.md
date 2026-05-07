这是一份专门为 **Jetson 开发环境** 优化的 Linux 终端调试与查找实用手册。你可以将其保存为 `debug_tools.md`。

---

# 🚀 Jetson & Linux 终端调试与查找实用指南

这份手册涵盖了在 Jetson 设备上进行硬件驱动、库依赖管理、文件搜索以及系统性能监控的核心命令。

## 一、 文件与库的“全城搜捕”

当你不确定某个库（如 OpenCV、CUDA）装在哪时，使用以下方法：

### 1. `find`：地毯式搜索（实时、深度）
```bash
# 在全系统范围内查找名为 "opencv" 的文件夹
sudo find / -name "*opencv*" -type d

# 查找当前目录及子目录下所有的 .so 动态链接库
find . -name "*.so"

# 查找过去 10 分钟内被修改过的文件（找报错日志神器）
find /var/log -mmin -10
```

### 2. `locate`：闪电式搜索（依赖数据库）
比 `find` 快，但需要先更新索引：
```bash
sudo apt install plocate  # 若未安装
sudo updatedb             # 每次新装库后运行，更新数据库
locate libcudnn.so        # 瞬间返回路径
```

### 3. `which` & `whereis`：查找可执行程序
```bash
which nvcc         # 查看当前系统调用的 nvcc 路径
whereis python3    # 查看 python3 的二进制文件、源码及手册位置
```

---

## 二、 库依赖与符号调试（程序跑不起来必看）

### 1. `ldd`：查看程序依赖了哪些库
当你运行程序提示 `shared library not found` 时：
```bash
ldd ./your_executable
# 观察输出中是否含有 "not found"
```

### 2. `ldconfig`：查看系统已缓存的库
Linux 不会自动扫描所有文件夹，它只看 `ld.so.conf` 里的路径：
```bash
# 检查系统当前是否认识某个库
ldconfig -p | grep cuda

# 手动刷新库缓存（新装库到 /usr/local/lib 后运行）
sudo ldconfig
```

### 3. `nm` & `objdump`：查看库内部细节
检查某个 `.so` 库里是否包含某个特定的函数：
```bash
nm -D /usr/lib/libexample.so | grep "FunctionName"
```

---

## 三、 软件包管理（“我到底装没装？”）

### 1. `dpkg`：本地包查询
```bash
dpkg -l | grep nvidia          # 列出所有安装过的 nvidia 相关包
dpkg -L nvidia-l4t-core        # 查看某个包安装了哪些文件到哪些位置
dpkg -S /usr/bin/nvcc          # 反查：这个文件是由哪个包安装的？
```

### 2. `apt`：仓库与依赖查询
```bash
apt-cache depends opencv-main  # 查看该包依赖哪些基础库
apt-cache rdepends <package>   # 查看谁依赖了这个包（删包前确认）
```

---

## 四、 系统与硬件 Debug（“它怎么报错了？”）

### 1. `dmesg`：内核与驱动日志
硬件连不上（如 Wi-Fi、相机、USB）的首选检查：
```bash
sudo dmesg | tail -n 50        # 查看最新的 50 条内核消息
sudo dmesg -w                  # 实时滚动监控日志（插拔设备时使用）
```

### 2. `journalctl`：系统服务日志
如果 NetworkManager 或 Docker 启动失败：
```bash
sudo journalctl -u NetworkManager -f  # 实时查看网络服务报错
```

### 3. 进程与资源监控
```bash
top           # 基础进程监控
htop          # 增强型进程监控（需安装）
# Jetson 专用：
jtop          # 监控 CPU/GPU/温度/库版本
```

---

## 五、 环境配置检查（环境变量）

很多时候“找不到库”是因为路径没加进 `PATH`：

```bash
echo $PATH               # 检查二进制执行路径
echo $LD_LIBRARY_PATH    # 检查动态库加载路径
export                   # 列出当前终端所有的环境变量
```

**快速添加路径到环境变量：**
```bash
echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## 六、 Jetson 专用调试小招

### 1. 强制查看 JetPack 与 L4T 版本
```bash
cat /etc/nv_tegra_release
```

### 2. 检查 OpenCV 是否支持 CUDA
```python
# 在终端直接运行此 python 命令
python3 -c "import cv2; print(cv2.getBuildInformation())" | grep -i "cuda"
```

### 3. 查看 GPU 当前实时负载（非图形界面）
```bash
cat /sys/devices/gpu.0/load
```

---

## 💡 总结：Debug 万能公式
1.  **硬件/驱动不灵** ➔ `dmesg -w`
2.  **程序报库缺失** ➔ `ldd` + `locate`
3.  **命令找不到** ➔ `which` + 环境变量检查
4.  **确认安装版本** ➔ `jtop` 或 `dpkg -l`