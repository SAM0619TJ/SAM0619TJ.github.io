---
title: "Linux Network Debugging"
description: "从链路、地址、路由到端口逐层排查 Linux 网络问题。"
date: 2026-09-20
tags: [Linux, Networking, Debugging]
category: "Linux"
draft: false
---

## 分层检查

```bash
ip -br link
ip -br addr
ip route
ss -lntup
```

先确认网卡是否 `UP`，再检查地址和默认路由。端口问题使用 `ss`，DNS 问题使用 `resolvectl status` 和 `dig`。

建议按下面的顺序推进，不要一开始就修改 NetworkManager 或防火墙配置：

1. `ip -br link`：链路是否存在并处于 `UP`；
2. `ip -br addr`：地址、掩码和地址族是否正确；
3. `ip route get <目标地址>`：内核实际选择的出口与下一跳；
4. `ping` 或 `arping`：验证三层或同网段二层可达性；
5. `ss -lntup`：服务是否监听在正确地址和端口；
6. `dig`：仅在直接访问 IP 正常后排查 DNS。

## 抓包

```bash
sudo tcpdump -ni any host 192.168.1.10 and port 8080
```

抓包可以回答“数据包有没有到达”，但不能替代对路由、防火墙和应用监听状态的检查。

常见判断方式：

- 完全看不到请求包：优先检查调用端路由、VLAN 和中间网络；
- 能看到请求但没有响应：检查本机防火墙、监听地址和应用日志；
- 请求和响应都存在但应用超时：检查返回路径、NAT、MTU 和上层协议；
- TCP 重复重传：检查丢包、拥塞、MTU 或接收端处理能力。

## 容器与主机网络

容器内访问异常时，同时记录容器网络模式和宿主机规则：

```bash
docker inspect <container> --format '{{json .NetworkSettings.Networks}}'
ip netns list
sudo nft list ruleset
```

先验证宿主机能否访问目标，再验证容器到宿主机，最后验证容器到目标，可以快速缩小故障范围。
