#!/bin/bash
# CarphaCom RoboFulfill — Isaac Sim Warehouse Scene Setup
# Run this on the NVIDIA Brev GPU instance after Isaac Sim Docker image is pulled

set -e

ISAAC_DIR="$HOME/docker/isaac-sim"
SCENE_DIR="$HOME/robofulfill-scene"

echo "╔══════════════════════════════════════════════════╗"
echo "║  CarphaCom RoboFulfill — Isaac Sim Launcher     ║"
echo "╚══════════════════════════════════════════════════╝"

# Check Docker image
echo "🔍 Checking Isaac Sim image..."
if ! sudo docker images | grep -q "isaac-sim"; then
    echo "❌ Isaac Sim image not found. Pull it first:"
    echo "   sudo docker pull nvcr.io/nvidia/isaac-sim:4.5.0"
    exit 1
fi

# Check GPU
echo "🔍 Checking GPU..."
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# Create directories
mkdir -p $ISAAC_DIR/cache/main/ov $ISAAC_DIR/cache/main/warp
mkdir -p $ISAAC_DIR/cache/computecache $ISAAC_DIR/config
mkdir -p $ISAAC_DIR/data/documents $ISAAC_DIR/data/Kit
mkdir -p $ISAAC_DIR/logs $ISAAC_DIR/pkg
mkdir -p $SCENE_DIR
sudo chown -R $(id -u):$(id -g) $ISAAC_DIR

# Create warehouse scene Python script
cat > $SCENE_DIR/warehouse_scene.py << 'PYSCRIPT'
"""
CarphaCom RoboFulfill — Warehouse Scene for Isaac Sim
Creates a realistic warehouse with shelf zones, robots, and conveyor belts
matching the live warehouse orchestrator layout.
"""

import omni
from omni.isaac.core import World
from omni.isaac.core.objects import DynamicCuboid, FixedCuboid, VisualCuboid
from omni.isaac.core.utils.stage_utils import add_reference_to_stage
import numpy as np

# Warehouse dimensions (scaled from grid: 40x30 -> 20m x 15m)
SCALE = 0.5  # 1 grid cell = 0.5m
WAREHOUSE_W = 40 * SCALE  # 20m
WAREHOUSE_H = 30 * SCALE  # 15m

# Zone definitions matching warehouse.ts
ZONES = [
    {"name": "Zona_A_Statii_CB", "x": 3, "y": 3, "w": 8, "h": 5, "color": [0.23, 0.51, 0.96]},
    {"name": "Zona_B_Antene", "x": 3, "y": 11, "w": 8, "h": 5, "color": [0.06, 0.73, 0.51]},
    {"name": "Zona_C_Securitate", "x": 3, "y": 19, "w": 8, "h": 5, "color": [0.96, 0.62, 0.04]},
    {"name": "Zona_D_Auto", "x": 20, "y": 3, "w": 8, "h": 5, "color": [0.55, 0.36, 0.96]},
    {"name": "Zona_E_PMR", "x": 20, "y": 11, "w": 8, "h": 5, "color": [0.93, 0.29, 0.60]},
    {"name": "Zona_F_SmartHome", "x": 20, "y": 19, "w": 8, "h": 5, "color": [0.02, 0.71, 0.83]},
    {"name": "Receptie", "x": 33, "y": 1, "w": 6, "h": 4, "color": [0.42, 0.45, 0.50]},
    {"name": "Ambalare", "x": 33, "y": 8, "w": 6, "h": 6, "color": [0.98, 0.45, 0.09]},
    {"name": "Expeditie", "x": 33, "y": 17, "w": 6, "h": 6, "color": [0.08, 0.72, 0.62]},
    {"name": "Incarcare", "x": 33, "y": 26, "w": 6, "h": 3, "color": [0.94, 0.27, 0.27]},
]

ROBOT_COLORS = [
    [1.0, 0.42, 0.42],  # Red
    [0.31, 0.80, 0.77],  # Teal
    [0.27, 0.72, 0.82],  # Blue
    [0.59, 0.81, 0.70],  # Green
]

def create_warehouse():
    """Build the warehouse scene"""
    world = World(stage_units_in_meters=1.0)
    
    # Ground plane
    world.scene.add_ground_plane(
        z_position=0,
        name="warehouse_floor",
        prim_path="/World/Floor",
        static_friction=0.5,
        dynamic_friction=0.5,
    )
    
    # Warehouse walls
    wall_height = 3.0
    wall_thickness = 0.15
    
    # North wall
    world.scene.add(FixedCuboid(
        prim_path="/World/Walls/North",
        name="wall_north",
        position=np.array([WAREHOUSE_W/2, 0, wall_height/2]),
        scale=np.array([WAREHOUSE_W, wall_thickness, wall_height]),
        color=np.array([0.3, 0.3, 0.35]),
    ))
    
    # South wall
    world.scene.add(FixedCuboid(
        prim_path="/World/Walls/South",
        name="wall_south",
        position=np.array([WAREHOUSE_W/2, WAREHOUSE_H, wall_height/2]),
        scale=np.array([WAREHOUSE_W, wall_thickness, wall_height]),
        color=np.array([0.3, 0.3, 0.35]),
    ))
    
    # West wall
    world.scene.add(FixedCuboid(
        prim_path="/World/Walls/West",
        name="wall_west",
        position=np.array([0, WAREHOUSE_H/2, wall_height/2]),
        scale=np.array([wall_thickness, WAREHOUSE_H, wall_height]),
        color=np.array([0.3, 0.3, 0.35]),
    ))
    
    # East wall
    world.scene.add(FixedCuboid(
        prim_path="/World/Walls/East",
        name="wall_east",
        position=np.array([WAREHOUSE_W, WAREHOUSE_H/2, wall_height/2]),
        scale=np.array([wall_thickness, WAREHOUSE_H, wall_height]),
        color=np.array([0.3, 0.3, 0.35]),
    ))
    
    # Shelf zones
    for zone in ZONES:
        cx = (zone["x"] + zone["w"]/2) * SCALE
        cy = (zone["y"] + zone["h"]/2) * SCALE
        sw = zone["w"] * SCALE
        sh = zone["h"] * SCALE
        
        # Zone floor marking
        world.scene.add(VisualCuboid(
            prim_path=f"/World/Zones/{zone['name']}_floor",
            name=f"{zone['name']}_floor",
            position=np.array([cx, cy, 0.01]),
            scale=np.array([sw, sh, 0.02]),
            color=np.array(zone["color"]),
        ))
        
        # Shelves (multiple rows within zones with type SHELF)
        shelf_height = 2.0
        shelf_width = 0.4
        if zone["x"] < 30:  # Only shelf zones
            for row in range(int(zone["h"]) - 1):
                world.scene.add(VisualCuboid(
                    prim_path=f"/World/Zones/{zone['name']}_shelf_{row}",
                    name=f"{zone['name']}_shelf_{row}",
                    position=np.array([cx, (zone["y"] + 1 + row) * SCALE, shelf_height/2]),
                    scale=np.array([sw * 0.9, shelf_width, shelf_height]),
                    color=np.array([c * 0.7 for c in zone["color"]]),
                ))
    
    # Robots (simple cuboids for now)
    for i in range(4):
        rx = (34 + (i % 3)) * SCALE
        ry = 27 * SCALE
        world.scene.add(DynamicCuboid(
            prim_path=f"/World/Robots/AGV_{i+1}",
            name=f"agv_{i+1}",
            position=np.array([rx, ry, 0.15]),
            scale=np.array([0.4, 0.6, 0.3]),
            color=np.array(ROBOT_COLORS[i]),
            mass=50.0,
        ))
    
    # Conveyor belt in packing area
    world.scene.add(VisualCuboid(
        prim_path="/World/Equipment/Conveyor",
        name="conveyor_belt",
        position=np.array([36 * SCALE, 11 * SCALE, 0.4]),
        scale=np.array([4 * SCALE, 0.6, 0.3]),
        color=np.array([0.2, 0.2, 0.25]),
    ))
    
    # Lighting
    from pxr import UsdLux, Sdf
    stage = omni.usd.get_context().get_stage()
    
    light = UsdLux.DistantLight.Define(stage, Sdf.Path("/World/Lights/Sun"))
    light.GetIntensityAttr().Set(1000)
    light.GetAngleAttr().Set(1.0)
    
    for i, pos in enumerate([(5, 5), (15, 5), (5, 12), (15, 12)]):
        dome = UsdLux.DomeLight.Define(stage, Sdf.Path(f"/World/Lights/Area_{i}"))
        dome.GetIntensityAttr().Set(500)
    
    # Reset world
    world.reset()
    
    print("✅ CarphaCom warehouse scene created!")
    print(f"   Dimensions: {WAREHOUSE_W}m x {WAREHOUSE_H}m")
    print(f"   Zones: {len(ZONES)}")
    print(f"   Robots: 4 AGV units")
    
    return world

if __name__ == "__main__":
    create_warehouse()
PYSCRIPT

echo "✅ Scene script created at $SCENE_DIR/warehouse_scene.py"

# Launch Isaac Sim with the scene
echo "🚀 Starting Isaac Sim container..."
sudo docker run --name isaac-sim --entrypoint bash -it --gpus all -e "ACCEPT_EULA=Y" --rm \
    --network=host \
    -e "PRIVACY_CONSENT=Y" \
    -v $ISAAC_DIR/cache/main/ov:/root/.cache/ov:rw \
    -v $ISAAC_DIR/cache/main/warp:/root/.cache/warp:rw \
    -v $ISAAC_DIR/cache/computecache:/root/.nv/ComputeCache:rw \
    -v $ISAAC_DIR/config:/root/.nvidia-omniverse/config:rw \
    -v $ISAAC_DIR/data/documents:/root/Documents:rw \
    -v $ISAAC_DIR/data/Kit:/root/.local/share/ov/data/Kit:rw \
    -v $ISAAC_DIR/logs:/root/.nvidia-omniverse/logs:rw \
    -v $ISAAC_DIR/pkg:/root/.local/share/ov/pkg:rw \
    -v $SCENE_DIR:/workspace:rw \
    nvcr.io/nvidia/isaac-sim:4.5.0
