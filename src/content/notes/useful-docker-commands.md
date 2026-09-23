---
title: "Useful Docker Commands"
description: "日常开发中常用的 Docker 容器、镜像和日志命令速查。"
date: 2026-09-22
tags: [Docker, Linux]
category: "Docker"
draft: false
---

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

`prune` 会删除不再被引用的对象。执行前应先用 `docker system df -v` 确认空间主要由镜像、构建缓存还是 volume 占用，不要把清理命令放入缺少审计的定时任务。

## 资源与进程

```bash
docker stats --no-stream
docker top <container>
docker inspect <container> --format '{{json .State}}'
```

容器反复重启时，先检查 `.State.ExitCode`、`.State.OOMKilled` 和 restart policy，再查看应用日志。退出码 `137` 常见于进程收到 `SIGKILL`，但仍需结合 OOM 记录确认原因。

## 文件与网络

```bash
docker cp <container>:/path/to/file ./file
docker port <container>
docker inspect <container> --format '{{json .NetworkSettings.Networks}}'
```

排查“宿主机可访问、容器不可访问”时，应分别确认 DNS、默认路由、代理变量和容器网络模式。

## 构建缓存

```bash
docker buildx du
docker builder prune --filter 'until=168h'
```

先使用 `docker buildx du` 查看缓存归属，再按时间或 builder 定向清理。共享构建机上不要直接执行无过滤条件的全量清理。

不要在不了解影响范围时使用 `docker system prune -a --volumes`。
