---
home: true
heroText: LLM 核心能力
tagline: 掌握大语言模型的基础，成为 Agent 工程师的第一步
actionText: 开始学习 →
actionLink: /llm-foundation/transformer.html
features:
  - title: Transformer 与注意力机制
    details: 深入理解自注意力、多头注意力、位置编码等核心机制，夯实模型架构基础
  - title: 主流大模型对比
    details: GPT、Claude、Llama、Qwen 等模型的能力边界、适用场景与选型策略
  - title: Prompt Engineering
    details: 系统提示、思维链、结构化输出等高阶技巧，让模型输出精准可控
  - title: Token 与成本核算
    details: 理解 token 计算方式、上下文窗口限制与 API 定价，做出经济最优决策
  - title: Function Calling
    details: Tool Use 协议原理、格式规范，以及不同厂商实现的差异对比
footer: LLM Foundation Module
---

## 模块概述

大语言模型（Large Language Model, LLM）是现代 AI Agent 系统的基石。无论你是在构建对话机器人、自动化工作流，还是复杂的多 Agent 协作系统，对 LLM 内部原理的深刻理解都将直接影响你的工程决策质量。

本模块从五个维度为你构建 LLM 的核心认知框架：

### 1. 架构层：Transformer 与注意力机制

Transformer 是当前所有主流 LLM 的底层架构。理解自注意力（Self-Attention）如何让模型捕捉序列中的长距离依赖关系，理解多头注意力如何让模型同时关注多个语义维度，理解位置编码如何解决序列顺序信息的注入问题——这些不是抽象的学术知识，而是你在选择模型、设计 prompt、排查输出异常时需要的底层直觉。

### 2. 选型层：主流大模型特性对比

GPT-4 系列擅长复杂推理与代码生成，Claude 在长文本理解与安全对齐方面表现突出，Llama 提供开源生态的自由度，Qwen 在中文场景与多语言任务上有独特优势。每个模型都有其能力边界与适用场景，本模块帮助你建立清晰的选型决策树。

### 3. 交互层：Prompt Engineering 高阶技巧

Prompt 不只是"输入一段文字"。系统提示（System Prompt）设定角色与约束，思维链（Chain-of-Thought）引导推理过程，结构化输出（Structured Output）确保格式可控，Few-shot 示例传递隐含的模式——掌握这些技巧，你才能让模型在 Agent 工程中稳定、可预测地工作。

### 4. 经济层：Token 与成本核算

每个 API 调用都在消耗 token，而 token 的计算方式、上下文窗口的利用率、不同模型的定价结构都会显著影响你的系统运营成本。理解这些细节，才能做出"够用且不浪费"的工程决策。

### 5. 工程层：Function Calling 与 Tool Use

Function Calling 是 LLM 从"文本生成器"进化为"行动执行者"的关键协议。不同厂商在这一协议上的实现差异——Claude 的 tool_use block 与 OpenAI 的 function_call 格式——会直接影响你的 Agent 框架设计。

---

> 💡 **学习建议**：建议按照上述顺序依次学习，每一层都依赖前一层的知识基础。完成本模块后，你将具备阅读 Agent 工程模块和框架模块所需的全部 LLM 前置知识。