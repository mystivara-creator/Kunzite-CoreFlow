#!/system/bin/sh
MODDIR=${0%/*}
LOG_FILE="/tmp/kernel_tuning.log"

# Inisialisasi Log
echo "============================================" > "$LOG_FILE"
echo " Kunzite CoreFlow (vFinal 2.2 Balance) " >> "$LOG_FILE"
echo " Target: Redmi Note 15 5G (SM6475 / PM6450)" >> "$LOG_FILE"
echo " Date: $(date)" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

# Tunggu booting selesai total
until [ "$(getprop sys.boot_completed)" -eq 1 ]; do
  sleep 3
done

# Jeda agar Audio HAL & PMIC tenang saat booting awal
sleep 10

# ====================================================
# 1. CPU WALT GOVERNOR (SMOOTH & THERMAL BALANCE)
# ====================================================
for policy in /sys/devices/system/cpu/cpufreq/policy*; do
  GOV_PARAMS="$policy/walt"
  [ ! -d "$GOV_PARAMS" ] && GOV_PARAMS="$policy/schedutil"

  if [ -d "$GOV_PARAMS" ]; then
    echo 0 > "$GOV_PARAMS/up_rate_limit_us" 2>/dev/null
    echo 5000 > "$GOV_PARAMS/down_rate_limit_us" 2>/dev/null
    echo 95 > "$GOV_PARAMS/hispeed_load" 2>/dev/null
    
    case "$policy" in
      *policy0*) echo 1190400 > "$GOV_PARAMS/hispeed_freq" 2>/dev/null ;;
      *policy4*) echo 1420800 > "$GOV_PARAMS/hispeed_freq" 2>/dev/null ;;
    esac
  fi
done
echo " ✅ CPU WALT governor tuned for PMIC thermal balance" >> "$LOG_FILE"

if [ -w "/proc/sys/kernel/sched_schedstats" ]; then
  echo 0 > /proc/sys/kernel/sched_schedstats 2>/dev/null
  echo " ✅ Overhead sched_schedstats disabled" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 2. GPU ADRENO EFFICIENT POWER SAVING
# ====================================================
GPU_PATH="/sys/class/kgsl/kgsl-3d0"
if [ -d "$GPU_PATH" ]; then
  echo 0 > "$GPU_PATH/force_clk_on" 2>/dev/null
  echo 0 > "$GPU_PATH/force_bus_on" 2>/dev/null
  echo 0 > "$GPU_PATH/force_rail_on" 2>/dev/null
  [ -f "$GPU_PATH/devfreq/adrenopp_boost" ] && echo 0 > "$GPU_PATH/devfreq/adrenopp_boost" 2>/dev/null
  [ -f "$GPU_PATH/idle_timer" ] && echo 80 > "$GPU_PATH/idle_timer" 2>/dev/null
  echo " ✅ GPU Adreno power flags & idle timer applied" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 3. HYPEROS SPEAKER PERFECTION & TOUCH
# ====================================================
resetprop -n vendor.audio.adm.buffering.ms 1 2>/dev/null
resetprop -n vendor.audio_hal.period_size 96 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.af 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.ar 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.at 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.hb 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.he 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.cpuset.hso 4-7 2>/dev/null
resetprop -n vendor.audio.cpu.sched.onlyfast true 2>/dev/null
resetprop -n vendor.audio.offload.buffer.size.kb 64 2>/dev/null

resetprop -n touch.size.calibration geometric 2>/dev/null
resetprop -n touch.pressure.scale 0.001 2>/dev/null
echo " ✅ HyperOS Speaker Perfection & Touch properties applied" >> "$LOG_FILE"

# ====================================================
# 4. UCLAMP LATENCY OPTIMIZATION
# ====================================================
if [ -d "/dev/cpuctl/top-app" ]; then
  [ -f "/dev/cpuctl/top-app/cpu.uclamp.latency_sensitive" ] && echo 1 > /dev/cpuctl/top-app/cpu.uclamp.latency_sensitive 2>/dev/null
  [ -f "/dev/cpuctl/top-app/cpu.uclamp.min" ] && echo 11.00 > /dev/cpuctl/top-app/cpu.uclamp.min 2>/dev/null
  echo " ✅ Top-App Uclamp latency & min boost applied" >> "$LOG_FILE"
fi

if [ -d "/dev/cpuctl/touch" ]; then
  [ -f "/dev/cpuctl/touch/cpu.uclamp.latency_sensitive" ] && echo 1 > /dev/cpuctl/touch/cpu.uclamp.latency_sensitive 2>/dev/null
  echo " ✅ Touch Uclamp latency_sensitive applied" >> "$LOG_FILE"
fi

if [ -d "/dev/cpuctl/audio" ]; then
  [ -f "/dev/cpuctl/audio/cpu.uclamp.latency_sensitive" ] && echo 1 > /dev/cpuctl/audio/cpu.uclamp.latency_sensitive 2>/dev/null
  echo " ✅ Audio Uclamp latency_sensitive applied" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# ====================================================
# 5. NETWORK TCP CONGESTION CONTROL
# ====================================================
sysctl -w net.ipv4.tcp_congestion_control=bbr >/dev/null 2>&1
echo " ✅ Network TCP BBR Congestion Control applied" >> "$LOG_FILE"

# ====================================================
# 6. SETTINGS.DB & MODEM POWER REDUCTION
# ====================================================
settings put global wifi_scan_always_enabled 0 2>/dev/null && echo " ✅ Background WiFi scan disabled" >> "$LOG_FILE"
settings put global ble_scan_always_enabled 0 2>/dev/null && echo " ✅ Background BLE scan disabled" >> "$LOG_FILE"
settings put global 5g_icon_group_mode 0 2>/dev/null && echo " ✅ Aggressive 5G modem pinging reduced" >> "$LOG_FILE"
setprop persist.traced.enable 0 2>/dev/null && echo " ✅ System tracing daemon disabled" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"

# ====================================================
# 7. VIRTUAL MEMORY (VM) TUNING
# ====================================================
write_vm() {
  if [ -w "/proc/sys/vm/$1" ]; then
    echo "$2" > "/proc/sys/vm/$1"
    echo " ✅ vm.$1 -> $2" >> "$LOG_FILE"
  fi
}

write_vm "dirty_background_ratio" "5"
write_vm "dirty_ratio" "15"
write_vm "dirty_expire_centisecs" "3000"
write_vm "dirty_writeback_centisecs" "5000"
write_vm "page-cluster" "0"
write_vm "swappiness" "60"
write_vm "vfs_cache_pressure" "80"
write_vm "watermark_boost_factor" "0"

echo "" >> "$LOG_FILE"

# ====================================================
# 8. MULTI-QUEUE STORAGE TUNING (sda Scheduler & sda-sdf Tunables)
# ====================================================
for dev in sda sdb sdc sdd sde sdf; do
  BLOCK="/sys/block/$dev"
  if [ -d "$BLOCK" ]; then
    echo "--- Tuning Storage Device: $dev ---" >> "$LOG_FILE"
    
    # Khusus sda: Ubah I/O Scheduler dari cpq ke mq-deadline
    if [ "$dev" = "sda" ]; then
      [ -f "$BLOCK/queue/scheduler" ] && echo "mq-deadline" > "$BLOCK/queue/scheduler" 2>/dev/null && echo " ✅ sda scheduler set to: mq-deadline" >> "$LOG_FILE"
    fi

    # Parameter Queue Umum (sda sampai sdf)
    [ -f "$BLOCK/queue/add_random" ] && echo 0 > "$BLOCK/queue/add_random"
    [ -f "$BLOCK/queue/iostats" ] && echo 0 > "$BLOCK/queue/iostats" && echo " ✅ $dev iostats: 0" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/rotational" ] && echo 0 > "$BLOCK/queue/rotational"
    [ -f "$BLOCK/queue/nr_requests" ] && echo 128 > "$BLOCK/queue/nr_requests" && echo " ✅ $dev nr_requests: 128" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/read_ahead_kb" ] && echo 256 > "$BLOCK/queue/read_ahead_kb" && echo " ✅ $dev read_ahead_kb: 256" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/rq_affinity" ] && echo 2 > "$BLOCK/queue/rq_affinity" && echo " ✅ $dev rq_affinity: 2" >> "$LOG_FILE"

    # Tunables mq-deadline (sda sampai sdf)
    IOSCHED="$BLOCK/queue/iosched"
    if [ -d "$IOSCHED" ]; then
      [ -f "$IOSCHED/low_latency" ] && echo 0 > "$IOSCHED/low_latency"
      [ -f "$IOSCHED/slice_idle" ] && echo 0 > "$IOSCHED/slice_idle"
      [ -f "$IOSCHED/fifo_batch" ] && echo 8 > "$IOSCHED/fifo_batch" && echo " ✅ $dev iosched fifo_batch: 8" >> "$LOG_FILE"
    fi
  fi
done

echo "" >> "$LOG_FILE"
echo " ✅ Semua konfigurasi Kunzite CoreFlow vFinal 2.2 berhasil diterapkan!" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

exit 0
