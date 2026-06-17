import type { FaultRecord, KnowledgeEntry, ReviewTask, OptionItem } from '../../shared/types';

const aircraftTypes: OptionItem[] = [
  { value: 'B737', label: '波音 737' },
  { value: 'B787', label: '波音 787' },
  { value: 'A320', label: '空客 A320' },
  { value: 'A330', label: '空客 A330' },
  { value: 'A350', label: '空客 A350' },
];

const bases: OptionItem[] = [
  { value: 'PEK', label: '北京首都' },
  { value: 'PVG', label: '上海浦东' },
  { value: 'CAN', label: '广州白云' },
  { value: 'SZX', label: '深圳宝安' },
  { value: 'CTU', label: '成都双流' },
  { value: 'XIY', label: '西安咸阳' },
  { value: 'SHA', label: '上海虹桥' },
  { value: 'HGH', label: '杭州萧山' },
];

const ataChapters: OptionItem[] = [
  { value: 'ATA21', label: 'ATA21 空调' },
  { value: 'ATA24', label: 'ATA24 电源' },
  { value: 'ATA26', label: 'ATA26 防火' },
  { value: 'ATA27', label: 'ATA27 飞行操纵' },
  { value: 'ATA28', label: 'ATA28 燃油' },
  { value: 'ATA29', label: 'ATA29 液压' },
  { value: 'ATA30', label: 'ATA30 防冰防雨' },
  { value: 'ATA31', label: 'ATA31 指示/记录系统' },
  { value: 'ATA32', label: 'ATA32 起落架' },
  { value: 'ATA33', label: 'ATA33 灯光' },
  { value: 'ATA34', label: 'ATA34 导航' },
  { value: 'ATA35', label: 'ATA35 氧气' },
  { value: 'ATA36', label: 'ATA36 气源' },
  { value: 'ATA38', label: 'ATA38 排水/污水' },
  { value: 'ATA49', label: 'ATA49 APU' },
  { value: 'ATA52', label: 'ATA52 门' },
  { value: 'ATA53', label: 'ATA53 机身' },
  { value: 'ATA71', label: 'ATA71 动力装置' },
  { value: 'ATA73', label: 'ATA73 发动机' },
  { value: 'ATA77', label: 'ATA77 发动机指示' },
];

const seasons = ['春季', '夏季', '秋季', '冬季'];

const categories = ['经验案例', '故障分析', '快速排故', '疑难案例', '预防措施'];

const faultCodes = [
  { code: 'F2101', desc: '空调组件过热警告', ata: 'ATA21', actions: ['更换温度传感器', '重置ACSC', '检查ACM'] },
  { code: 'F2102', desc: '座舱压力异常', ata: 'ATA21', actions: ['检查 outflow valve', '更换CPC', '清洁压力传感器'] },
  { code: 'F2401', desc: '发电机故障', ata: 'ATA24', actions: ['复位GCU', '检查接触器', '更换发电机'] },
  { code: 'F2402', desc: 'TRU失效', ata: 'ATA24', actions: ['复位TRU', '检查输出电压', '更换TRU'] },
  { code: 'F2701', desc: '副翼位置不一致', ata: 'ATA27', actions: ['校准传感器', '检查钢索张力', '更换ACE'] },
  { code: 'F2801', desc: '燃油泵低压', ata: 'ATA28', actions: ['更换燃油泵', '检查供油管路', '清洁油滤'] },
  { code: 'F2901', desc: '液压系统低压', ata: 'ATA29', actions: ['检查液压油位', '更换液压泵', '检查泄漏点'] },
  { code: 'F3201', desc: '起落架位置指示异常', ata: 'ATA32', actions: ['检查接近传感器', '更换LGCIU', '校准起落架'] },
  { code: 'F3202', desc: '刹车温度过高', ata: 'ATA32', actions: ['等待冷却', '更换刹车组件', '检查刹车磨损'] },
  { code: 'F3401', desc: 'ADIRU故障', ata: 'ATA34', actions: ['重置ADIRU', '检查输入信号', '更换ADM'] },
  { code: 'F4901', desc: 'APU启动失败', ata: 'ATA49', actions: ['检查电瓶电压', '清洁点火塞', '更换ECU'] },
  { code: 'F7301', desc: '发动机参数超限', ata: 'ATA73', actions: ['读取故障代码', '检查燃油流量', '更换传感器'] },
  { code: 'F3101', desc: 'EICAS显示异常', ata: 'ATA31', actions: ['重置DMC', '检查显示单位', '更换GIA'] },
  { code: 'F3601', desc: '引气压力低', ata: 'ATA36', actions: ['检查PRV', '清洁热交换器', '更换压力传感器'] },
  { code: 'F3301', desc: '航行灯不亮', ata: 'ATA33', actions: ['更换灯泡', '检查继电器', '测量线路'] },
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  return d.toISOString().split('T')[0];
}

export function generateFaultRecords(count = 250): FaultRecord[] {
  const records: FaultRecord[] = [];
  for (let i = 0; i < count; i++) {
    const fault = randomChoice(faultCodes);
    const ataChapter = ataChapters.find(a => a.value === fault.ata) || ataChapters[0];
    records.push({
      id: `F${String(i + 1).padStart(5, '0')}`,
      faultCode: fault.code,
      faultDescription: fault.desc,
      aircraftType: randomChoice(aircraftTypes).value,
      base: randomChoice(bases).value,
      ataChapter: ataChapter.value,
      ataChapterName: ataChapter.label,
      season: randomChoice(seasons),
      occurrenceDate: generateDate(90),
      aircraftReg: `B-${randomInt(1000, 9999)}`,
      downtimeHours: randomFloat(0.5, 12),
      actions: fault.actions.slice(0, randomInt(1, fault.actions.length)),
      success: Math.random() > 0.15,
    });
  }
  return records;
}

export function generateKnowledgeEntries(count = 55): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  for (let i = 0; i < count; i++) {
    const fault = randomChoice(faultCodes);
    entries.push({
      id: `K${String(i + 1).padStart(4, '0')}`,
      title: `${fault.desc} - 排故经验分享`,
      faultCode: fault.code,
      ataChapter: fault.ata,
      category: randomChoice(categories),
      referenceCount: randomInt(5, 120),
      successRate: randomFloat(35, 98),
      lastUpdated: generateDate(30),
      hasManualReference: Math.random() > 0.25,
      hasReleaseConclusion: Math.random() > 0.2,
      hasFollowUp: Math.random() > 0.3,
    });
  }
  return entries;
}

export function generateReviewTasks(count = 32): ReviewTask[] {
  const engineers = ['wang_ming', 'li_wei', 'zhang_hao', 'chen_jun', 'liu_qiang', 'zhou_le', null];
  const statuses: Array<'pending' | 'in_progress' | 'completed'> = ['pending', 'in_progress', 'completed'];
  const tasks: ReviewTask[] = [];

  function generateDueDate(status: string): string {
    const d = new Date();
    if (status === 'completed') d.setDate(d.getDate() - randomInt(1, 8));
    else if (status === 'in_progress') d.setDate(d.getDate() + randomInt(1, 5));
    else d.setDate(d.getDate() + randomInt(3, 15));
    return d.toISOString().split('T')[0];
  }

  function generateCompletedAt(): string | null {
    const d = new Date();
    d.setDate(d.getDate() - randomInt(0, 7));
    return d.toISOString().split('T')[0];
  }

  for (let i = 0; i < count; i++) {
    const fault = randomChoice(faultCodes);
    const isRepeat = i % 2 === 0;
    const status = randomChoice(statuses);
    const assignee = status === 'pending' ? null : randomChoice(engineers);
    const isCompleted = status === 'completed';
    const trainingSent = isCompleted && Math.random() > 0.6;
    tasks.push({
      id: `R${String(i + 1).padStart(4, '0')}`,
      type: isRepeat ? 'repeat' : 'timeout',
      faultCode: fault.code,
      title: fault.desc,
      ataChapter: fault.ata,
      occurrenceCount: isRepeat ? randomInt(5, 18) : randomInt(2, 8),
      avgDowntime: randomFloat(isRepeat ? 3 : 5, isRepeat ? 8 : 14),
      thresholdHours: isRepeat ? undefined : 4,
      assignee,
      status,
      rootCause: isCompleted ? '经排查，主要原因为传感器老化导致信号漂移，已更换新型号传感器并完成校准。' :
                  status === 'in_progress' ? '正在进行深入分析...' : null,
      tipRevision: isCompleted ? '已更新排故提示：增加传感器阻值测量步骤，建议每500FH预防性更换。' : null,
      trainingReminder: isCompleted ? {
        content: trainingSent ? '针对机电维修班组组织专项培训，重点讲解该传感器阻值测量与提前识别方法。' : '',
        sent: trainingSent,
      } : { content: '', sent: false },
      createdAt: generateDate(14),
      dueDate: generateDueDate(status),
      completedAt: isCompleted ? generateCompletedAt() : null,
      source: 'manual',
    });
  }
  return tasks;
}

export const optionData = {
  aircraftTypes,
  bases,
  ataChapters,
  seasons: seasons.map(s => ({ value: s, label: s })),
  faultCodes: faultCodes.map(f => ({ value: f.code, label: `${f.code} - ${f.desc}` })),
  engineers: [
    { value: 'wang_ming', label: '王明（机电）' },
    { value: 'li_wei', label: '李伟（结构）' },
    { value: 'zhang_hao', label: '张浩（电子）' },
    { value: 'chen_jun', label: '陈军（动力）' },
    { value: 'liu_qiang', label: '刘强（系统）' },
    { value: 'zhou_le', label: '周乐（机上娱乐）' },
  ],
};

export const mockFaultRecords = generateFaultRecords();
export const mockKnowledgeEntries = generateKnowledgeEntries();
export const mockReviewTasks = generateReviewTasks();
