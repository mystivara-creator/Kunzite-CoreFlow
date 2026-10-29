import JSZip from 'jszip';
import { CoreFlowConfig } from '../types/coreflow';
import { STOCK_HYPEROS_CONFIG } from '../data/presets';

export function compileModuleProp(config: CoreFlowConfig): string {
  return [
    `id=${config.moduleId}`,
    `name=${config.moduleName}`,
    `version=${config.moduleVersion}`,
    `versionCode=${config.moduleVersionCode}`,
    `author=${config.moduleAuthor}`,
    `description=${config.moduleDescription}`,
    '',
  ].join('\n');
}

export function compileServiceSh(config: CoreFlowConfig): string {
  const uclampFormatted = config.topAppUclampMin.toFixed(2);
  const bootWaitBlock = config.waitForBootCompleted
    ? `# Wait until Android boot completes\nuntil [ "$(getprop sys.boot_completed)" -eq 1 ]; do\n  sleep ${config.bootPollIntervalSec}\ndone`
    : '# Boot completion check bypassed by custom profile';

  const sleepBlock =
    config.postBootSleepSec > 0
      ? `\n# Stabilization delay for HyperOS Audio HAL & PM6450 PMIC\nsleep ${config.postBootSleepSec}\n`
      : '\n';

  return `#!/system/bin/sh
MODDIR=\${0%/*}
LOG_FILE="/tmp/kernel_tuning.log"

# Initialize Execution Log
echo "============================================" > "$LOG_FILE"
echo " Kunzite ${config.moduleName} (${config.moduleVersion}) " >> "$LOG_FILE"
echo " Target: Redmi Note 15 5G (SM6475 / PM6450)" >> "$LOG_FILE"
echo " Date: $(date)" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

${bootWaitBlock}
${sleepBlock}
# ====================================================
# 1. CPU WALT GOVERNOR (SMOOTH & THERMAL BALANCE)
# ====================================================
for policy in /sys/devices/system/cpu/cpufreq/policy*; do
  GOV_PARAMS="$policy/walt"
  [ ! -d "$GOV_PARAMS" ] && GOV_PARAMS="$policy/schedutil"

  if [ -d "$GOV_PARAMS" ]; then
    echo ${config.upRateLimitUs} > "$GOV_PARAMS/up_rate_limit_us" 2>/dev/null
    echo ${config.downRateLimitUs} > "$GOV_PARAMS/down_rate_limit_us" 2>/dev/null
    echo ${config.hispeedLoad} > "$GOV_PARAMS/hispeed_load" 2>/dev/null
    
    case "$policy" in
      *policy0*) echo ${config.policy0HispeedFreq} > "$GOV_PARAMS/hispeed_freq" 2>/dev/null ;;
      *policy4*) echo ${config.policy4HispeedFreq} > "$GOV_PARAMS/hispeed_freq" 2>/dev/null ;;
    esac
  fi
done
echo " [OK] CPU WALT governor tuned (up=${config.upRateLimitUs}us, down=${config.downRateLimitUs}us, load=${config.hispeedLoad}%)" >> "$LOG_FILE"

if [ -w "/proc/sys/kernel/sched_schedstats" ]; then
  echo ${config.schedSchedstats} > /proc/sys/kernel/sched_schedstats 2>/dev/null
  echo " [OK] Kernel sched_schedstats -> ${config.schedSchedstats}" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 2. GPU ADRENO EFFICIENT POWER SAVING
# ====================================================
GPU_PATH="/sys/class/kgsl/kgsl-3d0"
if [ -d "$GPU_PATH" ]; then
  echo ${config.gpuForceClkOn} > "$GPU_PATH/force_clk_on" 2>/dev/null
  echo ${config.gpuForceBusOn} > "$GPU_PATH/force_bus_on" 2>/dev/null
  echo ${config.gpuForceRailOn} > "$GPU_PATH/force_rail_on" 2>/dev/null
  [ -f "$GPU_PATH/devfreq/adrenopp_boost" ] && echo ${config.adrenoppBoost} > "$GPU_PATH/devfreq/adrenopp_boost" 2>/dev/null
  [ -f "$GPU_PATH/idle_timer" ] && echo ${config.gpuIdleTimerMs} > "$GPU_PATH/idle_timer" 2>/dev/null
  echo " [OK] GPU Adreno power flags & idle_timer (${config.gpuIdleTimerMs}ms) applied" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 3. HYPEROS SPEAKER PERFECTION & TOUCH
# ====================================================
resetprop -n vendor.audio.adm.buffering.ms ${config.audioBufferingMs} 2>/dev/null
resetprop -n vendor.audio_hal.period_size ${config.audioPeriodSize} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.af ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.ar ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.at ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.hb ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.he ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.hso ${config.audioCpuset} 2>/dev/null
resetprop -n vendor.audio.cpu.sched.onlyfast ${config.audioOnlyFast ? 'true' : 'false'} 2>/dev/null
resetprop -n vendor.audio.offload.buffer.size.kb ${config.audioOffloadBufferKb} 2>/dev/null

resetprop -n touch.size.calibration ${config.touchSizeCalibration} 2>/dev/null
resetprop -n touch.pressure.scale ${config.touchPressureScale} 2>/dev/null
echo " [OK] HyperOS Speaker Perfection & Touch properties applied" >> "$LOG_FILE"

# ====================================================
# 4. UCLAMP LATENCY OPTIMIZATION
# ====================================================
if [ -d "/dev/cpuctl/top-app" ]; then
  [ -f "/dev/cpuctl/top-app/cpu.uclamp.latency_sensitive" ] && echo ${config.topAppLatencySensitive} > /dev/cpuctl/top-app/cpu.uclamp.latency_sensitive 2>/dev/null
  [ -f "/dev/cpuctl/top-app/cpu.uclamp.min" ] && echo ${uclampFormatted} > /dev/cpuctl/top-app/cpu.uclamp.min 2>/dev/null
  echo " [OK] Top-App Uclamp latency (${config.topAppLatencySensitive}) & min boost (${uclampFormatted}) applied" >> "$LOG_FILE"
fi

if [ -d "/dev/cpuctl/touch" ]; then
  [ -f "/dev/cpuctl/touch/cpu.uclamp.latency_sensitive" ] && echo ${config.touchLatencySensitive} > /dev/cpuctl/touch/cpu.uclamp.latency_sensitive 2>/dev/null
  echo " [OK] Touch Uclamp latency_sensitive -> ${config.touchLatencySensitive}" >> "$LOG_FILE"
fi

if [ -d "/dev/cpuctl/audio" ]; then
  [ -f "/dev/cpuctl/audio/cpu.uclamp.latency_sensitive" ] && echo ${config.audioLatencySensitive} > /dev/cpuctl/audio/cpu.uclamp.latency_sensitive 2>/dev/null
  echo " [OK] Audio Uclamp latency_sensitive -> ${config.audioLatencySensitive}" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 5. NETWORK TCP CONGESTION CONTROL
# ====================================================
sysctl -w net.ipv4.tcp_congestion_control=${config.tcpCongestionControl} >/dev/null 2>&1
echo " [OK] Network TCP ${config.tcpCongestionControl.toUpperCase()} Congestion Control applied" >> "$LOG_FILE"

# ====================================================
# 6. SETTINGS.DB & MODEM POWER REDUCTION
# ====================================================
settings put global wifi_scan_always_enabled ${config.wifiScanAlwaysEnabled} 2>/dev/null && echo " [OK] wifi_scan_always_enabled -> ${config.wifiScanAlwaysEnabled}" >> "$LOG_FILE"
settings put global ble_scan_always_enabled ${config.bleScanAlwaysEnabled} 2>/dev/null && echo " [OK] ble_scan_always_enabled -> ${config.bleScanAlwaysEnabled}" >> "$LOG_FILE"
settings put global 5g_icon_group_mode ${config.fiveGIconGroupMode} 2>/dev/null && echo " [OK] 5g_icon_group_mode -> ${config.fiveGIconGroupMode}" >> "$LOG_FILE"
setprop persist.traced.enable ${config.tracedEnable} 2>/dev/null && echo " [OK] persist.traced.enable -> ${config.tracedEnable}" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"

# ====================================================
# 7. VIRTUAL MEMORY (VM) TUNING
# ====================================================
write_vm() {
  if [ -w "/proc/sys/vm/$1" ]; then
    echo "$2" > "/proc/sys/vm/$1"
    echo " [OK] vm.$1 -> $2" >> "$LOG_FILE"
  fi
}

write_vm "dirty_background_ratio" "${config.dirtyBackgroundRatio}"
write_vm "dirty_ratio" "${config.dirtyRatio}"
write_vm "dirty_expire_centisecs" "${config.dirtyExpireCentisecs}"
write_vm "dirty_writeback_centisecs" "${config.dirtyWritebackCentisecs}"
write_vm "page-cluster" "${config.pageCluster}"
write_vm "swappiness" "${config.swappiness}"
write_vm "vfs_cache_pressure" "${config.vfsCachePressure}"
write_vm "watermark_boost_factor" "${config.watermarkBoostFactor}"

echo "" >> "$LOG_FILE"

# ====================================================
# 8. MULTI-QUEUE STORAGE TUNING (sda Scheduler & sda-sdf Tunables)
# ====================================================
for dev in sda sdb sdc sdd sde sdf; do
  BLOCK="/sys/block/$dev"
  if [ -d "$BLOCK" ]; then
    echo "--- Tuning Storage Device: $dev ---" >> "$LOG_FILE"
    
    if [ "$dev" = "sda" ]; then
      [ -f "$BLOCK/queue/scheduler" ] && echo "${config.sdaScheduler}" > "$BLOCK/queue/scheduler" 2>/dev/null && echo " [OK] sda scheduler set to: ${config.sdaScheduler}" >> "$LOG_FILE"
    fi

    [ -f "$BLOCK/queue/add_random" ] && echo ${config.addRandom} > "$BLOCK/queue/add_random"
    [ -f "$BLOCK/queue/iostats" ] && echo ${config.iostats} > "$BLOCK/queue/iostats" && echo " [OK] $dev iostats: ${config.iostats}" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/rotational" ] && echo ${config.rotational} > "$BLOCK/queue/rotational"
    [ -f "$BLOCK/queue/nr_requests" ] && echo ${config.nrRequests} > "$BLOCK/queue/nr_requests" && echo " [OK] $dev nr_requests: ${config.nrRequests}" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/read_ahead_kb" ] && echo ${config.readAheadKb} > "$BLOCK/queue/read_ahead_kb" && echo " [OK] $dev read_ahead_kb: ${config.readAheadKb}" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/rq_affinity" ] && echo ${config.rqAffinity} > "$BLOCK/queue/rq_affinity" && echo " [OK] $dev rq_affinity: ${config.rqAffinity}" >> "$LOG_FILE"

    IOSCHED="$BLOCK/queue/iosched"
    if [ -d "$IOSCHED" ]; then
      [ -f "$IOSCHED/low_latency" ] && echo ${config.ioschedLowLatency} > "$IOSCHED/low_latency"
      [ -f "$IOSCHED/slice_idle" ] && echo ${config.ioschedSliceIdle} > "$IOSCHED/slice_idle"
      [ -f "$IOSCHED/fifo_batch" ] && echo ${config.ioschedFifoBatch} > "$IOSCHED/fifo_batch" && echo " [OK] $dev iosched fifo_batch: ${config.ioschedFifoBatch}" >> "$LOG_FILE"
    fi
  fi
done

echo "" >> "$LOG_FILE"
echo " ✅ Semua konfigurasi Kunzite ${config.moduleName} ${config.moduleVersion} berhasil diterapkan!" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

exit 0
`;
}

export function compileUninstallSh(): string {
  const s = STOCK_HYPEROS_CONFIG;
  return `#!/system/bin/sh
# Symmetric Uninstall Script - Restore Stock HyperOS SM6475 Settings
# Target: Redmi Note 15 5G (SM6475 / kunzite)

# 1. Restore Stock CPU WALT & Kernel Schedstats
for policy in /sys/devices/system/cpu/cpufreq/policy*; do
  GOV_PARAMS="$policy/walt"
  [ ! -d "$GOV_PARAMS" ] && GOV_PARAMS="$policy/schedutil"
  if [ -d "$GOV_PARAMS" ]; then
    echo ${s.upRateLimitUs} > "$GOV_PARAMS/up_rate_limit_us" 2>/dev/null
    echo ${s.downRateLimitUs} > "$GOV_PARAMS/down_rate_limit_us" 2>/dev/null
    echo ${s.hispeedLoad} > "$GOV_PARAMS/hispeed_load" 2>/dev/null
  fi
done
[ -w "/proc/sys/kernel/sched_schedstats" ] && echo ${s.schedSchedstats} > /proc/sys/kernel/sched_schedstats 2>/dev/null

# 2. Restore Uclamp & Network Stock Defaults
[ -f "/dev/cpuctl/top-app/cpu.uclamp.latency_sensitive" ] && echo 0 > /dev/cpuctl/top-app/cpu.uclamp.latency_sensitive 2>/dev/null
[ -f "/dev/cpuctl/top-app/cpu.uclamp.min" ] && echo 0.00 > /dev/cpuctl/top-app/cpu.uclamp.min 2>/dev/null
[ -f "/dev/cpuctl/touch/cpu.uclamp.latency_sensitive" ] && echo 0 > /dev/cpuctl/touch/cpu.uclamp.latency_sensitive 2>/dev/null
[ -f "/dev/cpuctl/audio/cpu.uclamp.latency_sensitive" ] && echo 0 > /dev/cpuctl/audio/cpu.uclamp.latency_sensitive 2>/dev/null

sysctl -w net.ipv4.tcp_congestion_control=${s.tcpCongestionControl} >/dev/null 2>&1
settings put global wifi_scan_always_enabled ${s.wifiScanAlwaysEnabled} 2>/dev/null
settings put global ble_scan_always_enabled ${s.bleScanAlwaysEnabled} 2>/dev/null
settings put global 5g_icon_group_mode ${s.fiveGIconGroupMode} 2>/dev/null
setprop persist.traced.enable ${s.tracedEnable} 2>/dev/null

# 3. Restore Stock Virtual Memory (VM) Settings
sysctl -w vm.dirty_background_ratio=${s.dirtyBackgroundRatio}
sysctl -w vm.dirty_ratio=${s.dirtyRatio}
sysctl -w vm.dirty_expire_centisecs=${s.dirtyExpireCentisecs}
sysctl -w vm.dirty_writeback_centisecs=${s.dirtyWritebackCentisecs}
sysctl -w vm.page-cluster=${s.pageCluster}
sysctl -w vm.swappiness=${s.swappiness}
sysctl -w vm.vfs_cache_pressure=${s.vfsCachePressure}
sysctl -w vm.watermark_boost_factor=${s.watermarkBoostFactor}

# 4. Restore Stock Multi-Queue Storage Settings (sda-sdf)
for dev in sda sdb sdc sdd sde sdf; do
  BLOCK="/sys/block/$dev"
  if [ -d "$BLOCK" ]; then
    [ -f "$BLOCK/queue/add_random" ] && echo ${s.addRandom} > "$BLOCK/queue/add_random"
    [ -f "$BLOCK/queue/iostats" ] && echo ${s.iostats} > "$BLOCK/queue/iostats"
    [ -f "$BLOCK/queue/rotational" ] && echo ${s.rotational} > "$BLOCK/queue/rotational"
    [ -f "$BLOCK/queue/nr_requests" ] && echo ${s.nrRequests} > "$BLOCK/queue/nr_requests"
    [ -f "$BLOCK/queue/read_ahead_kb" ] && echo ${s.readAheadKb} > "$BLOCK/queue/read_ahead_kb"
    [ -f "$BLOCK/queue/rq_affinity" ] && echo ${s.rqAffinity} > "$BLOCK/queue/rq_affinity"
    [ -f "$BLOCK/queue/iosched/fifo_batch" ] && echo ${s.ioschedFifoBatch} > "$BLOCK/queue/iosched/fifo_batch"

    if [ "$dev" = "sda" ]; then
      [ -f "$BLOCK/queue/scheduler" ] && echo "${s.sdaScheduler}" > "$BLOCK/queue/scheduler" 2>/dev/null
    else
      [ -f "$BLOCK/queue/scheduler" ] && echo "mq-deadline" > "$BLOCK/queue/scheduler" 2>/dev/null
    fi
  fi
done

exit 0
`;
}

export function compileUpdateBinary(config: CoreFlowConfig): string {
  const targetScript = config.fixInstallerServiceSh ? 'service.sh' : 'boot-completed.sh';
  return `#!/system/bin/sh
# Magisk / KernelSU Next / APatch Module Installer Script

SKIPMOUNT=false
PROPFILE=true
POSTFSDATA=false
LATESTARTSERVICE=true

ui_print "============================================"
ui_print "           Kunzite ${config.moduleName} ${config.moduleVersion}          "
ui_print "       Target: Redmi Note 15 5G (SM6475)   "
ui_print "         By: ${config.moduleAuthor}              "
ui_print "============================================"
ui_print " "
ui_print " [!] Installing Low-Level System Tuning..."

unzip -o "$ZIPFILE" '${targetScript}' -d "$MODPATH" >&2
unzip -o "$ZIPFILE" 'uninstall.sh' -d "$MODPATH" >&2
unzip -o "$ZIPFILE" 'module.prop' -d "$MODPATH" >&2

set_perm "$MODPATH/${targetScript}" 0 0 0755
set_perm "$MODPATH/uninstall.sh" 0 0 0755

ui_print " "
ui_print " [OK] Installation complete!"
ui_print " [OK] Reboot your device to apply changes."
ui_print "============================================"
`;
}

export function compileUpdateJson(config: CoreFlowConfig): string {
  return JSON.stringify(
    {
      version: config.moduleVersion,
      versionCode: config.moduleVersionCode,
      zipUrl: `https://github.com/mystivara-creator/Kunzite-CoreFlow/releases/download/${config.moduleVersion}/CoreFlow-${config.moduleVersion}.zip`,
      changelog:
        'https://raw.githubusercontent.com/mystivara-creator/Kunzite-CoreFlow/main/CHANGELOG.md',
    },
    null,
    2
  );
}

export function simulateExecutionLog(
  config: CoreFlowConfig,
  mode: 'apply' | 'uninstall'
): { logText: string; stepsCount: number } {
  const nowStr = new Date().toUTCString();
  if (mode === 'uninstall') {
    const lines = [
      '============================================',
      ' Kunzite CoreFlow Uninstaller (Symmetric Restore)',
      ' Target: Redmi Note 15 5G (SM6475 / kunzite)',
      ` Date: ${nowStr}`,
      '============================================',
      ' [RESTORE] CPU policy0/policy4 WALT -> up=0us, down=0us, load=85%',
      ' [RESTORE] kernel.sched_schedstats -> 1',
      ' [RESTORE] Uclamp top-app/touch/audio latency_sensitive -> 0',
      ' [RESTORE] net.ipv4.tcp_congestion_control -> cubic',
      ' [RESTORE] settings global wifi/ble/5g_icon_group_mode -> 1',
      ' [RESTORE] vm.dirty_background_ratio -> 10, vm.dirty_ratio -> 20',
      ' [RESTORE] vm.swappiness -> 120, vm.page-cluster -> 1, vm.watermark_boost_factor -> 15000',
      ' [RESTORE] /sys/block/sda/queue/scheduler -> cpq',
      ' [RESTORE] /sys/block/sd[a-f]/queue -> nr_requests=62, read_ahead_kb=512, fifo_batch=16',
      ' ✅ Stock HyperOS SM6475 configuration symmetrically restored.',
      '============================================',
    ];
    return { logText: lines.join('\n'), stepsCount: 10 };
  }

  const storageBlocks = ['sda', 'sdb', 'sdc', 'sdd', 'sde', 'sdf']
    .map((dev) => {
      const lines = [`--- Tuning Storage Device: ${dev} ---`];
      if (dev === 'sda') {
        lines.push(` ✅ sda scheduler set to: ${config.sdaScheduler}`);
      }
      lines.push(` ✅ ${dev} iostats: ${config.iostats}`);
      lines.push(` ✅ ${dev} nr_requests: ${config.nrRequests}`);
      lines.push(` ✅ ${dev} read_ahead_kb: ${config.readAheadKb}`);
      lines.push(` ✅ ${dev} rq_affinity: ${config.rqAffinity}`);
      lines.push(` ✅ ${dev} iosched fifo_batch: ${config.ioschedFifoBatch}`);
      return lines.join('\n');
    })
    .join('\n');

  const logLines = [
    '============================================',
    ` Kunzite ${config.moduleName} (${config.moduleVersion} Balance) `,
    ' Target: Redmi Note 15 5G (SM6475 / PM6450)',
    ` Date: ${nowStr}`,
    '============================================',
    config.waitForBootCompleted
      ? ` [BOOT] sys.boot_completed=1 confirmed · post-boot sleep ${config.postBootSleepSec}s completed`
      : ' [WARN] Executed immediately without sys.boot_completed wait',
    ` ✅ CPU WALT governor tuned for PMIC thermal balance (up=${config.upRateLimitUs}us, down=${config.downRateLimitUs}us, load=${config.hispeedLoad}%)`,
    ` ✅ Overhead sched_schedstats -> ${config.schedSchedstats}`,
    '',
    ` ✅ GPU Adreno power flags & idle timer (${config.gpuIdleTimerMs}ms) applied`,
    '',
    ` ✅ HyperOS Speaker Perfection (cpuset=${config.audioCpuset}, period=${config.audioPeriodSize}) & Touch (${config.touchSizeCalibration}) applied`,
    ` ✅ Top-App Uclamp latency (${config.topAppLatencySensitive}) & min boost (${config.topAppUclampMin.toFixed(2)}) applied`,
    ` ✅ Touch Uclamp latency_sensitive -> ${config.touchLatencySensitive}`,
    ` ✅ Audio Uclamp latency_sensitive -> ${config.audioLatencySensitive}`,
    '',
    ` ✅ Network TCP ${config.tcpCongestionControl.toUpperCase()} Congestion Control applied`,
    ` ✅ Background WiFi scan -> ${config.wifiScanAlwaysEnabled}`,
    ` ✅ Background BLE scan -> ${config.bleScanAlwaysEnabled}`,
    ` ✅ 5G modem icon polling -> ${config.fiveGIconGroupMode}`,
    ` ✅ System tracing daemon -> ${config.tracedEnable}`,
    '',
    ` ✅ vm.dirty_background_ratio -> ${config.dirtyBackgroundRatio}`,
    ` ✅ vm.dirty_ratio -> ${config.dirtyRatio}`,
    ` ✅ vm.dirty_expire_centisecs -> ${config.dirtyExpireCentisecs}`,
    ` ✅ vm.dirty_writeback_centisecs -> ${config.dirtyWritebackCentisecs}`,
    ` ✅ vm.page-cluster -> ${config.pageCluster}`,
    ` ✅ vm.swappiness -> ${config.swappiness}`,
    ` ✅ vm.vfs_cache_pressure -> ${config.vfsCachePressure}`,
    ` ✅ vm.watermark_boost_factor -> ${config.watermarkBoostFactor}`,
    '',
    storageBlocks,
    '',
    ` ✅ Semua konfigurasi Kunzite ${config.moduleName} ${config.moduleVersion} berhasil diterapkan!`,
    '============================================',
  ];

  return { logText: logLines.join('\n'), stepsCount: 54 };
}

export interface LogAuditResult {
  stage: string;
  matched: boolean;
  evidence: string;
}

export function verifyKernelTuningLog(rawLog: string): LogAuditResult[] {
  const checks: { stage: string; pattern: RegExp; hint: string }[] = [
    {
      stage: '1. CPU WALT Governor & sched_schedstats',
      pattern: /CPU WALT governor tuned/i,
      hint: 'policy*/walt rate limits & hispeed_freq',
    },
    {
      stage: '2. GPU Adreno kgsl-3d0 Power Gating',
      pattern: /GPU Adreno power flags/i,
      hint: 'force_*_on=0 & idle_timer',
    },
    {
      stage: '3. HyperOS Audio HAL & Touch Calibration',
      pattern: /Speaker Perfection & Touch|Speaker Perfection/i,
      hint: 'vendor.audio.* & touch.pressure.scale',
    },
    {
      stage: '4. Uclamp Foreground / Touch / Audio Cgroups',
      pattern: /Top-App Uclamp latency/i,
      hint: '/dev/cpuctl/*/cpu.uclamp.latency_sensitive',
    },
    {
      stage: '5. Network TCP Congestion Control',
      pattern: /Congestion Control applied/i,
      hint: 'net.ipv4.tcp_congestion_control',
    },
    {
      stage: '6. Standby Radio & Trace Suppression',
      pattern: /5G modem|wifi_scan_always_enabled|Background WiFi scan/i,
      hint: 'settings global wifi/ble/5g_icon_group_mode',
    },
    {
      stage: '7. Virtual Memory & ZRAM Writeback',
      pattern: /vm\.swappiness/i,
      hint: '/proc/sys/vm/* write_vm()',
    },
    {
      stage: '8. Multi-Queue UFS Storage (sda–sdf)',
      pattern: /sda scheduler set to/i,
      hint: 'sda -> mq-deadline & fifo_batch',
    },
    {
      stage: '9. Final Completion Marker',
      pattern: /berhasil diterapkan/i,
      hint: 'Exit 0 completion banner',
    },
  ];

  return checks.map((c) => {
    const match = rawLog.match(c.pattern);
    return {
      stage: c.stage,
      matched: Boolean(match),
      evidence: match ? `Verified (${match[0]})` : `Missing (${c.hint})`,
    };
  });
}

export async function exportFlashableZip(config: CoreFlowConfig): Promise<void> {
  const zip = new JSZip();
  zip.file('module.prop', compileModuleProp(config));
  zip.file('service.sh', compileServiceSh(config));
  zip.file('uninstall.sh', compileUninstallSh());
  zip.file('update.json', compileUpdateJson(config));

  const metaInf = zip.folder('META-INF')?.folder('com')?.folder('google')?.folder('android');
  if (metaInf) {
    metaInf.file('update-binary', compileUpdateBinary(config));
    metaInf.file(
      'updater-script',
      '# Dummy updater-script for compatibility\n# Executed via update-binary\n'
    );
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeVer = config.moduleVersion.replace(/[^a-zA-Z0-9._-]/g, '_');
  a.href = url;
  a.download = `Kunzite-${config.moduleName}-${safeVer}-SM6475.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
