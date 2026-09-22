---
title: "Useful Docker Commands"
description: "日常开发中常用的 Docker 容器、镜像和日志命令速查。"
date: 2026-09-22
tags: [Docker, Linux]
category: "Docker"
draft: false
---

> **Demo content / 示例内容**：用于验证 Notes 列表，可直接删除。

## 容器状态

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker inspect --format '{{.State.Health.Status}}' <container>
```

## 日志与进入容器

```bash
docker logs --tail 200 -f <container>
docker exec -it <container> bash
```

## 清理

先检查空间占用，再执行清理：

```bash
docker system df
docker image prune
```

不要在不了解影响范围时使用 `docker system prune -a --volumes`。
