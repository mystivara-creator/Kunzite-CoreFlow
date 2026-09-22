#!/system/bin/sh
# Uninstall Script - Restore Stock Settings
# Target: Redmi Note 15 5G (SM6475)

# ----------------------------------------------------
# 1. RESTORE STOCK VIRTUAL MEMORY (VM) SETTINGS
# ----------------------------------------------------
sysctl -w vm.dirty_background_ratio=10
sysctl -w vm.dirty_ratio=20
sysctl -w vm.dirty_expire_centisecs=3200
sysctl -w vm.dirty_writeback_centisecs=500
sysctl -w vm.page-cluster=1
sysctl -w vm.swappiness=120
sysctl -w vm.vfs_cache_pressure=100
sysctl -w vm.watermark_boost_factor=15000

# ----------------------------------------------------
# 2. RESTORE STOCK MULTI-QUEUE STORAGE SETTINGS (sda-sdf)
# ----------------------------------------------------
for dev in sda sdb sdc sdd sde sdf; do
  BLOCK="/sys/block/$dev"
  if [ -d "$BLOCK" ]; then
    # Restore stock I/O parameters
    [ -f "$BLOCK/queue/add_random" ] && echo 0 > "$BLOCK/queue/add_random"
    [ -f "$BLOCK/queue/iostats" ] && echo 1 > "$BLOCK/queue/iostats"
    [ -f "$BLOCK/queue/rotational" ] && echo 0 > "$BLOCK/queue/rotational"
    [ -f "$BLOCK/queue/nr_requests" ] && echo 62 > "$BLOCK/queue/nr_requests"
    [ -f "$BLOCK/queue/read_ahead_kb" ] && echo 512 > "$BLOCK/queue/read_ahead_kb"
    [ -f "$BLOCK/queue/rq_affinity" ] && echo 1 > "$BLOCK/queue/rq_affinity"

    # Restore default scheduler
    if [ "$dev" = "sda" ]; then
      [ -f "$BLOCK/queue/scheduler" ] && echo "cpq" > "$BLOCK/queue/scheduler" 2>/dev/null
    else
      [ -f "$BLOCK/queue/scheduler" ] && echo "mq-deadline" > "$BLOCK/queue/scheduler" 2>/dev/null
    fi
  fi
done

# Hapus log sementara jika ada
rm -f /tmp/kernel_tuning.log

exit 0
