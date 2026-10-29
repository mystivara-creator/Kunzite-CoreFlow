export type SubsystemId =
  | 'cpu'
  | 'gpu'
  | 'audio_touch'
  | 'uclamp'
  | 'network_modem'
  | 'vm'
  | 'storage'
  | 'boot';

export type PresetId =
  | 'vfinal_22'
  | 'v22_exp'
  | 'v21'
  | 'v20'
  | 'stock'
  | 'custom';

export interface CoreFlowConfig {
  // Module Metadata
  moduleId: string;
  moduleName: string;
  moduleVersion: string;
  moduleVersionCode: number;
  moduleAuthor: string;
  moduleDescription: string;
  fixInstallerServiceSh: boolean;

  // 0. Boot Synchronization
  waitForBootCompleted: boolean;
  bootPollIntervalSec: number;
  postBootSleepSec: number;

  // 1. CPU WALT Governor & Scheduler
  upRateLimitUs: number;
  downRateLimitUs: number;
  hispeedLoad: number;
  policy0HispeedFreq: number;
  policy4HispeedFreq: number;
  schedSchedstats: 0 | 1;

  // 2. GPU Adreno 710 (kgsl-3d0)
  gpuForceClkOn: 0 | 1;
  gpuForceBusOn: 0 | 1;
  gpuForceRailOn: 0 | 1;
  adrenoppBoost: 0 | 1;
  gpuIdleTimerMs: number;

  // 3. HyperOS Audio HAL & Touch
  audioBufferingMs: number;
  audioPeriodSize: number;
  audioCpuset: '4-7' | '0-7' | '0-3';
  audioOnlyFast: boolean;
  audioOffloadBufferKb: number;
  touchSizeCalibration: 'geometric' | 'default';
  touchPressureScale: '0.001' | '0.005' | '0.01' | '1.0';

  // 4. Uclamp Cgroups (/dev/cpuctl)
  topAppLatencySensitive: 0 | 1;
  topAppUclampMin: number;
  touchLatencySensitive: 0 | 1;
  audioLatencySensitive: 0 | 1;

  // 5. Network & Modem Power
  tcpCongestionControl: 'bbr' | 'cubic' | 'westwood';
  wifiScanAlwaysEnabled: 0 | 1;
  bleScanAlwaysEnabled: 0 | 1;
  fiveGIconGroupMode: 0 | 1;
  tracedEnable: 0 | 1;

  // 6. Virtual Memory (/proc/sys/vm)
  dirtyBackgroundRatio: number;
  dirtyRatio: number;
  dirtyExpireCentisecs: number;
  dirtyWritebackCentisecs: number;
  pageCluster: number;
  swappiness: number;
  vfsCachePressure: number;
  watermarkBoostFactor: number;

  // 7. Multi-Queue Storage (sda-sdf)
  sdaScheduler: 'mq-deadline' | 'cpq' | 'kyber' | 'none';
  addRandom: 0 | 1;
  iostats: 0 | 1;
  rotational: 0 | 1;
  nrRequests: number;
  readAheadKb: number;
  rqAffinity: 0 | 1 | 2;
  ioschedLowLatency: 0 | 1;
  ioschedSliceIdle: number;
  ioschedFifoBatch: number;
}

export interface DiagnosticFinding {
  id: string;
  severity: 'nominal' | 'warning' | 'critical';
  subsystem: SubsystemId;
  title: string;
  detail: string;
  fixActionLabel?: string;
  applyFix?: (prev: CoreFlowConfig) => CoreFlowConfig;
}

export interface ParameterSpec<K extends keyof CoreFlowConfig = keyof CoreFlowConfig> {
  key: K;
  subsystem: SubsystemId;
  label: string;
  targetNode: string;
  unit?: string;
  controlType: 'number' | 'select' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: CoreFlowConfig[K] }[];
  rationale: string;
}

export interface VersionRelease {
  id: PresetId;
  versionTag: string;
  date: string;
  title: string;
  executionMethod: string;
  status: 'Recommended' | 'Experimental' | 'Legacy' | 'Baseline';
  summary: string;
  highlights: string[];
  knownIssues?: string[];
}
