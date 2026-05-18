---
title: 部署与成本优化
---

# 部署与成本优化

Agent 的推理成本是规模化落地的最大障碍之一。一个复杂任务可能触发 5-20 次模型调用，每次调用消耗数百到数千 Token。当日活用户从 100 增长到 10000 时，API 费用可能从每月几百元飙升到数万元。本章从模型选择策略、缓存机制、批处理优化、API 成本控制四个维度，讲解如何让 Agent"跑得起、跑得省"。

## 模型选择策略

### 不是每个步骤都需要最强模型

Agent 的推理链路中，不同步骤对模型能力的要求差异很大：

| 步骤 | 模型要求 | 推荐模型 | 单次 Token 成本 |
|------|----------|----------|------------------|
| 用户意图解析 | 分类能力，低 | GPT-4o-mini / Claude Haiku | 约 $0.15/1M |
| 工具调用决策 | 结构化输出，中 | GPT-4o / Claude Sonnet | 约 $2.5/1M |
| 复杂推理与判断 | 推理能力，高 | GPT-4o / Claude Opus | 约 $15/1M |
| 最终回答生成 | 语言表达，中 | GPT-4o / Claude Sonnet | 约 $2.5/1M |
| 简单格式化 | 模板填充，低 | GPT-4o-mini / Claude Haiku | 约 $0.15/1M |

**策略：分级模型分配**。将 Agent 的不同步骤分配到不同能力的模型上，只在需要强推理的节点使用高价模型。这种"模型路由"策略可以将总成本降低 60-80%，同时保持输出质量。

### 模型路由的实现

```python
def select_model(step_type, complexity_score):
    """根据步骤类型和复杂度选择模型"""
    if step_type == "intent_parsing":
        return "gpt-4o-mini"
    elif step_type == "tool_call_decision":
        return "gpt-4o" if complexity_score > 0.7 else "gpt-4o-mini"
    elif step_type == "complex_reasoning":
        return "claude-opus"  # 高难度推理用最强模型
    elif step_type == "response_generation":
        return "gpt-4o"
    else:
        return "gpt-4o-mini"  # 默认用低成本模型
```

关键点：**复杂度评分机制**。在调用高价模型前，先用低价模型判断"这个任务是否需要强推理"。例如，一个简单的订单查询不需要 Opus 级别的推理，但一个需要综合多源信息做决策的任务就需要。

### 开源模型的定位

开源模型（Qwen2、DeepSeek-V2、Llama3 等）在特定场景可以作为商业 API 的替代：

- **私有化部署场景**：数据不能外发，必须本地推理。
- **高频低复杂度步骤**：意图分类、简单提取等步骤，开源模型表现接近商业模型，成本仅为推理算力费用。
- **备用模型**：当商业 API 限流或宕机时，开源模型作为降级选择。

开源模型的隐性成本：推理服务器运维、模型更新、GPU 资源——这些并非零成本，规模化场景下需要仔细核算。

## 缓存机制

### Prompt 缓存

Agent 的系统 Prompt（角色设定、工具列表、输出格式要求等）在每次调用中重复发送，占据大量输入 Token。Prompt 缓存利用 LLM API 的缓存功能（Anthropic 的 Prompt Caching、OpenAI 的 Cached Context），让这部分 Token 只计费一次或大幅打折。

**Anthropic Prompt Caching 实例**：

```python
# 将系统 Prompt 标记为可缓存
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    system=[
        {
            "type": "text",
            "text": SYSTEM_PROMPT,  # 大段固定文本
            "cache_control": {"type": "ephemeral"}  # 标记为缓存
        }
    ],
    messages=[...],
)
```

效果：系统 Prompt 部分的输入 Token 费用从 $3/1M 降低到 $0.30/1M（首次仍按原价，5 分钟内重复调用享受 90% 折扣）。对于一个 2000 Token 的系统 Prompt，日活 10000 用户的场景下每月可节省数百美元。

**适用条件**：

- 系统 Prompt 相同且较长（>1000 Token）。
- 同一用户的多次调用之间间隔不超过缓存 TTL（Anthropic 为 5 分钟）。
- 按用户/会话组织调用，而非随机打散——同一会话内的连续调用最容易命中缓存。

### 结果缓存

对于重复性查询，直接缓存 Agent 的完整回答：

- **精确匹配缓存**：相同查询返回缓存结果。适合 FAQ 类场景。
- **语义匹配缓存**：用 Embedding 计算查询相似度，相似度超阈值时返回缓存。适合用户用不同表述问同一问题的场景。
- **工具结果缓存**：缓存工具调用结果（如"查询 ORD-123456 的状态"），同一工具调用在短时间内返回缓存而非重新执行。

**缓存策略设计**：

```python
cache_config = {
    "exact_match_ttl": 3600,     # 精确匹配缓存 1 小时
    "semantic_match_threshold": 0.95,  # 语义匹配相似度阈值
    "semantic_match_ttl": 1800,  # 语义匹配缓存 30 分钟
    "tool_result_ttl": 300,      # 工具结果缓存 5 分钟（数据可能变化）
    "max_cache_size": 10000,     # 最大缓存条目数
}
```

关键考虑：**时效性 vs 成本**。库存查询的缓存 TTL 应短（数据实时变化），政策文档的缓存 TTL 可以长（内容不频繁更新）。

## 批处理优化

### Batch API

OpenAI 和 Anthropic 都提供 Batch API，允许批量提交请求，延迟返回结果（OpenAI 24 小时内，Anthropic 逐步缩短），价格折扣 50%。

**适用场景**：

- **离线评估**：批量跑评测数据集，不需要实时返回。
- **日志处理**：对历史对话做批量分析、提取、标注。
- **数据预处理**：批量生成 Embedding、批量摘要文档。

**不适合**：实时交互场景——用户等不了 24 小时。

### 并发请求优化

Agent 的多步推理中，有些步骤可以并行执行：

- **多路 RAG 检索**：同时检索知识库、数据库、文档仓库，合并结果。
- **多工具并行调用**：如果 Agent 决策需要调用 3 个不相互依赖的工具，可以并发调用而非串行。
- **多模型评分**：用多个模型对同一回答评分，取平均或加权。

**注意事项**：

- 并发调用增加瞬时 API 费用和限流风险。设置并发上限（如最多 5 个并发请求）。
- 合并并发结果需要额外的整合步骤，增加总 Token 消耗。评估总成本是否真的降低了。
- 部分模型 API 支持 `n` 参数一次生成多个候选回答，比并发调用更高效。

## API 成本控制实战

### 预算与限流机制

**用户级限流**：每个用户设置每日/每月 Token 预算上限。超出后降级到低成本模型或拒绝服务。

```python
# 用户预算配置示例
user_budget = {
    "daily_token_limit": 50000,       # 每日 50K Token
    "monthly_cost_limit": 10.0,       # 每月 $10
    "overflow_strategy": "downgrade", # 超限后降级模型
    "downgrade_model": "gpt-4o-mini"  # 降级到低成本模型
}
```

**全局限流**：设置服务的总 Token 消耗速率上限，防止突发流量导致成本失控。如每分钟最多消耗 100K Token。

### Token 消耗监控

实时监控 Token 消耗，及时发现异常：

- **单次交互成本追踪**：记录每次交互的输入/输出 Token 数和费用。
- **步骤级成本归因**：哪个步骤消耗了最多 Token？找出"成本热点"。
- **趋势告警**：成本日环比增长超 20% 时自动告警，可能与异常流量或模型配置变更有关。

### 成本/效果优化决策树

优化成本不是无脑降级模型，而是系统性决策：

1. **统计成本分布**：哪些步骤占了 80% 的成本？
2. **评估降级影响**：在热点步骤上试换低成本模型，用评估集测试效果变化。
3. **决策**：如果效果下降在可接受范围内（如准确率从 95% 降到 92%），降级；否则保留高价模型，考虑其他优化路径（缓存、Prompt 精简等）。
4. **持续监控**：降级后持续监控用户满意度，确保决策正确。

### Prompt 精简

冗长的 Prompt 是隐性成本杀手。常见浪费：

- **重复的系统设定**：每次调用都发送 2000 Token 的角色描述——用 Prompt Caching 或压缩描述。
- **过度示例**：10 个示例 vs 3 个精选示例，效果可能差不多但成本差 3 倍。
- **无用的上下文**：检索返回了 10 条文档但只有 3 条有用——优化检索质量，减少送入 LLM 的无效内容。

**精简原则**：每减少 1 个输入 Token，在日活 10000 的场景下每月节省约 $0.3（按 GPT-4o 输入价）。精简 500 Token 的系统 Prompt = 每月节省 $150。
---

## 本章小结

| 优化维度 | 策略 | 预期收益 |
|---------|------|---------|
| **模型分层** | 简单任务用轻量模型，复杂任务用强模型 | 成本降低 5-10 倍 |
| **Prompt 缓存** | 缓存系统提示和工具定义 | 输入费用降低 50-90% |
| **并发优化** | 批量调用、异步流水线 | 吞吐量提升 3-5 倍 |
| **部署架构** | 容器化 + 弹性伸缩 + 预热 | 延迟降低 50%+ |

**成本优化口诀**：能用 mini 不用 max，能缓存不重复，能批量不串行，能预热不等冷启动。

---

> 📖 **延伸阅读**
>
> 1. [OpenAI Pricing](https://openai.com/api/pricing/) —— 官方定价与折扣策略
> 2. [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) —— 缓存机制详解
> 3. [Kubernetes Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) —— 弹性伸缩配置
> 4. [vLLM Documentation](https://docs.vllm.ai/) —— 高性能 LLM 推理服务
