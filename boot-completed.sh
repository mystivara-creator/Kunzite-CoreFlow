#!/system/bin/sh
MODDIR=${0%/*}
LOG_FILE="/tmp/kernel_tuning.log"

# Inisialisasi Log
echo "============================================" > "$LOG_FILE"
echo " kunzite_coreflow_zero_overhead (vFinal) " >> "$LOG_FILE"
echo " Target: Redmi Note 15 5G (SM6475)" >> "$LOG_FILE"
echo " Date: $(date)" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

# Tunggu sampai booting selesai sempurna
until [ "$(getprop sys.boot_completed)" -eq 1 ]; do
  sleep 3
done

# Jeda tambahan agar sistem dan layanan latar belakang berada di kondisi idle
sleep 5

# ====================================================
# 1. VIRTUAL MEMORY TUNING
# Menjaga efisiensi RAM & mengurangi I/O spike pada UFS
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
# 2. MULTI-QUEUE STORAGE TUNING (sda–sdf)
# Fokus pada latensi rendah, efisiensi CPU, & kesehatan Flash
# ====================================================
for dev in sda sdb sdc sdd sde sdf; do
  BLOCK="/sys/block/$dev"
  if [ -d "$BLOCK" ]; then
    echo "--- Tuning Storage Device: $dev ---" >> "$LOG_FILE"
    
    # Matikan pencatatan iostats & add_random untuk memangkas CPU overhead
    [ -f "$BLOCK/queue/add_random" ] && echo 0 > "$BLOCK/queue/add_random"
    [ -f "$BLOCK/queue/iostats" ] && echo 0 > "$BLOCK/queue/iostats" && echo " ✅ $dev iostats: 0" >> "$LOG_FILE"
    [ -f "$BLOCK/queue/rotational" ] && echo 0 > "$BLOCK/queue/rotational"
    
    # Batasi antrean request agar seimbang antara throughput dan penggunaan RAM
    [ -f "$BLOCK/queue/nr_requests" ] && echo 128 > "$BLOCK/queue/nr_requests" && echo " ✅ $dev nr_requests: 128" >> "$LOG_FILE"
    
    # Set read_ahead ke 256KB untuk efisiensi random/sequential read
    [ -f "$BLOCK/queue/read_ahead_kb" ] && echo 256 > "$BLOCK/queue/read_ahead_kb" && echo " ✅ $dev read_ahead_kb: 256" >> "$LOG_FILE"
    
    # Selesaikan I/O pada CPU core yang meminta (menghemat daya inter-core)
    [ -f "$BLOCK/queue/rq_affinity" ] && echo 2 > "$BLOCK/queue/rq_affinity" && echo " ✅ $dev rq_affinity: 2" >> "$LOG_FILE"

    # Optimization khusus mq-deadline scheduler
    IOSCHED="$BLOCK/queue/iosched"
    if [ -d "$IOSCHED" ]; then
      [ -f "$IOSCHED/low_latency" ] && echo 0 > "$IOSCHED/low_latency"
      [ -f "$IOSCHED/slice_idle" ] && echo 0 > "$IOSCHED/slice_idle"
      [ -f "$IOSCHED/fifo_batch" ] && echo 8 > "$IOSCHED/fifo_batch" && echo " ✅ $dev iosched fifo_batch: 8" >> "$LOG_FILE"
    fi
  fi
done

echo "" >> "$LOG_FILE"
echo " ✅ Semua konfigurasi vFinal berhasil diterapkan!" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

exit 0
