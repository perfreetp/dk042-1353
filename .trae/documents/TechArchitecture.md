## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 应用"]
        A1["页面组件<br/>故障热力/案例质量/复盘清单"]
        A2["通用组件<br/>筛选器/图表/表格/卡片"]
        A3["状态管理<br/>Zustand Store"]
        A4["路由<br/>React Router"]
    end
    
    subgraph "服务层"
        B["Express API Server"]
        B1["故障数据接口"]
        B2["案例质量接口"]
        B3["复盘任务接口"]
        B4["Mock数据生成器"]
    end
    
    subgraph "数据层"
        C["JSON Mock 数据"]
        C1["故障记录数据"]
        C2["知识条目数据"]
        C3["案例质量数据"]
        C4["复盘任务数据"]
    end
    
    A --> A1
    A --> A2
    A --> A3
    A --> A4
    A1 --> A2
    A3 --> B
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B1 --> C1
    B2 --> C2
    B2 --> C3
    B3 --> C4
```

## 2. 技术说明

- **前端**：React@18 + TypeScript@5 + Vite@5 + TailwindCSS@3 + Zustand@4 + React Router@6 + Lucide React@0.400
- **图表库**：Recharts@2（用于趋势图、柱状图、热力图等）
- **初始化工具**：vite-init react-express-ts 模板
- **后端**：Express@4 + TypeScript
- **数据层**：本地 JSON Mock 数据，后端提供 RESTful API 接口
- **状态管理**：Zustand 管理全局筛选条件和任务状态

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 重定向到 /fault-heatmap |
| /fault-heatmap | 故障热力页面 - 故障统计与分布分析 |
| /case-quality | 案例质量页面 - 知识条目与案例质量检查 |
| /review-checklist | 复盘清单页面 - 改进任务管理与分配 |

## 4. API 定义

### 4.1 类型定义

```typescript
interface FaultRecord {
  id: string;
  faultCode: string;
  faultDescription: string;
  aircraftType: string;
  base: string;
  ataChapter: string;
  ataChapterName: string;
  season: string;
  occurrenceDate: string;
  aircraftReg: string;
  downtimeHours: number;
  actions: string[];
  success: boolean;
}

interface KnowledgeEntry {
  id: string;
  title: string;
  faultCode: string;
  referenceCount: number;
  successRate: number;
  lastUpdated: string;
  hasManualReference: boolean;
  hasReleaseConclusion: boolean;
  hasFollowUp: boolean;
}

interface ReviewTask {
  id: string;
  type: 'repeat_fault' | 'timeout_troubleshoot';
  faultCode: string;
  faultDescription: string;
  occurrenceCount: number;
  avgDowntimeHours: number;
  thresholdHours?: number;
  assignee: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  rootCauseAnalysis: string | null;
  troubleshootingTipRevision: string | null;
  trainingReminder: boolean;
  createdAt: string;
  dueDate: string | null;
}

interface FilterState {
  aircraftType: string | null;
  base: string | null;
  ataChapter: string | null;
  season: string | null;
  faultCode: string | null;
  dateRange: { start: string; end: string };
}
```

### 4.2 接口列表

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | /api/faults | 获取故障记录列表（支持筛选参数） |
| GET | /api/faults/statistics | 获取故障统计概览数据 |
| GET | /api/faults/heatmap | 获取ATA章节热力图数据 |
| GET | /api/faults/top | 获取TOP故障列表 |
| GET | /api/faults/repeat-aircraft | 获取重复故障飞机列表 |
| GET | /api/faults/common-actions | 获取常用处理动作统计 |
| GET | /api/knowledge/entries | 获取知识条目列表 |
| GET | /api/knowledge/low-success-rate | 获取低成功率知识条目 |
| GET | /api/knowledge/quality-issues | 获取案例质量问题列表 |
| GET | /api/review/tasks | 获取复盘任务列表 |
| POST | /api/review/tasks/:id/assign | 分配任务给工程师 |
| PUT | /api/review/tasks/:id | 更新任务内容（原因分析/排故提示/培训提醒） |
| GET | /api/options/aircraft-types | 获取机型选项 |
| GET | /api/options/bases | 获取基地选项 |
| GET | /api/options/ata-chapters | 获取ATA章节选项 |

## 5. 服务端架构

```mermaid
graph LR
    A["路由层 Routes"] --> B["控制器层 Controllers"]
    B --> C["服务层 Services"]
    C --> D["数据访问层 Data Access"]
    D --> E["JSON数据源 Mock Data"]
```

- **Routes**：定义API路由和请求参数解析
- **Controllers**：处理HTTP请求，参数校验，响应格式化
- **Services**：业务逻辑处理，数据聚合计算
- **Data Access**：统一的JSON数据读写接口

## 6. 数据模型

### 6.1 实体关系

```mermaid
erDiagram
    FAULT_RECORD {
        string id PK
        string faultCode
        string faultDescription
        string aircraftType
        string base
        string ataChapter
        string season
        string occurrenceDate
        string aircraftReg
        number downtimeHours
        string[] actions
        boolean success
    }
    
    KNOWLEDGE_ENTRY {
        string id PK
        string title
        string faultCode FK
        number referenceCount
        number successRate
        string lastUpdated
        boolean hasManualReference
        boolean hasReleaseConclusion
        boolean hasFollowUp
    }
    
    REVIEW_TASK {
        string id PK
        string type
        string faultCode FK
        string faultDescription
        number occurrenceCount
        number avgDowntimeHours
        number thresholdHours
        string assignee
        string status
        string rootCauseAnalysis
        string troubleshootingTipRevision
        boolean trainingReminder
        string createdAt
        string dueDate
    }
    
    FAULT_RECORD ||--o{ KNOWLEDGE_ENTRY : "references"
    FAULT_RECORD ||--o{ REVIEW_TASK : "triggers"
```

### 6.2 数据初始化

使用 Mock 数据生成器创建以下测试数据：
- 200+ 条故障记录，覆盖5种机型、8个基地、20个ATA章节、4个季节
- 50+ 条知识条目，包含不同引用次数和成功率
- 30+ 个复盘任务，涵盖待处理、处理中、已完成三种状态
