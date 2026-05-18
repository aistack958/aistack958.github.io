# OpenAI Agents SDK

OpenAI 在 2025 年正式发布了 Agents SDK（此前以 Swarm 实验项目为原型），定位为构建多 Agent 系统的轻量级框架。与 LangGraph 的状态图复杂度不同，Agents SDK 追求极简的架构设计——几个核心概念覆盖了 Agent 开发的主要需求，代码量少、学习成本低、与 OpenAI 模型深度适配。

## 架构设计

Agents SDK 的架构围绕四个核心概念展开：

- **Agent**：一个 Agent 是配置单元而非执行单元，它定义了名称、模型、指令（system prompt）、可用工具列表以及 handoff 配置。Agent 本身不执行任何逻辑，只是一个声明式的配置对象。
- **Tool**：工具分为两类——函数工具（Function Tool）是开发者定义的 Python 函数，自动转换为 OpenAI 函数调用格式；Handoff 工具是一种特殊的内置工具，用于将对话从一个 Agent 转交到另一个 Agent。
- **Runner**：Runner 是唯一的执行引擎，它接收一个 Agent 配置和用户消息，驱动完整的 Agent 循环（推理 → 工具调用 → 再次推理），直到 Agent 输出最终响应或发生 handoff。Runner 管理消息历史、工具执行、错误处理等所有运行时逻辑。
- **Guardrails**：安全护栏机制，分为输入护栏和输出护栏。每个护栏是一个检查函数，在用户输入进入 Agent 之前或 Agent 输出返回给用户之前执行验证，不符合条件的输入或输出会被拦截。

这种架构的核心设计理念是**配置与执行分离**：Agent 只描述"做什么"，Runner 决定"怎么做"。开发者不需要手动实现 Agent 循环，只需定义 Agent 配置然后交给 Runner 执行。

## 工具调用

Agents SDK 的工具调用流程简洁而完整：

1. Runner 将 Agent 配置（含工具定义）和用户消息发送给 OpenAI 模型
2. 模型返回函数调用请求（指定工具名称和参数）
3. Runner 自动执行对应的 Python 函数，将结果返回给模型
4. 重复直到模型输出最终文本响应

函数工具的定义非常简单——一个普通 Python 函数加上类型标注即可：

```python
from agents import Agent, function_tool

@function_tool
def search_database(query: str, limit: int = 10) -> str:
    """搜索数据库获取相关信息"""
    # 实际搜索逻辑
    return results

agent = Agent(
    name="research_agent",
    instructions="你是一个研究助手，帮助用户查找信息",
    tools=[search_database],
)
```

SDK 自动从函数签名和 docstring 生成 OpenAI 需要的工具描述 JSON，开发者无需手动编写 schema。这种设计显著减少了工具定义的 boilerplate 代码。

## Handoff 机制

Handoff 是 Agents SDK 处理多 Agent 协作的核心机制，也是区别于其他框架的关键特性：

- **定义方式**：在 Agent 配置中通过 `handoffs` 参数列出可以转交的目标 Agent。SDK 自动为每个目标 Agent 生成一个 handoff 工具。
- **触发方式**：当当前 Agent 认为应该将对话转交给另一个 Agent 时，模型调用对应的 handoff 工具，参数中可以携带转交原因和上下文摘要。
- **执行过程**：Runner 收到 handoff 调用后，停止当前 Agent 的循环，将对话历史和转交上下文传递给目标 Agent，目标 Agent 开始新的推理循环。
- **上下文传递**：handoff 支持通过 `on_handoff` 回调函数在转交时执行自定义逻辑，例如更新全局状态、记录转交日志、修改目标 Agent 的指令等。

Handoff 与简单的"子 Agent 调用"不同——它是对话权的转移而非嵌套调用。转交后，目标 Agent 完全接管对话，原 Agent 不再参与后续推理。这种模式更符合人类协作的直觉：专家 A 将问题转给专家 B 后，由 B 全权处理。

## Runner 与 Guardrails

**Runner** 是 Agents SDK 的执行入口，三种运行模式覆盖不同场景：

- `Runner.run()`：同步执行，适合脚本和批处理场景
- `Runner.run_async()`：异步执行，适合 Web 服务和并发场景
- `Runner.run_streamed()`：流式执行，逐事件返回中间步骤，适合交互式 UI

Runner 的内部实现是一个标准的 Agent 循环，但它在循环中集成了 Guardrails 检查：

- **输入护栏**：在用户消息进入模型之前执行。例如检查是否包含敏感信息、是否超出 Agent 的处理范围、是否需要先进行身份验证。
- **输出护栏**：在 Agent 最终响应返回之前执行。例如验证输出格式、过滤不当内容、确保不泄露内部信息。

护栏函数返回 `GuardrailResult`，包含是否通过和可选的修正信息。不通过的输入或输出会被拦截，Runner 根据配置决定是抛出异常还是使用修正后的内容继续执行。

这种设计让安全控制从"事后审查"变为"流程内嵌"，在每个 Agent 循环的关键节点自动执行，无需开发者手动在每一步插入检查逻辑。