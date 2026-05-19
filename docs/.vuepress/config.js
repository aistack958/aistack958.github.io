import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { searchPlugin } from '@vuepress/plugin-search'
import { copyCodePlugin } from '@vuepress/plugin-copy-code'
import { mediumZoomPlugin } from '@vuepress/plugin-medium-zoom'
import { backToTopPlugin } from '@vuepress/plugin-back-to-top'
import { sitemapPlugin } from '@vuepress/plugin-sitemap'
import { baiduAnalyticsPlugin } from '@vuepress/plugin-baidu-analytics'

export default defineUserConfig({
  lang: 'zh-CN',

  base: '/',

  title: 'AI小栈',
  description: 'AI Agent 工程师转型实战指南',

  theme: defaultTheme({
    logo: 'https://vuejs.press/images/hero.png',
    lastUpdated: false,
    contributors: false,

    navbar: [
      { text: '首页', link: '/' },
      {
        text: 'LLM 核心',
        link: '/llm-foundation/',
        children: [
          { text: '模块概览', link: '/llm-foundation/' },
          { text: 'Transformer 与注意力机制', link: '/llm-foundation/transformer' },
          { text: '主流大模型对比', link: '/llm-foundation/model-comparison' },
          { text: 'Prompt Engineering', link: '/llm-foundation/prompt-engineering' },
          { text: 'Token 与成本核算', link: '/llm-foundation/token-and-context' },
          { text: 'Function Calling', link: '/llm-foundation/function-calling' },
        ],
      },
      {
        text: 'Agent 架构',
        link: '/agent-architecture/',
        children: [
          { text: '模块概览', link: '/agent-architecture/' },
          { text: 'Agent 范式', link: '/agent-architecture/react-pattern' },
          { text: '多 Agent 协作', link: '/agent-architecture/multi-agent' },
          { text: '记忆系统', link: '/agent-architecture/memory-system' },
          { text: '规划与推理', link: '/agent-architecture/planning-reasoning' },
          { text: '安全与可控性', link: '/agent-architecture/safety-control' },
        ],
      },
      {
        text: '开发框架',
        link: '/agent-frameworks/',
        children: [
          { text: '模块概览', link: '/agent-frameworks/' },
          { text: 'LangChain / LangGraph', link: '/agent-frameworks/langchain-langgraph' },
          { text: 'Claude Agent SDK', link: '/agent-frameworks/claude-agent-sdk' },
          { text: 'OpenAI Agents SDK', link: '/agent-frameworks/openai-agents-sdk' },
          { text: 'AutoGen / CrewAI', link: '/agent-frameworks/autogen-crewai' },
          { text: 'Dify / Coze', link: '/agent-frameworks/dify-coze' },
          { text: 'MCP 协议', link: '/agent-frameworks/mcp-protocol' },
        ],
      },
      {
        text: '工程实践',
        link: '/agent-engineering/',
        children: [
          { text: '模块概览', link: '/agent-engineering/' },
          { text: 'RAG 工程化', link: '/agent-engineering/rag-engineering' },
          { text: '工具设计与封装', link: '/agent-engineering/tool-design' },
          { text: '流式输出与 UX', link: '/agent-engineering/streaming-ux' },
          { text: '可观测性', link: '/agent-engineering/observability' },
          { text: '部署与成本优化', link: '/agent-engineering/deployment-optimization' },
          { text: '测试与评估', link: '/agent-engineering/testing-evaluation' },
        ],
      },
      {
        text: '实战项目',
        link: '/agent-projects/',
        children: [
          { text: '模块概览', link: '/agent-projects/' },
          { text: '智能编程助手', link: '/agent-projects/coding-assistant' },
          { text: '知识库问答 Agent', link: '/agent-projects/knowledge-qa-agent' },
          { text: '数据分析 Agent', link: '/agent-projects/data-analysis-agent' },
          { text: '多模态 Agent', link: '/agent-projects/multimodal-agent' },
          { text: '运维 Agent', link: '/agent-projects/ops-agent' },
          { text: '从0到1构建', link: '/agent-projects/build-from-zero' },
        ],
      },
      {
        text: '行业前沿',
        link: '/industry-frontier/',
        children: [
          { text: '模块概览', link: '/industry-frontier/' },
          { text: '论文解读', link: '/industry-frontier/paper-review' },
          { text: '开源项目追踪', link: '/industry-frontier/open-source-tracking' },
          { text: 'MCP 生态', link: '/industry-frontier/mcp-ecosystem' },
          { text: 'Agent 商业化', link: '/industry-frontier/commercialization' },
          { text: '职业路径', link: '/industry-frontier/career-path' },
        ],
      },
      {
        text: '面试经验',
        link: '/interview-experience/',
        children: [
          { text: '模块概览', link: '/interview-experience/' },
          { text: '技术面试实战', link: '/interview-experience/technical-interview' },
          { text: 'Agent 面试题解析', link: '/interview-experience/agent-questions' },
          { text: '项目经验包装', link: '/interview-experience/project-presentation' },
          { text: '流程与心态准备', link: '/interview-experience/process-mindset' },
        ],
      },
    ],

    sidebar: {
      '/llm-foundation/': [
        {
          text: 'LLM 核心能力',
          children: [
            { text: '模块概览', link: '/llm-foundation/' },
            '/llm-foundation/transformer',
            '/llm-foundation/model-comparison',
            '/llm-foundation/prompt-engineering',
            '/llm-foundation/token-and-context',
            '/llm-foundation/function-calling',
          ],
        },
      ],
      '/agent-architecture/': [
        {
          text: 'Agent 架构与设计',
          children: [
            { text: '模块概览', link: '/agent-architecture/' },
            '/agent-architecture/react-pattern',
            '/agent-architecture/multi-agent',
            '/agent-architecture/memory-system',
            '/agent-architecture/planning-reasoning',
            '/agent-architecture/safety-control',
          ],
        },
      ],
      '/agent-frameworks/': [
        {
          text: 'Agent 开发框架',
          children: [
            { text: '模块概览', link: '/agent-frameworks/' },
            '/agent-frameworks/langchain-langgraph',
            '/agent-frameworks/claude-agent-sdk',
            '/agent-frameworks/openai-agents-sdk',
            '/agent-frameworks/autogen-crewai',
            '/agent-frameworks/dify-coze',
            '/agent-frameworks/mcp-protocol',
            '/agent-frameworks/skill-system',
          ],
        },
      ],
      '/agent-engineering/': [
        {
          text: 'Agent 工程实践',
          children: [
            { text: '模块概览', link: '/agent-engineering/' },
            '/agent-engineering/rag-engineering',
            '/agent-engineering/tool-design',
            '/agent-engineering/streaming-ux',
            '/agent-engineering/observability',
            '/agent-engineering/deployment-optimization',
            '/agent-engineering/testing-evaluation',
          ],
        },
      ],
      '/agent-projects/': [
        {
          text: 'Agent 实战项目',
          children: [
            { text: '模块概览', link: '/agent-projects/' },
            '/agent-projects/coding-assistant',
            '/agent-projects/knowledge-qa-agent',
            '/agent-projects/data-analysis-agent',
            '/agent-projects/multimodal-agent',
            '/agent-projects/ops-agent',
            '/agent-projects/build-from-zero',
          ],
        },
      ],
      '/industry-frontier/': [
        {
          text: '行业前沿',
          children: [
            { text: '模块概览', link: '/industry-frontier/' },
            '/industry-frontier/paper-review',
            '/industry-frontier/open-source-tracking',
            '/industry-frontier/mcp-ecosystem',
            '/industry-frontier/commercialization',
            '/industry-frontier/career-path',
          ],
        },
      ],
      '/interview-experience/': [
        {
          text: '面试经验分享',
          children: [
            { text: '模块概览', link: '/interview-experience/' },
            '/interview-experience/technical-interview',
            '/interview-experience/agent-questions',
            '/interview-experience/project-presentation',
            '/interview-experience/process-mindset',
          ],
        },
      ],
    },
  }),

  bundler: viteBundler(),

  plugins: [
    searchPlugin({
      locales: {
        '/': {
          placeholder: '搜索',
        },
      },
    }),
    copyCodePlugin(),
    mediumZoomPlugin(),
    backToTopPlugin(),
    sitemapPlugin({
      hostname: 'https://aistack958.github.io',
    }),
    // 百度统计插件
    baiduAnalyticsPlugin({
      id: 'abaffaf4c68d721290c76e241e483a72',
    }),
  ],
})