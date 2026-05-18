---
home: true
heroText: Agent 开发框架
tagline: 选对工具，事半功倍——主流 Agent 开发框架全览
actions:
  - text: 开始学习
    link: /agent-frameworks/langchain-langgraph.html
    type: primary
  - text: MCP 协议详解
    link: /agent-frameworks/mcp-protocol.html
    type: secondary
features:
  - title: LangChain 与 LangGraph
    details: 最成熟的开源 Agent 框架生态，LangGraph 状态图驱动多步骤 Agent 编排，适合需要精细控制执行流程的复杂应用。
  - title: Claude Agent SDK
    details: Anthropic 官方推出的 Agent 开发工具，原生支持工具定义、流式处理与 MCP 集成，聚焦安全可控的 Agent 循环设计。
  - title: OpenAI Agents SDK
    details: OpenAI 官方 Agent 框架，以 Runner 驱动执行、Handoff 机制实现多 Agent 协作、Guardrails 保障安全边界，架构简洁清晰。
  - title: AutoGen 与 CrewAI
    details: 多 Agent 对话与角色协作的两种典型范式——AutoGen 侧重灵活对话编排，CrewAI 强调角色与任务的显式定义，各有适用场景。
  - title: Dify 与 Coze
    details: 低代码 Agent 平台的代表，可视化编排降低开发门槛，丰富的插件生态加速落地，但灵活性与可控性存在固有局限。
  - title: MCP 协议
    details: Model Context Protocol 为 Agent 工具调用建立统一标准，Server/Client 架构解耦工具提供与消费，正在成为 Agent 生态的基础设施。
footer: MIT Licensed | Copyright © 2024-present Agent Learning Community
---

## 为什么需要 Agent 开发框架？

构建一个 AI Agent 远不止调用大模型 API 那么简单。一个实用的 Agent 系统需要处理工具调用、记忆管理、多步骤推理、错误恢复、人机协作等一系列工程问题。如果从零开始实现这些能力，开发者将面临大量重复性工作，且容易陷入架构设计的陷阱。

Agent 开发框架的核心价值在于：**将经过验证的架构模式抽象为可复用的组件**，让开发者专注于业务逻辑而非基础设施。不同框架在抽象层次和设计哲学上各有侧重——

- **LangChain / LangGraph** 提供最广泛的组件生态，LangGraph 的状态图机制适合需要精确控制执行路径的复杂场景；
- **Claude Agent SDK / OpenAI Agents SDK** 是模型厂商的官方方案，与自家模型深度优化，API 设计更简洁直观；
- **AutoGen / CrewAI** 聚焦多 Agent 协作，分别从对话流和角色分工两个维度解决群体智能的编排问题；
- **Dify / Coze** 以低代码方式降低门槛，让非技术背景的用户也能快速搭建 Agent 应用；
- **MCP 协议** 则从更底层解决工具互操作问题，为不同框架和模型的工具生态建立统一的连接标准。

## 如何选择适合的框架？

选择框架时，建议从以下几个维度评估：

1. **应用复杂度**：简单工具调用场景用 SDK 即可，多步骤编排需要 LangGraph 等状态管理能力，多 Agent 协作则需要 AutoGen 或 CrewAI。
2. **模型偏好**：如果主力模型是 Claude 或 GPT，官方 SDK 的适配度和优化程度通常更好。
3. **团队背景**：技术团队可以选择代码级框架获得最大灵活性；产品团队或非技术人员更适合低代码平台。
4. **工具生态需求**：如果需要接入大量外部工具，MCP 协议的标准化支持值得优先考虑。
5. **生产可靠性**：评估框架的错误处理、可观测性、部署支持等生产级特性是否满足需求。

本模块将逐一深入这些框架的核心机制与适用场景，帮助你在实际项目中做出明智的技术选型。