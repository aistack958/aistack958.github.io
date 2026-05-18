---
title: Claude Agent SDK 与 Anthropic API
description: 掌握 Claude Agent SDK 的工具定义、流式处理、Agent 循环与 MCP 集成，以及与 Claude 模型深度适配的开发技巧。
---

# Claude Agent SDK 与 Anthropic API

Anthropic 在 2025 年推出了 Claude Agent SDK，为基于 Claude 模型构建 Agent 应用提供了官方开发工具。与第三方框架相比，Agent SDK 的最大优势在于与 Claude 模型能力的深度适配——从工具调用的协议设计到流式输出的处理方式，都围绕 Claude 的特性做了针对性优化。

## 工具定义

Agent SDK 的工具定义遵循 Anthropic 的标准工具使用协议。每个工具通过 JSON Schema 描述输入参数，Claude 模型根据工具名称和描述自主决策何时调用：

```python
from anthropic import Anthropic

client = Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的当前天气信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["city"]
        }
    }
]
```

模型返回 `tool_use` 类型的消息块，包含工具名称和解析好的输入参数。开发者执行工具后，将结果以 `tool_result` 格式返回给模型，继续推理循环。整个过程无需手动解析模型的文本输出，结构化的工具调用协议消除了格式不一致的风险。

## 流式处理

Agent 的推理过程通常需要较长时间，流式输出对用户体验至关重要。Agent SDK 支持在工具调用循环中逐步流式返回内容：

- **文本内容**：通过 `content_block_delta` 事件逐 token 输出，用户可以看到 Agent 的思考过程逐步展开。
- **工具调用**：工具名称和参数也支持流式输出，前端可以在参数构建完成前就开始展示即将调用的工具信息。
- **思考内容**：Claude 的扩展思考（Extended Thinking）能力在 Agent 场景下尤为有用——模型可以先进行内部推理再决定是否调用工具，流式返回思考内容让用户理解 Agent 的决策依据。

流式处理的关键设计是：**工具执行结果不流式**（工具返回是确定性的），但模型对工具结果的后续推理继续流式。这种不对称设计既保证了交互响应性，又避免了工具执行中间状态的歧义。

## Agent 循环

Agent SDK 的核心执行模式是一个显式的 Agentic Loop：

1. 发送用户消息（含工具定义）给 Claude 模型
2. 接收模型响应，检查是否包含 `tool_use` 块
3. 如果包含工具调用：执行对应工具，将结果以 `tool_result` 返回
4. 将工具结果追加到消息历史，再次调用模型
5. 重复步骤 2-4，直到模型响应不含工具调用，输出最终回答

这个循环与 LangChain 的 `AgentExecutor` 类似，但有几个关键差异：

- **无隐式行为**：每一步的输入输出都是显式的消息对象，没有框架层面的"魔法"处理。
- **安全边界明确**：开发者可以在循环的任意位置插入检查逻辑，例如限制最大迭代次数、校验工具调用参数、拦截敏感操作。
- **与 Claude 特性深度耦合**：扩展思考、工具选择的置信度、多模态输入等 Claude 专属能力在循环中自然集成。

## 与 MCP 集成

Anthropic 是 MCP（Model Context Protocol）协议的主要推动者，Agent SDK 与 MCP 的集成是官方推荐的工具接入方式：

- **MCP Client 模式**：Agent SDK 可以作为 MCP Client 连接外部 MCP Server，将 Server 提供的工具自动注册为可用工具。这意味着 Agent 可以无缝接入任何支持 MCP 协议的工具服务——数据库查询、文件操作、API 调用等。
- **工具发现动态化**：通过 MCP，Agent 不再需要在启动时硬编码所有工具定义，而是可以动态发现和加载运行时可用的工具。
- **标准化的工具交互**：MCP 协议统一了工具描述、调用和返回的格式，消除了不同工具提供方之间的适配成本。

这种集成使 Claude Agent SDK 的工具生态不再局限于开发者手动定义的范围，而是可以接入整个 MCP 工具网络，显著扩展了 Agent 的能力边界。
---

## 本章小结

Claude Agent SDK 的核心优势在于与 Claude 模型的深度适配：
- **工具调用**：`input_schema` 格式直接可用，无需二次解析
- **流式处理**：支持 SSE 实时推送推理过程
- **Agent 循环**：简化的 `while` 循环 + 工具结果注入
- **MCP 集成**：动态发现外部工具，扩展能力边界

**适用场景**：已选择 Claude 作为主要模型的团队，追求与模型原生能力的最优匹配。

---

> 📖 **延伸阅读**
>
> 1. [Anthropic Agent SDK 文档](https://docs.anthropic.com/en/docs/agents-and-tools/overview) —— 官方开发指南
> 2. [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) —— 工具调用协议详解
> 3. [Anthropic Streaming](https://docs.anthropic.com/en/docs/build-with-claude/streaming) —— 流式输出实现
> 4. [MCP Integration](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) —— MCP Client 模式集成
