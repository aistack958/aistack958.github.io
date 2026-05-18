---
home: true
title: Agent 工程实践
heroText: Agent 工程实践
tagline: 从原型到产品——Agent 工程化落地的关键技能
actions:
  - text: 开始学习
    link: /agent-engineering/rag-engineering.html
    type: primary
  - text: 可观测性
    link: /agent-engineering/observability.html
    type: secondary

features:
  - title: RAG 工程化
    details: 检索策略设计、Embedding 选型与重排序、质量评估指标体系，以及生产环境中常见的坑点与应对方案。
  - title: 工具设计与封装
    details: API 接入规范、沙箱执行环境、错误处理模式、工具描述的最佳实践——让 Agent 真正"用得上"工具。
  - title: 流式输出与用户体验
    details: SSE/WebSocket 实时推送、增量渲染策略、中断与取消控制、进度反馈机制——打造流畅的 Agent 交互体验。
  - title: 可观测性
    details: Trace 链路追踪、调试工具链、效果评估指标、Langfuse/Phoenix 等可观测性平台的实战接入。
  - title: 部署与成本优化
    details: 模型选择策略、缓存机制设计、批处理优化、API 成本控制实战——让 Agent 跑得起、跑得省。
  - title: 测试与评估框架
    details: Agent 单元测试方法、效果评估基准构建、回归测试策略、自动化评测流水线搭建。
footer: MIT Licensed | Copyright © 2024-present
---

## 为什么需要 Agent 工程实践？

构建一个能跑的 Agent 原型并不难——一个 Prompt 加几个工具调用，几十行代码就能让 LLM "动起来"。但从原型走向生产，从 Demo 走向产品，中间横亘着一系列工程化难题：

- **检索质量不稳**：RAG 系统在实际数据上召回率和准确性波动大，简单向量检索往往"检索到了但不对"。
- **工具调用失败**：API 超时、权限不足、格式解析错误，每一个工具都可能成为 Agent 的"断点"。
- **用户体验粗糙**：长时间等待无反馈、输出中断无法恢复、错误信息让用户不知所措。
- **问题难以排查**：Agent 的多步推理链路复杂，一次调用涉及模型决策、工具执行、上下文拼接，出问题后"看不清哪里错了"。
- **成本不可控**：一个复杂任务可能触发数十次模型调用，Token 消耗和 API 费用在规模化场景下迅速失控。
- **质量无法验证**：Agent 的输出依赖推理路径而非固定逻辑，传统测试方法难以覆盖"行为正确性"。

本模块围绕上述六大主题，系统讲解 Agent 从原型到产品的工程化落地技能。每个章节都包含：核心概念讲解、生产级实践方案、常见坑点与避坑指南、工具与平台推荐。

::: tip 学习路径建议
建议按 RAG 工程化 → 工具设计 → 流式输出 → 可观测性 → 部署优化 → 测试评估 的顺序阅读，但各章节相对独立，可根据实际需求跳读。
:::