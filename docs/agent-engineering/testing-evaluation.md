---
title: 测试与评估框架
---

# 测试与评估框架

传统软件测试验证"给定输入，输出是否符合预期"。但 Agent 的输出依赖 LLM 的推理路径，同样的输入可能产生不同的正确回答——"退款政策是什么"可以有多种表述方式都是正确的。这使得 Agent 的测试与评估需要全新的方法论。本章讲解 Agent 单元测试方法、效果评估基准构建、回归测试策略以及自动化评测流水线搭建。

## Agent 单元测试方法

### 测试什么？

Agent 的执行链路包含多个环节，每个环节都可以独立测试：

- **意图解析**：给定用户输入，Agent 是否正确识别了意图和关键实体？
- **工具选择**：给定意图和上下文，Agent 是否选择了正确的工具和参数？
- **工具执行**：给定参数，工具是否返回了正确的结果？
- **回答生成**：给定上下文和工具结果，Agent 是否生成了合理的最终回答？

### 意图解析测试

意图解析是最容易自动化的环节——它的输出是结构化的（意图类别+实体），可以精确比对：

```python
test_cases = [
    {"input": "我的订单 ORD-123456 到哪了？", "expected_intent": "query_logistics", "expected_entities": {"order_id": "ORD-123456"}},
    {"input": "我想退掉昨天买的耳机", "expected_intent": "request_refund", "expected_entities": {"product": "耳机", "time": "昨天"}},
    {"input": "帮我查一下退款到账了吗", "expected_intent": "query_refund_status", "expected_entities": {}},
]

def test_intent_parsing():
    for case in test_cases:
        result = parse_intent(case["input"])
        assert result.intent == case["expected_intent"]
        # 实体匹配允许部分缺失，但核心实体必须命中
        for key, value in case["expected_entities"].items():
            assert key in result.entities
            # 值匹配允许语义等价（"昨天" ≈ "2024-03-18"）
```

**关键设计**：测试输入应覆盖典型场景 + 边界场景 + 纠错场景。边界场景包括：多意图混合（"退款并且换个新的"）、模糊表达（"那个东西"）、否定意图（"我不想退货"）。

### 工具选择测试

工具选择测试验证 Agent 的决策逻辑——给定意图，它是否选择了正确的工具组合和参数？

```python
test_cases = [
    {
        "intent": {"type": "query_logistics", "entities": {"order_id": "ORD-123456"}},
        "expected_tools": [{"name": "query_logistics", "args": {"order_id": "ORD-123456"}}],
        "description": "简单物流查询，应直接调用工具"
    },
    {
        "intent": {"type": "compare_products", "entities": {"product_a": "iPhone 15", "product_b": "Pixel 8"}},
        "expected_tools": [
            {"name": "search_product", "args": {"name": "iPhone 15"}},
            {"name": "search_product", "args": {"name": "Pixel 8"}}
        ],
        "description": "产品对比，应分别查询两个产品"
    },
]

def test_tool_selection():
    for case in test_cases:
        tools = select_tools(case["intent"])
        for expected_tool in case["expected_tools"]:
            assert any(t.name == expected_tool["name"] for t in tools)
```

### Mock vs 真实调用

测试中工具执行有两种模式：

- **Mock 模式**：工具返回预设的固定结果，测试聚焦在 Agent 的决策逻辑。速度快、可重复、不受外部服务影响。
- **真实调用模式**：工具真实调用后端 API，测试覆盖完整链路。但外部 API 可能不稳定、数据可能变化，测试结果不可完全重复。

**推荐策略**：日常测试用 Mock，周期性（每日/每周）用真实调用做集成测试。

## 效果评估基准构建

### 评估数据集的结构

一个完整的评估数据集包含：

```json
{
    "id": "eval-001",
    "category": "order_query",
    "input": "我的订单 ORD-123456 到哪了？",
    "reference_answer": "您的订单 ORD-123456 目前在上海转运中心，预计明天送达。",
    "required_facts": ["上海转运中心", "预计明天送达", "ORD-123456"],
    "required_tools": ["query_logistics"],
    "difficulty": "simple",
    "evaluation_criteria": {
        "factuality": "必须包含正确的物流位置和预计送达时间",
        "completeness": "必须同时包含位置和预计时间",
        "format": "自然语言回答，不需要表格"
    }
}
```

**构建原则**：

1. **覆盖度**：数据集应覆盖 Agent 支持的所有意图类别，每类至少 10-20 条。
2. **难度分层**：简单（单步工具调用）、中等（多步推理）、困难（需要综合判断或处理冲突信息），比例约 6:3:1。
3. **明确评估标准**：每条数据标注 `required_facts`——回答必须包含哪些关键事实，这是自动评估的基础。

### 数据集来源

- **人工构建**：领域专家编写查询和标准答案，质量最高但成本大。建议从客服日志中提取高频问题，人工改写为评估条目。
- **用户日志抽取**：从真实用户对话中抽取，标注标准答案。覆盖真实场景但标注成本高。
- **LLM 生成**：用 LLM 根据知识库内容生成查询和参考答案，快速生成大量数据但需要人工审核准确性。

### 自动评估方法

**LLM-as-Judge**：用一个 LLM 评判另一个 LLM 的回答质量。这是目前最实用的自动化评估方法。

```python
judge_prompt = """
你是一个评估专家。请评估以下 Agent 回答的质量。

用户问题：{query}
参考答案：{reference_answer}
Agent 回答：{agent_answer}

请从以下维度评分（1-5分）：
1. 准确性：Agent 回答中的事实是否正确？
2. 完整性：是否覆盖了所有必要信息？
3. 相关性：回答是否与问题直接相关？
4. 清晰度：表达是否清晰易懂？

请输出JSON格式：{"accuracy": X, "completeness": X, "relevance": X, "clarity": X, "overall": X}
"""
```

**LLM-as-Judge 的注意事项**：

- **Judge 模型要比被评估模型更强**：用 GPT-4o 评估 GPT-4o-mini 的输出是合理的，但用 GPT-4o-mini 评估 GPT-4o 的输出可能不可靠。
- **位置偏差**：Judge 可能偏向先展示的回答。解决办法：随机打乱 Agent 回答和参考答案的展示顺序。
- **自我偏好**：同一模型家族的 Judge 可能偏向同族模型的输出。用跨模型家族的 Judge（如用 Claude 评估 GPT 的输出）可缓解此问题。

**事实点匹配**：比 LLM-as-Judge 更精确的方法——将参考答案拆解为"事实点"，检查 Agent 回答是否覆盖了每个事实点。

```python
required_facts = ["上海转运中心", "预计明天送达", "ORD-123456"]

def evaluate_fact_coverage(agent_answer, required_facts):
    covered = 0
    for fact in required_facts:
        if fact in agent_answer or semantically_equivalent(fact, agent_answer):
            covered += 1
    return covered / len(required_facts)  # 返回覆盖率 0-1
```

## 回归测试策略

### 为什么 Agent 需要回归测试？

每次模型更新、Prompt 调整、工具修改都可能改变 Agent 的行为。没有回归测试，你可能不知道"改了 Prompt 让退款场景变好了，但物流查询场景变坏了"。

### 回归测试的执行时机

| 变更类型 | 回归范围 |
|----------|----------|
| 模型版本更新 | 全量评估数据集 |
| Prompt 调整 | 受影响意图类别 + 全量抽样 |
| 工具接口变更 | 依赖该工具的测试条目 + 全量抽样 |
| 知识库更新 | 检索相关测试条目 |

### A/B 对比评估

变更前后不应只看绝对分数，更要做 **A/B 对比**：

```python
def ab_evaluate(old_agent, new_agent, eval_dataset):
    results = []
    for case in eval_dataset:
        old_result = old_agent.run(case.input)
        new_result = new_agent.run(case.input)
        old_score = llm_judge(old_result, case)
        new_score = llm_judge(new_result, case)
        results.append({
            "case_id": case.id,
            "old_score": old_score,
            "new_score": new_score,
            "delta": new_score - old_score
        })
    # 分析：哪些场景变好了、变坏了、没变化
    improved = sum(1 for r in results if r["delta"] > 0)
    degraded = sum(1 for r in results if r["delta"] < 0)
    return improved, degraded
```

关键：如果退化场景涉及核心功能（如退款处理），即使总体平均分数提升了，也不应上线新版本。

## 自动化评测流水线

### 流水线架构

```
代码/Prompt变更 → 自动触发 → 执行评估数据集 → 生成评分报告 → 判断是否通过 → 自动部署/阻断部署
```

### CI/CD 集成

将 Agent 评测集成到 CI 流水线中：

```yaml
# GitHub Actions 示例
name: Agent Evaluation
on:
  push:
    paths:
      - 'agent/prompts/**'
      - 'agent/tools/**'

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Intent Parsing Tests
        run: python -m pytest tests/intent_parsing/
      - name: Run Tool Selection Tests
        run: python -m pytest tests/tool_selection/
      - name: Run Full Evaluation Dataset
        run: python scripts/run_eval.py --dataset full --output results.json
      - name: Check Quality Gate
        run: python scripts/check_gate.py --min-overall 4.0 --min-accuracy 4.2 --max-regression-rate 0.05
```

**质量门禁（Quality Gate）** 设置关键指标的阈值：

- 整体评分不低于 4.0（5 分制）
- 准确性不低于 4.2
- 退化率不超过 5%（即最多 5% 的测试条目比旧版本差）

如果质量门禁未通过，流水线阻断部署并生成详细报告：哪些场景退化了、退化幅度多大、可能的根因分析。

### 评测报告的设计

评测报告应包含：

1. **总体评分**：各维度的平均分数和分布图。
2. **场景级评分**：按意图类别分组的评分对比（变更前 vs 变更后）。
3. **退化分析**：列出所有退化的测试条目，展示变更前后的回答对比，便于人工判断退化是否严重。
4. **成本分析**：变更后的 Token 消耗变化、预估月度费用变化。
5. **趋势图**：过去 N 次评测的评分趋势，判断 Agent 质量是在稳步提升还是波动。

### 持续优化循环

评测不是一次性工作，而是持续循环：

1. **定期评测**：每日跑快速评测（50 条），每周跑全量评测（500 条）。
2. **问题定位**：评测发现退化 → Trace 分析 → 定位根因（检索问题？Prompt 问题？工具问题？）
3. **修复与验证**：修复问题 → 回归测试验证 → 确认无新退化 → 上线。
4. **数据集扩充**：从用户反馈中提取新的评估条目，持续扩充评测数据集的覆盖度。
---

## 本章小结

| 测试类型 | 关注点 | 方法 |
|---------|--------|------|
| **单元测试** | 工具函数、解析逻辑 | 传统自动化测试 |
| **效果评估** | 回答质量、任务完成率 | 自动化指标 + 人工评估 |
| **回归测试** | 修改是否破坏已有能力 | 固定测试集 + 基线对比 |
| **对抗测试** | 边界情况、恶意输入 | 专门构造的异常用例 |

**评估核心原则**：
- 不要只测"平均表现"，要测"最差表现"
- 用 LLM-as-Judge 时必须有标准答案作为参照
- 每次 Prompt 修改都要跑回归测试
- 建立持续评估流水线，而非一次性评估

---

> 📖 **延伸阅读**
>
> 1. [Evaluating LLM-based Systems](https://www.oreilly.com/radar/what-we-learned-from-a-year-of-building-with-llms/) —— O'Reilly LLM 工程经验总结
> 2. [RAGAS](https://docs.ragas.io/) —— RAG 评估框架
> 3. [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html) —— 实验追踪与模型管理
> 4. [PromptLayer](https://promptlayer.com/) —— Prompt 版本管理与 A/B 测试
