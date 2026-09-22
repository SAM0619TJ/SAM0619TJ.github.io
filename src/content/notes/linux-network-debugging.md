---
title: "Linux Network Debugging"
description: "从链路、地址、路由到端口逐层排查 Linux 网络问题。"
date: 2026-09-20
tags: [Linux, Networking, Debugging]
category: "Linux"
draft: false
---

> **Demo content / 示例内容**：用于验证 Notes 排版，可直接删除。

## 分层检查

```bash
ip -br link
ip -br addr
ip route
ss -lntup
```

先确认网卡是否 `UP`，再检查地址和默认路由。端口问题使用 `ss`，DNS 问题使用 `resolvectl status` 和 `dig`。

## 抓包

```bash
sudo tcpdump -ni any host 192.168.1.10 and port 8080
```

抓包可以回答“数据包有没有到达”，但不能替代对路由、防火墙和应用监听状态的检查。
