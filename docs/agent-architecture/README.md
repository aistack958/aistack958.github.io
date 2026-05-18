---
home: true
heroText: Agent 架构与设计
tagline: 理解智能体的核心设计范式，掌握 Agent 的灵魂
actions:
  - text: 开始学习
    link: /agent-architecture/react-pattern.html
    type: primary
  - text: 安全与可控性
    link: /agent-architecture/safety-control.html
    type: secondary

features:
  - title: Agent 基本范式
    details: ReAct、Plan-and-Execute、Reflexion 三大核心范式，理解 Agent 如何感知、思考与行动。
  - title: 多 Agent 协作
    details: 分工策略与编排模式，从 Sequential 到 Hierarchical，构建高效协作的智能体群体。
  - title: 记忆系统
    details: 短期上下文、长期向量检索与记忆压缩，赋予 Agent 持续学习与经验积累的能力。
  - title: 规划与推理
    details: Chain of Thought、Tree of Thought 与任务分解，让 Agent 掌握深度推理与子目标管理。
  - title: 安全与可控性
    details: 权限边界、人类监督与幻觉防御，确保智能体在安全框架内可靠运行。
footer: MIT Licensed | Copyright © 2024-present
---

## Agent 架构模块导览

Agent（智能体）是近年来人工智能领域最引人注目的发展方向之一。与传统的 LLM 调用模式不同，Agent 架构赋予了语言模型**感知环境、自主规划、执行行动与反思迭代**的能力，使其从被动的文本生成工具转变为能够解决复杂多步任务的主动决策系统。

本模块将从五个核心维度系统性地剖析 Agent 的架构设计：

### 核心范式：从感知到行动

任何 Agent 的设计都始于一个基本问题——智能体应当以何种方式组织其"思考-行动"循环？ReAct 范式将推理与行动交织进行，每一步思考都伴随着环境交互；Plan-and-Execute 范式则先将全局规划完成，再逐步执行以减少中途偏差；Reflexion 范式引入了自我反思机制，让 Agent 能够从失败中学习并改进策略。选择何种范式直接决定了 Agent 的行为特征与适用边界。

### 多智能体协作

单个 Agent 的能力存在天然上限，而多 Agent 协作通过角色分工与群体智慧突破了这一限制。不同的编排模式——顺序执行、并行协作、层级管理——各自适应不同的任务结构，而通信机制的设计则决定了信息流转的效率与一致性。

### 记忆系统

没有记忆的 Agent 只能处理瞬态任务。短期记忆维护当前对话与任务上下文，长期记忆通过向量检索唤醒历史经验，而记忆压缩与遗忘策略则解决了无限积累带来的效率退化问题。一个精心设计的记忆系统是 Agent 拥有"持续学习能力"的关键。

### 规划与推理

复杂任务的解决依赖于有效的任务分解与深度推理。Chain of Thought 让 Agent 逐步展开推理过程，Tree of Thought 探索多条推理路径并择优前进，而子目标管理则确保大任务被有序拆解与追踪。

### 安全与可控性

Agent 的自主性是一柄双刃剑。权限边界设计限制 Agent 的行动范围，人类监督机制在关键决策点引入审核，幻觉防御与输出过滤确保 Agent 不会产生有害或虚假的响应。安全架构是 Agent 从实验走向生产的前提保障。

> 💡 **学习建议**：建议按照上述顺序依次阅读，从基本范式入手理解 Agent 的核心循环，再逐步深入协作、记忆、推理与安全等专题维度。