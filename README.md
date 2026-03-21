# 🧬 IPClaw

[English](./README_EN.md) | 中文

> AI 驱动的 IP 分析与追踪系统

[![Star](https://img.shields.io/github/stars/AIPMAndy/IPClaw?style=flat)](https://github.com/AIPMAndy/IPClaw/stargazers)
[![License](https://img.shields.io/github/license/AIPMAndy/IPClaw)](https://github.com/AIPMAndy/IPClaw)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)

---

## 🚀 快速开始

```bash
# 安装
pip install ipclaw

# 分析 IP
ipclaw --analyze 192.168.1.1
ipclaw --trace example.com
```

---

## 📺 Demo 演示

```bash
$ ipclaw --analyze 8.8.8.8
🔍 IP 分析:
   
   IP: 8.8.8.8
   位置: 美国
   ASN: AS15169
   供应商: Google LLC
   
$ ipclaw --trace github.com
📡 路由追踪到 github.com:
   1  192.168.1.1
   2  10.0.0.1
   3  172.16.0.1
   ...
```

---

## 🎯 核心功能

- IP 地理位置查询
- ASN 查找
- 路由追踪
- DNS 分析

---

## 📁 项目结构

```
IPClaw/
├── ipclaw/          # 核心模块
├── scripts/         # 命令行工具
└── tests/          # 测试用例
```

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📄 License

Apache 2.0 License
