#!/bin/bash
# CarphaCom RoboFulfill — Isaac Sim Headless Mode + WebRTC Streaming
# Runs Isaac Sim headless on Brev GPU and streams via WebRTC to the dashboard

set -e
ISAAC_DIR="$HOME/docker/isaac-sim"
SCENE_DIR="$HOME/robofulfill-scene"

echo "🎬 Starting Isaac Sim in headless streaming mode..."

# Start Isaac Sim with livestream (WebRTC) mode
sudo docker run --name isaac-sim-stream -d --gpus all \
    -e "ACCEPT_EULA=Y" \
    -e "PRIVACY_CONSENT=Y" \
    --network=host \
    -v $ISAAC_DIR/cache/main/ov:/root/.cache/ov:rw \
    -v $ISAAC_DIR/cache/main/warp:/root/.cache/warp:rw \
    -v $ISAAC_DIR/cache/computecache:/root/.nv/ComputeCache:rw \
    -v $ISAAC_DIR/config:/root/.nvidia-omniverse/config:rw \
    -v $ISAAC_DIR/data/documents:/root/Documents:rw \
    -v $ISAAC_DIR/data/Kit:/root/.local/share/ov/data/Kit:rw \
    -v $ISAAC_DIR/logs:/root/.nvidia-omniverse/logs:rw \
    -v $ISAAC_DIR/pkg:/root/.local/share/ov/pkg:rw \
    -v $SCENE_DIR:/workspace:rw \
    nvcr.io/nvidia/isaac-sim:4.5.0 \
    ./runheadless.webrtc.sh \
    --/app/livestream/logLevel=warn

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Isaac Sim WebRTC Streaming Started                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  📺 Stream URL: http://$(hostname -I | awk '{print $1}'):8211/streaming/webrtc-client  ║"
echo "║  📡 HTTP:       http://$(hostname -I | awk '{print $1}'):8211              ║"
echo "║  🔌 WebRTC:     ws://$(hostname -I | awk '{print $1}'):49100              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "To check logs: sudo docker logs -f isaac-sim-stream"
echo "To stop: sudo docker stop isaac-sim-stream"
