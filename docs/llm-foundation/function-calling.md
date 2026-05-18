# Function Calling 与 Tool Use 协议

Function Calling 是 LLM 从"文本生成器"进化为"行动执行者"的关键协议。它让模型能识别何时需要调用外部工具、构造符合规范的调用参数、并将工具返回结果融入后续推理。这是构建 Agent 系统的核心工程接口。

## 基本原理

### 工作流程

Function Calling 的完整流程包含四个阶段：

1. **工具注册**：开发者预先定义一组工具的名称、参数 schema 和描述，随请求发送给模型
2. **决策触发**：模型根据用户请求和可用工具列表，判断是否需要调用工具，以及调用哪个工具
3. **参数构造**：模型生成符合 schema 的 JSON 参数对象
4. **结果融合**：开发者执行工具调用，将结果返回给模型，模型基于结果生成最终回答

这个流程的关键洞察是：**模型不直接执行工具，它只生成调用意图和参数，执行由你的代码完成**。这种设计保证了安全性——模型无法绕过你的权限控制直接访问数据库或发送邮件。

### 为什么不直接在 Prompt 中描述工具？

早期 Agent 开发尝试在普通 prompt 中描述工具，让模型用自然语言表达调用意图（如"我需要查询数据库中用户 ID 为 123 的订单"），然后由代码解析这段文字。这种方式的问题：

- **解析不稳定**：自然语言描述的参数格式不可预测，代码难以可靠提取
- **无法强制类型**：模型可能把数字参数写成字符串，把必填参数遗漏
- **多工具选择不精确**：模型可能模糊地表达意图，代码无法确定调用哪个工具

Function Calling 协议通过结构化的 JSON schema 解决了这些问题——模型在训练时就学会了按 schema 生成参数，可靠性远高于自然语言解析。

## OpenAI Function Calling 格式

### 工具定义

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "获取指定城市的当前天气信息",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "城市名称，如'北京'、'上海'"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "温度单位"
            }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

### 模型响应（决定调用工具时）

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"city\": \"北京\", \"unit\": \"celsius\"}"
            }
          }
        ]
      }
    }
  ]
}
```

### 返回工具结果

```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\"temperature\": 22, \"condition\": \"晴\", \"humidity\": 45}"
}
```

### 关键设计特点

- 每个 tool_call 有唯一 `id`，返回结果必须匹配该 id
- `arguments` 是 JSON 字符串（不是 JSON 对象），需要二次解析
- 模型可以在单次响应中发起**多个并行 tool_calls**
- `parallel_tool_calls` 参数可控制是否允许并行调用

## Claude Tool Use 格式

### 工具定义

```json
{
  "tools": [
    {
      "name": "get_weather",
      "description": "获取指定城市的当前天气信息",
      "input_schema": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "城市名称"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"]
          }
        },
        "required": ["city"]
      }
    }
  ]
}
```

### 模型响应

```json
{
  "content": [
    {
      "type": "text",
      "text": "让我查询北京的天气信息"
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q",
      "name": "get_weather",
      "input": {
        "city": "北京",
        "unit": "celsius"
      }
    }
  ]
}
```

### 返回工具结果

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q",
      "content": "{\"temperature\": 22, \"condition\": \"晴\", \"humidity\": 45}"
    }
  ]
}
```

## Claude vs OpenAI 的关键差异

| 维度 | OpenAI | Claude |
|------|--------|--------|
| 工具定义字段 | `function.parameters` | `input_schema` |
| 调用结果角色 | `role: "tool"` | `role: "user"`（工具结果以 user 消息返回） |
| 参数格式 | JSON **字符串** (`arguments`) | JSON **对象** (`input`) |
| 并行调用 | 支持，有 `parallel_tool_calls` 控制 | 支持，多个 tool_use block |
| 混合输出 | 调用工具时 `content: null` | 可以同时包含文本和 tool_use |
| 调用 ID 前缀 | `call_` | `toolu_` |
| 强制调用 | `tool_choice: {"type": "function", "function": {"name": "xxx"}}` | `tool_choice: {"type": "tool", "name": "xxx"}` |
| 拒绝调用 | `tool_choice: "none"` | `tool_choice: {"type": "auto"}` + 在系统提示中声明不使用工具 |

### 最影响工程的三个差异

1. **工具结果的角色不同**：OpenAI 用 `role: "tool"`，Claude 用 `role: "user"`。这意味着在 Claude 中，工具结果是"用户消息"的一部分，对话历史管理逻辑需要适配
2. **参数是对象还是字符串**：OpenAI 的 `arguments` 是字符串需要 `JSON.parse()`，Claude 的 `input` 是对象可以直接使用。Claude 的设计更安全——避免了模型生成非法 JSON 字符串的问题
3. **混合输出能力**：Claude 可以在同一条消息中既输出文本解释又发起工具调用，这让 Agent 的可观测性更好——用户能看到"模型为什么决定调用这个工具"。OpenAI 在调用工具时 `content` 为 null，丢失了推理解释

## 工具定义的工程最佳实践

### 描述要精确且包含边界条件

```json
{
  "name": "search_database",
  "description": "在业务数据库中执行 SQL 查询。只支持 SELECT 语句，不支持 INSERT/UPDATE/DELETE。查询结果最多返回 100 行。表名必须是以下之一：users, orders, products。"
}
```

不写边界条件的描述会让模型尝试非法操作——这是 Function Calling 最常见的故障来源。

### 参数 description 要包含取值示例

```json
{
  "city": {
    "type": "string",
    "description": "城市名称，使用中文全名，如'北京市'而非'北京'或'BJ'"
  }
}
```

示例比规则更有效。模型从 `"北京市"` 这个示例中学到的格式约束，比从"使用中文全名"这条规则中学到的更可靠。

### 必填 vs 选填要明确

将核心参数标记为 `required`，辅助参数不标记。模型对必填参数的遗漏率远低于选填参数——把判断"这个参数能不能省"的决策留给开发者，不留给模型。

## 多工具场景的设计策略

当 Agent 注册 10+ 个工具时，模型的选择准确率会下降。应对策略：

1. **工具分组**：根据任务阶段动态切换可用工具集——搜索阶段只暴露搜索工具，执行阶段只暴露操作工具
2. **工具名称要语义清晰**：`search_user_by_id` 比 `query_db_1` 更容易让模型准确选择
3. **减少工具间的功能重叠**：如果 `search_user_by_name` 和 `search_user_by_email` 功能相似，合并为 `search_user(by: "name" | "email")`
4. **控制工具数量**：单次请求中工具超过 20 个时，考虑分层路由——先用一个"路由工具"选择类别，再暴露该类别的具体工具

---

> 📖 **延伸阅读**：Anthropic 官方文档的 [Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) 页面和 OpenAI 的 [Function Calling](https://platform.openai.com/docs/guides/function-calling) 页面提供了完整的格式规范与更新日志，建议持续关注协议变更。