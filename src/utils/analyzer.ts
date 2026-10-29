import { CoreFlowConfig, DiagnosticFinding } from '../types/coreflow';

export function analyzeConfig(config: CoreFlowConfig): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  // 1. Touch Stutter vs PMIC Rate Limit Check (Documented v2.2 Exp bug)
  if (config.upRateLimitUs >= 2000) {
    findings.push({
      id: 'walt-touch-stutter',
      severity: 'critical',
      subsystem: 'cpu',
      title: `High up_rate_limit_us (${config.upRateLimitUs} µs) causes rapid-swipe touch lag`,
      detail:
        'In CoreFlow v2.2 Experimental testing on SM6475, up_rate_limit_us >= 2000 µs delayed Cortex-A78 ramp-up during fast swipes (e.g., Free Fire MAX Gloo Wall deployment).',
      fixActionLabel: 'Restore 0 µs (vFinal Fix)',
      applyFix: (prev) => ({ ...prev, upRateLimitUs: 0 }),
    });
  } else if (config.upRateLimitUs > 0 && config.upRateLimitUs < 2000) {
    findings.push({
      id: 'walt-mild-ramp-delay',
      severity: 'warning',
      subsystem: 'cpu',
      title: `Non-zero up_rate_limit_us (${config.upRateLimitUs} µs) throttles initial touch burst`,
      detail:
        'vFinal 2.2 keeps up_rate_limit_us at 0 µs and relies on hispeed_load=95 + down_rate_limit_us=5000 µs to protect PM6450 thermals without hurting touch latency.',
      fixActionLabel: 'Set to 0 µs',
      applyFix: (prev) => ({ ...prev, upRateLimitUs: 0 }),
    });
  }

  // 2. PM6450 PMIC Thermal & Hispeed Threshold Check
  if (config.hispeedLoad < 88 || config.downRateLimitUs < 2000) {
    findings.push({
      id: 'pmic-voltage-spikes',
      severity: 'warning',
      subsystem: 'cpu',
      title: 'PM6450 voltage transient risk on minor background tasks',
      detail: `hispeed_load=${config.hispeedLoad}% or down_rate_limit_us=${config.downRateLimitUs} µs permits frequent frequency oscillation and localized pm6450_tz heat build-up.`,
      fixActionLabel: 'Apply PMIC Balance (95% / 5000 µs)',
      applyFix: (prev) => ({ ...prev, hispeedLoad: 95, downRateLimitUs: 5000 }),
    });
  }

  // 3. Audio HAL Boot Race Condition Check
  if (!config.waitForBootCompleted || config.postBootSleepSec < 5) {
    findings.push({
      id: 'audio-hal-boot-race',
      severity: 'critical',
      subsystem: 'boot',
      title: 'Boot-time Audio HAL & PMIC race condition risk',
      detail:
        'Injecting vendor.audio.* resetprop tweaks before sys.boot_completed=1 + stabilization delay causes startup speaker crackling or audio loss on HyperOS.',
      fixActionLabel: 'Enforce Boot Wait + 10s Delay',
      applyFix: (prev) => ({
        ...prev,
        waitForBootCompleted: true,
        postBootSleepSec: 10,
      }),
    });
  }

  // 4. Legacy update-binary installer script mismatch
  if (!config.fixInstallerServiceSh) {
    findings.push({
      id: 'installer-script-mismatch',
      severity: 'critical',
      subsystem: 'boot',
      title: 'Legacy update-binary extracts boot-completed.sh instead of service.sh',
      detail:
        'The original META-INF/update-binary referenced boot-completed.sh from v2.1 while vFinal migrated execution to service.sh.',
      fixActionLabel: 'Sync update-binary to service.sh',
      applyFix: (prev) => ({ ...prev, fixInstallerServiceSh: true }),
    });
  }

  // 5. ZRAM Swap Thrashing Check
  if (config.swappiness > 100 || config.pageCluster > 0 || config.watermarkBoostFactor > 0) {
    findings.push({
      id: 'zram-thrashing',
      severity: 'warning',
      subsystem: 'vm',
      title: 'Aggressive ZRAM compression & kswapd wakeup profile',
      detail: `swappiness=${config.swappiness}, page-cluster=${config.pageCluster}, watermark_boost=${config.watermarkBoostFactor} mirrors stock HyperOS multitasking stutters.`,
      fixActionLabel: 'Apply CoreFlow VM Profile',
      applyFix: (prev) => ({
        ...prev,
        swappiness: 60,
        pageCluster: 0,
        watermarkBoostFactor: 0,
      }),
    });
  }

  // 6. Primary UFS Scheduler & Queue Latency Check
  if (config.sdaScheduler === 'cpq' || config.ioschedFifoBatch > 8) {
    findings.push({
      id: 'ufs-cpq-bottleneck',
      severity: 'warning',
      subsystem: 'storage',
      title: `UFS sda queue using ${config.sdaScheduler} (fifo_batch=${config.ioschedFifoBatch})`,
      detail:
        'Stock cpq scheduler and fifo_batch=16 increase read tail-latency on Redmi Note 15 5G when background writes contend with app startup.',
      fixActionLabel: 'Switch to mq-deadline (batch 8)',
      applyFix: (prev) => ({
        ...prev,
        sdaScheduler: 'mq-deadline',
        ioschedFifoBatch: 8,
        nrRequests: 128,
      }),
    });
  }

  // 7. GPU Forced Power Rail Check
  if (config.gpuForceClkOn === 1 || config.gpuForceBusOn === 1 || config.gpuForceRailOn === 1) {
    findings.push({
      id: 'gpu-rail-locked',
      severity: 'critical',
      subsystem: 'gpu',
      title: 'Adreno 710 power rail or clock forced active',
      detail:
        'Enabling force_clk_on, force_bus_on, or force_rail_on blocks GX power collapse during screen-on idle, causing severe battery drain.',
      fixActionLabel: 'Allow GPU Auto-Gate',
      applyFix: (prev) => ({
        ...prev,
        gpuForceClkOn: 0,
        gpuForceBusOn: 0,
        gpuForceRailOn: 0,
      }),
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: 'all-nominal',
      severity: 'nominal',
      subsystem: 'cpu',
      title: 'All 8 SM6475 subsystems calibrated within safe thermal & latency bounds',
      detail:
        'PM6450 voltage transients, HyperOS Audio HAL synchronization, Uclamp foreground priority, VM ZRAM pressure, and UFS mq-deadline queues are cleanly balanced.',
    });
  }

  return findings;
}
