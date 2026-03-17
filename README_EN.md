# 🧬 IPClaw

[English](./README_EN.md) | [中文](./README.md)

> AI-powered IP analysis and tracking system

[![Star](https://img.shields.io/github/stars/AIPMAndy/IPClaw?style=flat)](https://github.com/AIPMAndy/IPClaw/stargazers)
[![License](https://img.shields.io/github/license/AIPMAndy/IPClaw)](https://github.com/AIPMAndy/IPClaw)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)

---

## 🚀 Quick Start

```bash
# Install
pip install ipclaw

# Analyze an IP
ipclaw --analyze 192.168.1.1
ipclaw --trace example.com
```

---

## 📺 Demo

```bash
$ ipclaw --analyze 8.8.8.8
🔍 IP Analysis:
   
   IP: 8.8.8.8
   Location: United States
   ASN: AS15169
   Provider: Google LLC
   
$ ipclaw --trace github.com
📡 Traceroute to github.com:
   1  192.168.1.1
   2  10.0.0.1
   3  172.16.0.1
   ...
```

---

## Features

- IP Geolocation
- ASN Lookup
- Traceroute
- DNS Analysis

---

## License

MIT License
