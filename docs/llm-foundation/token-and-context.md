---
title: Token、上下文窗口与成本核算
description: 理解 Token 计算方式、上下文窗口限制与 API 定价结构，做出经济最优的 Agent 工程决策。
---

# Token、上下文窗口与成本核算

理解 Token 的计算方式、上下文窗口的限制、以及 API 定价的逻辑，是做出经济合理的工程决策的基础。这些看似"运营细节"的知识，实际上深刻影响着你的 Agent 架构设计——从 prompt 精炼度到工具调用策略，都受 Token 经济学的约束。

## Token 的本质与计算

### 什么是 Token

Token 是 LLM 处理文本的最小单位，既不是字符也不是词。它介于两者之间——高频词通常是一个 Token，低频词会被拆分成多个 Token。

**关键规则**：

- 1 个英文字母不等于 1 个 Token。单词 "apple" 可能是 1 个 Token，而 "xylophone" 可能是 3-4 个 Token
- 1 个汉字通常对应 1-3 个 Token，取决于模型的词表设计。中文的 Token 效率显著低于英文
- 代码的 Token 消耗极高——缩进、符号、变量名都会被拆分，一段 100 行代码可能消耗 500+ Token
- 空格、换行、标点也会消耗 Token（通常每个 1 个，但连续空格可能合并）

### 不同模型的中文 Token 效率对比

| 模型 | 1 个汉字 ≈ Token 数 | 1000 字中文 ≈ Token 数 |
|------|---------------------|------------------------|
| GPT-4o | 1.5-2.5 | 1500-2500 |
| Claude | 1.5-2 | 1500-2000 |
| Qwen | 1-1.5 | 1000-1500 |
| Llama (原版) | 2-3 | 2000-3000 |

**核心发现**：Qwen 因为词表专为中文优化，中文 Token 效率最高。这意味着同样 2000 字的中文 prompt，用 Qwen 只消耗约 2000 Token，而用 GPT-4o 可能消耗 4000+ Token——直接影响成本和可用上下文空间。

### Token 计数工具

- **OpenAI tiktoken**：Python 库，支持 GPT 系列的 Token 计数
- **Anthropic token_count API**：Claude 提供在线 Token 计数接口
- **通用估算规则**：英文约 4 字符 = 1 Token，中文约 1.5 字 = 1 Token（粗估）

## 上下文窗口（Context Window）

### 定义与限制

上下文窗口是模型单次调用能处理的 Token 总量上限，包含**输入 + 输出**。超出窗口的内容会被截断或导致 API 报错。

| 模型 | 上下文窗口 |
|------|-----------|
| GPT-4o | 128K |
| GPT-4o-mini | 128K |
| Claude 3.5 Sonnet | 200K |
| Claude 3 Opus | 200K |
| Llama 3 70B | 8K (原版) / 128K (扩展版) |
| Qwen 2.5 72B | 128K |

### 上下文利用率

上下文窗口的大小不等于模型能"有效利用"的长度。实测表明：

- **GPT-4o 在 128K 窗口中，信息检索准确率在 64K 以后开始下降**
- **Claude 在 200K 窗口中的信息检索保持稳定，但超过 150K 后响应时间显著增加**
- **Llama 在 8K 窗口内表现稳定，扩展到 128K 后长距离信息提取能力下降**

这意味着：如果你的 Agent 需要从 100K 的文档中精确提取某一段信息，Claude 是更可靠的选择；如果只需要处理 10K 以内的常规 prompt，GPT-4o 和 Qwen 都足够。

### 对 Agent 设计的影响

1. **Prompt 精炼是第一优先级**：每个浪费的 Token 都在侵蚀你的上下文空间。删掉冗余描述、合并重复指令、压缩工具描述
2. **动态上下文管理**：Agent 在多轮对话中累积的上下文会逼近窗口上限。需要设计滑动窗口、摘要压缩、关键信息提取等策略来管理上下文增长
3. **工具返回结果要截断**：API 调用返回的 JSON 可能包含大量无关字段。在传给模型前做字段筛选和长度截断，避免工具输出挤占宝贵的上下文空间

## API 定价与成本核算

### 主流模型定价对比（2025 年数据）

| 模型 | 输入价格 (每 1M Token) | 输出价格 (每 1M Token) |
|------|----------------------|----------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |
| Llama 3 70B (自托管) | GPU 成本 | GPU 成本 |
| Qwen 2.5 72B (API) | ¥4.00 | ¥12.00 |

### 成本核算公式

```
单次调用成本 = (输入 Token 数 × 输入单价 + 输出 Token 数 × 输出单价) / 1,000,000
```

**实战案例**：一个 Agent 单次任务需要 3000 Token 输入（含系统提示 + 任务描述 + 工具返回），模型输出 500 Token：

- GPT-4o：$(3000 × 2.5 + 500 × 10) / 1M = $0.0175
- GPT-4o-mini：$(3000 × 0.15 + 500 × 0.60) / 1M = $0.00075
- Claude 3.5 Sonnet：$(3000 × 3 + 500 × 15) / 1M = $0.0165

### 降低成本的工程策略

1. **分层模型策略**：核心推理节点用强模型（GPT-4o / Claude Sonnet），辅助节点（格式化、简单提取）用轻量模型（GPT-4o-mini / Claude Haiku），成本可降低 5-10 倍
2. **Prompt 缓存**：OpenAI 和 Anthropic 都支持 Prompt Caching——重复的系统提示和工具定义部分可以被缓存，输入 Token 费用降低 50%-90%
3. **输出长度控制**：设置 `max_tokens` 参数限制输出长度，避免模型在不确定时生成冗长回答浪费输出 Token
4. **批处理调用**：OpenAI 的 Batch API 提供 50% 折扣，适合不需要实时响应的后台 Agent 任务

---

## 本章小结

| 主题 | 核心结论 |
|------|---------|
| **Token 计算** | 中文约 1-1.5 字/Token（Qwen 最优），英文约 4 字符/Token；代码 Token 消耗极高 |
| **上下文窗口** | Claude 200K 最优，但实际有效利用约 150K；GPT-4o 128K，64K 后准确率下降 |
| **成本核算** | 单次调用成本 = (输入 Token × 输入单价 + 输出 Token × 输出单价) / 1M |
| **降本策略** | 分层模型（强模型+轻量模型）、Prompt 缓存、输出长度控制、Batch API |

**决策口诀**：实验阶段用 mini/Haiku 验证，生产阶段按需切换；长文本优先 Claude，高频调用优先自托管 Llama；中文场景 Qwen Token 效率最高。

---

> 📖 **延伸阅读**
>
> 1. [OpenAI Pricing](https://openai.com/api/pricing/) —— 官方定价与计费规则
> 2. [Anthropic Token Counting](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) —— Claude Token 计数指南
> 3. [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) —— Prompt 缓存机制详解
> 4. [Tiktoken 文档](https://github.com/openai/tiktoken) —— OpenAI 开源 Token 计数库
>
> 💡 **决策建议**：在项目初期先用 GPT-4o-mini 或 Claude Haiku 快速验证 Agent 逻辑，确认可行后再切换到强模型优化输出质量。不要在实验阶段就用最贵的模型——试错成本会拖垮项目节奏。