// CarphaCom Digital Twin — Warehouse Simulation Engine
// Real product stock from Medusa DB, 12 category zones, multi-stage fulfillment
import { v4 as uuid } from 'uuid';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface Position { x: number; y: number; }

export type ZoneType = 'SHELF' | 'PACKING' | 'SHIPPING' | 'CHARGING' | 'RECEIVING' | 'AISLE';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  category?: string; // root category handle
  subCategories?: string[]; // child category handles
  bounds: { x: number; y: number; w: number; h: number };
  color: string;
  slots: ShelfSlot[];
  totalProducts: number;
  totalStock: number;
}

export interface ShelfSlot {
  id: string;
  zoneId: string;
  position: Position;
  productId?: string;
  productName?: string;
  productHandle?: string;
  categoryHandle?: string;
  quantity: number;
  maxQuantity: number;
  sku?: string;
  thumbnail?: string;
}

export type RobotStatus = 'IDLE' | 'MOVING' | 'PICKING' | 'CARRYING' | 'PACKING' | 'CHARGING' | 'ERROR';

export interface Robot {
  id: string;
  name: string;
  position: Position;
  target: Position | null;
  status: RobotStatus;
  battery: number;
  speed: number;
  currentTask: FulfillmentTask | null;
  itemsCarried: CarriedItem[];
  path: Position[];
  pathIndex: number;
  color: string;
  totalItemsPicked: number;
  totalOrdersCompleted: number;
  returnTo: Position | null;
}

export interface CarriedItem {
  productName: string;
  quantity: number;
  slotId: string;
}

export type TaskStatus = 'QUEUED' | 'STOCK_CHECK' | 'ASSIGNED' | 'PICKING' | 'TRANSPORTING' | 'PACKING' | 'SHIPPING' | 'COMPLETED' | 'FAILED';

export interface FulfillmentTask {
  id: string;
  orderId: string;
  orderNumber?: string;
  items: TaskItem[];
  status: TaskStatus;
  assignedRobot: string | null;
  createdAt: number;
  completedAt?: number;
  currentItemIndex: number;
  customerEmail?: string;
  stockVerified: boolean;
  packingStartedAt?: number;
  shippingStartedAt?: number;
}

export interface TaskItem {
  productId: string;
  productName: string;
  quantity: number;
  slotId: string;
  picked: boolean;
  category?: string;
  thumbnail?: string;
}

export interface StockProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail: string;
  categoryHandle: string;
  categoryName: string;
  zoneHandle: string;
  zoneName: string;
  variantId: string;
  sku: string;
  stockQuantity: number;
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  robotId?: string;
  robotName?: string;
  type: 'order' | 'assign' | 'move' | 'pick' | 'pack' | 'ship' | 'complete' | 'communicate' | 'think' | 'charge' | 'command';
  message: string;
  details?: string;
  icon?: string;
}

export interface WarehouseMetrics {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  failedOrders: number;
  avgFulfillmentTime: number;
  robotUtilization: number;
  itemsPickedPerHour: number;
  robotStatuses: Record<string, RobotStatus>;
  totalProductsInStock: number;
  totalSKUs: number;
  stockByZone: Record<string, { name: string; products: number; stock: number }>;
  ordersInProgress: { picking: number; packing: number; shipping: number };
}

export interface WarehouseState {
  tick: number;
  zones: Zone[];
  robots: Robot[];
  tasks: FulfillmentTask[];
  metrics: WarehouseMetrics;
  grid: number[][];
  width: number;
  height: number;
  actionLog: ActionLogEntry[];
  robotMessages: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// WAREHOUSE LAYOUT — 12 Real Category Zones + 4 Functional
// Expanded to 60x40 for a more realistic warehouse
// ═══════════════════════════════════════════════════════════

const WAREHOUSE_WIDTH = 60;
const WAREHOUSE_HEIGHT = 40;

// 12 zones mapped to real CarphaCom root categories
const ZONES_CONFIG: Omit<Zone, 'slots' | 'totalProducts' | 'totalStock'>[] = [
  // Row 1 — Top
  { id: 'zone-radio', name: 'A — Radio Stations', type: 'SHELF', category: 'statii-radio',
    subCategories: ['statii-radio-statii-cb', 'statii-radio-statii-pmr', 'statii-radio-statii-uhfvhf', 'statii-radio-antene-cb', 'statii-radio-antene-uhfvhf', 'statii-radio-accesorii-statii-radio', 'statii-radio-statii-poc', 'statii-radio-scanere-radio'],
    bounds: { x: 2, y: 2, w: 12, h: 5 }, color: '#3B82F6' },
  { id: 'zone-surveillance', name: 'B — Video Surveillance', type: 'SHELF', category: 'sisteme-supraveghere-video',
    subCategories: ['sisteme-supraveghere-video-camere-ip', 'sisteme-supraveghere-video-sisteme-dvrnvr', 'sisteme-supraveghere-video-accesorii-supraveghere', 'sisteme-supraveghere-video-camere-vanatoare', 'sisteme-supraveghere-video-monitoare-bebelusi'],
    bounds: { x: 16, y: 2, w: 12, h: 5 }, color: '#EF4444' },
  { id: 'zone-electric', name: 'C — Electrical & Electronics', type: 'SHELF', category: 'electrice-si-electronice',
    subCategories: ['electrice-si-electronice-cabluri-retea', 'electrice-si-electronice-panouri-si-sisteme-solare', 'electrice-si-electronice-conectori-si-adaptoare', 'electrice-si-electronice-baterii-si-acumulatori', 'electrice-si-electronice-surse-de-alimentare', 'electrice-si-electronice-calculatoare-si-accesorii', 'electrice-si-electronice-switchuri-retea'],
    bounds: { x: 30, y: 2, w: 12, h: 5 }, color: '#F59E0B' },

  // Row 2 — Middle-top
  { id: 'zone-security', name: 'D — Security Systems', type: 'SHELF', category: 'sisteme-securitate',
    subCategories: ['sisteme-securitate-control-acces', 'sisteme-securitate-sisteme-alarma', 'sisteme-securitate-detectoare-gaz-si-fum', 'sisteme-securitate-videointerfoane', 'sisteme-securitate-automatizari-porti'],
    bounds: { x: 2, y: 10, w: 12, h: 5 }, color: '#10B981' },
  { id: 'zone-smarthome', name: 'E — Smart Home', type: 'SHELF', category: 'smart-home',
    subCategories: ['smart-home-automatizari-casa', 'smart-home-iluminat-inteligent', 'smart-home-termostate', 'smart-home-camere-inteligente'],
    bounds: { x: 16, y: 10, w: 12, h: 5 }, color: '#8B5CF6' },
  { id: 'zone-auto', name: 'F — Car Electronics', type: 'SHELF', category: 'electronice-auto',
    subCategories: ['electronice-auto-accesorii-auto', 'electronice-auto-playere-auto', 'electronice-auto-navigatie-gps', 'electronice-auto-alarme-auto', 'electronice-auto-boxe-auto', 'electronice-auto-senzori-parcare', 'electronice-auto-detectoare-radar'],
    bounds: { x: 30, y: 10, w: 12, h: 5 }, color: '#EC4899' },

  // Row 3 — Middle-bottom
  { id: 'zone-foto', name: 'G — Photo Video Audio', type: 'SHELF', category: 'foto-video-audio',
    subCategories: ['foto-video-audio-lanterne', 'foto-video-audio-sisteme-audio', 'foto-video-audio-camere-actiune', 'foto-video-audio-jucarii-interactive', 'foto-video-audio-inregistratoare-video'],
    bounds: { x: 2, y: 18, w: 12, h: 5 }, color: '#06B6D4' },
  { id: 'zone-casa', name: 'H — Home & Garden', type: 'SHELF', category: 'casa-si-gradina',
    subCategories: ['casa-si-gradina-sisteme-irigatii', 'casa-si-gradina-electrocasnice-bucatarie', 'casa-si-gradina-hranitori-animale', 'casa-si-gradina-aspiratoare', 'casa-si-gradina-sere-si-solarii', 'casa-si-gradina-purificatoare-aer', 'casa-si-gradina-dispozitive-anti-daunatori', 'casa-si-gradina-fiare-de-calcat'],
    bounds: { x: 16, y: 18, w: 12, h: 5 }, color: '#F97316' },
  { id: 'zone-sanatate', name: 'I — Health & Wellness', type: 'SHELF', category: 'sanatate-si-wellness',
    subCategories: ['sanatate-si-wellness-aromaterapie', 'sanatate-si-wellness-termometre', 'sanatate-si-wellness-tensiometre', 'sanatate-si-wellness-statii-meteo', 'sanatate-si-wellness-articole-sanatate', 'sanatate-si-wellness-lampi-de-trezire'],
    bounds: { x: 30, y: 18, w: 12, h: 5 }, color: '#14B8A6' },

  // Row 4 — Bottom
  { id: 'zone-telefoane', name: 'J — Phones & Tablets', type: 'SHELF', category: 'telefoane-si-tablete',
    subCategories: ['telefoane-si-tablete-accesorii-telefoane', 'telefoane-si-tablete-carduri-de-memorie'],
    bounds: { x: 2, y: 26, w: 10, h: 5 }, color: '#A855F7' },
  { id: 'zone-bricolaj', name: 'K — DIY & Tools', type: 'SHELF', category: 'bricolaj-si-scule',
    subCategories: ['bricolaj-si-scule-scule-electrice', 'bricolaj-si-scule-dozatoare-bauturi', 'bricolaj-si-scule-radio-portabil'],
    bounds: { x: 14, y: 26, w: 10, h: 5 }, color: '#D946EF' },
  { id: 'zone-diverse', name: 'L — Miscellaneous', type: 'SHELF', category: 'diverse',
    subCategories: ['diverse-alte-produse'],
    bounds: { x: 26, y: 26, w: 10, h: 5 }, color: '#78716C' },

  // Functional zones — Right side
  { id: 'zone-receiving', name: 'Goods Receiving', type: 'RECEIVING',
    bounds: { x: 46, y: 2, w: 12, h: 5 }, color: '#6B7280' },
  { id: 'zone-packing', name: 'Packing Zone', type: 'PACKING',
    bounds: { x: 46, y: 10, w: 12, h: 7 }, color: '#F97316' },
  { id: 'zone-shipping', name: 'Shipping / Courier', type: 'SHIPPING',
    bounds: { x: 46, y: 20, w: 12, h: 7 }, color: '#0EA5E9' },
  { id: 'zone-charging', name: 'AGV Charging Station', type: 'CHARGING',
    bounds: { x: 46, y: 30, w: 12, h: 8 }, color: '#EF4444' },
];

const ROBOT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const ROBOT_NAMES = ['Octobot', 'Marcobot', 'Cyberbot', 'Vegbot', 'AGV-Epsilon', 'AGV-Zeta'];

// ═══════════════════════════════════════════════════════════
// A* PATHFINDING
// ═══════════════════════════════════════════════════════════

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function astarPath(grid: number[][], start: Position, end: Position): Position[] {
  const width = grid[0].length;
  const height = grid.length;
  const key = (p: Position) => `${p.x},${p.y}`;

  if (end.x < 0 || end.x >= width || end.y < 0 || end.y >= height) return [];

  // If end is obstacle, find nearest walkable
  if (grid[end.y]?.[end.x] === 1) {
    let found = false;
    for (let radius = 1; radius < 8 && !found; radius++) {
      for (let dx = -radius; dx <= radius && !found; dx++) {
        for (let dy = -radius; dy <= radius && !found; dy++) {
          const nx = end.x + dx, ny = end.y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] === 0) {
            end = { x: nx, y: ny };
            found = true;
          }
        }
      }
    }
  }

  interface Node { pos: Position; g: number; f: number; parent: string | null; }
  const open = new Map<string, Node>();
  const closed = new Map<string, Node>();

  open.set(key(start), { pos: start, g: 0, f: heuristic(start, end), parent: null });

  while (open.size > 0) {
    let bestKey = '';
    let bestF = Infinity;
    for (const [k, n] of open) {
      if (n.f < bestF) { bestF = n.f; bestKey = k; }
    }

    const current = open.get(bestKey)!;
    open.delete(bestKey);
    closed.set(bestKey, current);

    if (current.pos.x === end.x && current.pos.y === end.y) {
      const path: Position[] = [];
      let node: Node | undefined = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent ? closed.get(node.parent) : undefined;
      }
      return path;
    }

    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    for (const d of dirs) {
      const np = { x: current.pos.x + d.x, y: current.pos.y + d.y };
      const nk = key(np);
      if (np.x < 0 || np.x >= width || np.y < 0 || np.y >= height) continue;
      if (grid[np.y][np.x] === 1) continue;
      if (closed.has(nk)) continue;

      const g = current.g + 1;
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        open.set(nk, { pos: np, g, f: g + heuristic(np, end), parent: bestKey });
      }
    }
  }

  // Fallback: direct line
  const path: Position[] = [];
  let cx = start.x, cy = start.y;
  while (cx !== end.x || cy !== end.y) {
    if (cx < end.x) cx++; else if (cx > end.x) cx--;
    if (cy < end.y) cy++; else if (cy > end.y) cy--;
    path.push({ x: cx, y: cy });
  }
  return path;
}

// Exported for compatibility
export function findPath(grid: number[][], start: Position, end: Position): Position[] {
  return astarPath(grid, start, end);
}

// ═══════════════════════════════════════════════════════════
// WAREHOUSE CLASS
// ═══════════════════════════════════════════════════════════

export class Warehouse {
  private state: WarehouseState;
  private taskQueue: FulfillmentTask[] = [];
  private completedTasks: FulfillmentTask[] = [];
  private failedTasks: FulfillmentTask[] = [];
  private itemsPickedTotal = 0;
  private startTime = Date.now();
  private onStateChange?: (state: WarehouseState) => void;
  private onTaskCompleteCallback?: (task: FulfillmentTask) => void;
  private stockProducts: StockProduct[] = [];
  private stockLoaded = false;
  private actionLog: ActionLogEntry[] = [];
  private robotMessages: Record<string, string> = {};
  private maxLogEntries = 200;

  constructor(robotCount = 4) {
    const grid = this.createGrid();
    const zones = this.createZones();
    const robots = this.createRobots(robotCount);

    this.state = {
      tick: 0,
      zones,
      robots,
      tasks: [],
      metrics: this.calculateMetrics(),
      grid,
      width: WAREHOUSE_WIDTH,
      height: WAREHOUSE_HEIGHT,
      actionLog: [],
      robotMessages: {},
    };
  }

  onUpdate(callback: (state: WarehouseState) => void) {
    this.onStateChange = callback;
  }

  onTaskComplete(callback: (task: FulfillmentTask) => void) {
    this.onTaskCompleteCallback = callback;
  }

  // Load real products from Medusa database
  async loadStock(dbUrl: string): Promise<void> {
    try {
      const pg = await import('pg');
      const client = new pg.default.Client({ connectionString: dbUrl });
      await client.connect();

      // Get all products with categories, variants, and stock levels
      const result = await client.query(`
        SELECT DISTINCT ON (p.id)
          p.id, p.title, p.handle, p.thumbnail,
          pc_child.handle as category_handle,
          pc_child.name as category_name,
          pc_parent.handle as zone_handle,
          pc_parent.name as zone_name,
          pv.id as variant_id,
          COALESCE(pv.sku, '') as sku,
          COALESCE(il.stocked_quantity, 10) as stock_quantity
        FROM product p
        JOIN product_category_product pcp ON pcp.product_id = p.id
        JOIN product_category pc_child ON pc_child.id = pcp.product_category_id AND pc_child.deleted_at IS NULL
        JOIN product_category pc_parent ON pc_child.parent_category_id = pc_parent.id AND pc_parent.deleted_at IS NULL
        LEFT JOIN product_variant pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
        LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id AND pvii.deleted_at IS NULL
        LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id AND il.deleted_at IS NULL
        WHERE p.deleted_at IS NULL AND p.thumbnail IS NOT NULL AND p.thumbnail != ''
        ORDER BY p.id, pv.id
      `);

      this.stockProducts = result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        handle: r.handle,
        thumbnail: r.thumbnail,
        categoryHandle: r.category_handle,
        categoryName: r.category_name,
        zoneHandle: r.zone_handle,
        zoneName: r.zone_name,
        variantId: r.variant_id || '',
        sku: r.sku || '',
        stockQuantity: parseInt(r.stock_quantity) || 10,
      }));

      await client.end();

      // Populate shelf slots with real products
      this.populateShelvesWithRealProducts();
      this.stockLoaded = true;

      console.log('📦 Loaded ' + this.stockProducts.length + ' products from Medusa into warehouse stock');

      // Log per-zone stats
      for (const zone of this.state.zones) {
        if (zone.type === 'SHELF') {
          console.log('  🏬 ' + zone.name + ': ' + zone.totalProducts + ' products, stock: ' + zone.totalStock);
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to load stock from DB:', err.message);
      // Fall back to generated stock
      this.populateShelvesWithGeneratedProducts();
      this.stockLoaded = true;
    }
  }

  private populateShelvesWithRealProducts(): void {
    for (const zone of this.state.zones) {
      if (zone.type !== 'SHELF') continue;

      // Find products that belong to this zone's root category
      const zoneProducts = this.stockProducts.filter(p => p.zoneHandle === zone.category);

      // Also catch products whose subcategory matches
      if (zoneProducts.length === 0 && zone.subCategories) {
        const subCatProducts = this.stockProducts.filter(p =>
          zone.subCategories!.some(sc => p.categoryHandle === sc || p.categoryHandle.startsWith(zone.category + '-'))
        );
        zoneProducts.push(...subCatProducts);
      }

      zone.totalProducts = zoneProducts.length;
      zone.totalStock = zoneProducts.reduce((s, p) => s + p.stockQuantity, 0);

      // Distribute products across shelf slots (top and bottom edge of zone)
      zone.slots = [];
      const slotsPerRow = zone.bounds.w;
      const rows = 2;
      let productIndex = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < slotsPerRow; col++) {
          const y = row === 0 ? zone.bounds.y : zone.bounds.y + zone.bounds.h - 1;
          const x = zone.bounds.x + col;

          if (zoneProducts.length > 0) {
            const product = zoneProducts[productIndex % zoneProducts.length];
            zone.slots.push({
              id: zone.id + '-slot-' + row + '-' + col,
              zoneId: zone.id,
              position: { x, y },
              productId: product.id,
              productName: product.title,
              productHandle: product.handle,
              categoryHandle: product.categoryHandle,
              quantity: product.stockQuantity,
              maxQuantity: Math.max(product.stockQuantity, 50),
              sku: product.sku,
              thumbnail: product.thumbnail,
            });
            productIndex++;
          } else {
            zone.slots.push({
              id: zone.id + '-slot-' + row + '-' + col,
              zoneId: zone.id,
              position: { x, y },
              productName: 'Empty Slot',
              quantity: 0,
              maxQuantity: 50,
            });
          }
        }
      }
    }
  }

  private populateShelvesWithGeneratedProducts(): void {
    for (const zone of this.state.zones) {
      if (zone.type !== 'SHELF') continue;
      zone.slots = [];
      zone.totalProducts = 0;
      zone.totalStock = 0;

      const slotsPerRow = zone.bounds.w;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < slotsPerRow; col++) {
          const y = row === 0 ? zone.bounds.y : zone.bounds.y + zone.bounds.h - 1;
          const x = zone.bounds.x + col;
          const qty = Math.floor(Math.random() * 50) + 10;
          zone.slots.push({
            id: zone.id + '-slot-' + row + '-' + col,
            zoneId: zone.id,
            position: { x, y },
            productName: 'Product ' + zone.id + '-' + row + '-' + col,
            quantity: qty,
            maxQuantity: 50,
          });
          zone.totalStock += qty;
          zone.totalProducts++;
        }
      }
    }
  }

  private createGrid(): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < WAREHOUSE_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < WAREHOUSE_WIDTH; x++) {
        grid[y][x] = 0;
      }
    }

    // Mark shelf zone interiors as obstacles (robots navigate around edges)
    for (const zone of ZONES_CONFIG) {
      if (zone.type === 'SHELF') {
        for (let y = zone.bounds.y + 1; y < zone.bounds.y + zone.bounds.h - 1; y++) {
          for (let x = zone.bounds.x + 1; x < zone.bounds.x + zone.bounds.w - 1; x++) {
            if (y < WAREHOUSE_HEIGHT && x < WAREHOUSE_WIDTH) {
              grid[y][x] = 1;
            }
          }
        }
      }
    }

    // Walls
    for (let x = 0; x < WAREHOUSE_WIDTH; x++) {
      grid[0][x] = 1;
      grid[WAREHOUSE_HEIGHT - 1][x] = 1;
    }
    for (let y = 0; y < WAREHOUSE_HEIGHT; y++) {
      grid[y][0] = 1;
      grid[y][WAREHOUSE_WIDTH - 1] = 1;
    }

    return grid;
  }

  private createZones(): Zone[] {
    return ZONES_CONFIG.map(zone => ({
      ...zone,
      slots: [],
      totalProducts: 0,
      totalStock: 0,
    }));
  }

  private createRobots(count: number): Robot[] {
    const chargingZone = ZONES_CONFIG.find(z => z.type === 'CHARGING')!;
    return Array.from({ length: count }, (_, i) => ({
      id: 'robot-' + (i + 1),
      name: ROBOT_NAMES[i] || 'AGV-' + (i + 1),
      position: { x: chargingZone.bounds.x + 1 + (i % 4) * 2, y: chargingZone.bounds.y + 1 + Math.floor(i / 4) },
      target: null,
      status: 'IDLE' as RobotStatus,
      battery: 85 + Math.floor(Math.random() * 15),
      speed: 1,
      currentTask: null,
      itemsCarried: [],
      path: [],
      pathIndex: 0,
      returnTo: null,
      color: ROBOT_COLORS[i] || '#777',
      totalItemsPicked: 0,
      totalOrdersCompleted: 0,
    }));
  }

  // Add a fulfillment task from a real Medusa order
  addOrder(order: {
    orderId: string;
    orderNumber?: string;
    items: { productId: string; productName: string; quantity: number; category?: string }[];
    customerEmail?: string;
  }): FulfillmentTask {
    const taskItems: TaskItem[] = order.items.map(item => {
      let matchedSlot: ShelfSlot | undefined;

      // 1. Try exact product match
      for (const zone of this.state.zones) {
        if (zone.type !== 'SHELF') continue;
        const slot = zone.slots.find(s => s.productId === item.productId && s.quantity > 0);
        if (slot) { matchedSlot = slot; break; }
      }

      // 2. Try category match
      if (!matchedSlot && item.category) {
        for (const zone of this.state.zones) {
          if (zone.type !== 'SHELF') continue;
          if (zone.category === item.category || zone.subCategories?.some(sc => sc === item.category)) {
            const slot = zone.slots.find(s => s.quantity > 0);
            if (slot) { matchedSlot = slot; break; }
          }
        }
      }

      // 3. Fallback: any shelf with stock
      if (!matchedSlot) {
        for (const zone of this.state.zones) {
          if (zone.type !== 'SHELF') continue;
          const slot = zone.slots.find(s => s.quantity > 0);
          if (slot) { matchedSlot = slot; break; }
        }
      }

      // 4. Last resort: first slot
      if (!matchedSlot) {
        const firstShelf = this.state.zones.find(z => z.type === 'SHELF');
        matchedSlot = firstShelf?.slots[0];
      }

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        slotId: matchedSlot?.id || 'unknown-slot',
        picked: false,
        category: item.category,
        thumbnail: matchedSlot?.thumbnail,
      };
    });

    const task: FulfillmentTask = {
      id: uuid(),
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      items: taskItems,
      status: 'QUEUED',
      assignedRobot: null,
      createdAt: Date.now(),
      currentItemIndex: 0,
      customerEmail: order.customerEmail,
      stockVerified: false,
    };

    this.taskQueue.push(task);
    this.state.tasks.push(task);
    return task;
  }

  // Main simulation tick
  tick(): WarehouseState {
    this.state.tick++;

    // 1. Stock check for queued orders
    this.checkStock();

    // 2. Assign verified tasks to idle robots
    this.assignTasks();

    // 3. Move robots along paths
    this.moveRobots();

    // 4. Process actions (pick, pack, ship)
    this.processActions();

    // 5. Battery management
    this.updateBatteries();

    // 6. Update metrics
    this.state.metrics = this.calculateMetrics();

    // 7. Update idle robot messages
    for (const robot of this.state.robots) {
      if (robot.status === 'IDLE' && !this.robotMessages[robot.id]) {
        this.setRobotMessage(robot.id, 'Standing by...');
      }
    }

    // Notify listeners
    this.onStateChange?.(this.getState());

    return this.getState();
  }

  // Stage 1: Verify stock availability
  private checkStock() {
    const queuedTasks = this.taskQueue.filter(t => t.status === 'QUEUED' && !t.stockVerified);

    for (const task of queuedTasks) {
      task.status = 'STOCK_CHECK';
      let allInStock = true;

      for (const item of task.items) {
        const slot = this.findSlot(item.slotId);
        if (!slot || slot.quantity < item.quantity) {
          const altSlot = this.findAlternativeSlot(item);
          if (altSlot) {
            item.slotId = altSlot.id;
          } else {
            allInStock = false;
          }
        }
      }

      if (!allInStock) {
        console.log('⚠️ Stock warning for order ' + task.orderNumber + ': some items may be low');
      }
      task.status = 'QUEUED';
      task.stockVerified = true;
    }
  }

  // Stage 2: Assign tasks to robots
  private assignTasks() {
    const readyTasks = this.taskQueue.filter(t => t.status === 'QUEUED' && t.stockVerified);
    const availableRobots = this.state.robots.filter(r =>
      (r.status === 'IDLE' || (r.status === 'CHARGING' && r.battery > 30)) && r.battery > 15
    );

    for (const task of readyTasks) {
      if (availableRobots.length === 0) break;

      const robot = availableRobots.shift()!;
      task.status = 'ASSIGNED';
      task.assignedRobot = robot.id;
      robot.currentTask = task;
      robot.status = 'MOVING';

      this.addLog({ robotId: robot.id, robotName: robot.name, type: 'assign', message: `${robot.name} assigned to order ${task.orderNumber || task.orderId.slice(0,8)}`, icon: '📋', details: `${task.items.length} items to pick` });
      this.setRobotMessage(robot.id, `New order! ${task.items.length} items to pick`);

      // Notify other robots
      for (const other of this.state.robots) {
        if (other.id !== robot.id && other.status === 'IDLE') {
          this.addLog({ robotId: other.id, robotName: other.name, type: 'communicate', message: `${other.name}: Copy that, ${robot.name} is handling order ${task.orderNumber || ''}`, icon: '📡' });
        }
      }

      const firstItem = task.items[0];
      const slot = this.findSlot(firstItem.slotId);
      if (slot) {
        const path = astarPath(this.state.grid, robot.position, slot.position);
        robot.path = path;
        robot.pathIndex = 0;
        robot.target = slot.position;
      }
    }
  }

  // Stage 3: Move robots
  private moveRobots() {
    for (const robot of this.state.robots) {
      if (robot.status !== 'MOVING' && robot.status !== 'CARRYING') continue;

      if (robot.path.length === 0) {
        if (!robot.currentTask) robot.status = 'IDLE';
        continue;
      }

      if (robot.pathIndex < robot.path.length) {
        robot.position = { ...robot.path[robot.pathIndex] };
        robot.pathIndex++;
      }

      // Arrived at target
      if (robot.pathIndex >= robot.path.length && robot.target) {
        robot.position = { ...robot.target };
        robot.path = [];
        robot.pathIndex = 0;
        robot.target = null;

        if (robot.currentTask) {
          const task = robot.currentTask;
          if (task.status === 'ASSIGNED' || task.status === 'PICKING') {
            robot.status = 'PICKING';
            task.status = 'PICKING';
          } else if (task.status === 'TRANSPORTING') {
            robot.status = 'PACKING';
            task.status = 'PACKING';
            task.packingStartedAt = Date.now();
            this.setRobotMessage(robot.id, `📦 At packing station! Boxing products...`);
            this.addLog({ robotId: robot.id, robotName: robot.name, type: 'pack', message: `${robot.name} arrived at packing zone, boxing ${task.items.length} products`, icon: '📦' });
          } else if (task.status === 'SHIPPING') {
            task.shippingStartedAt = Date.now();
            robot.status = 'CARRYING';
            this.setRobotMessage(robot.id, `At courier dock! Unloading order...`);
            this.addLog({ robotId: robot.id, robotName: robot.name, type: 'ship', message: `${robot.name} arrived at courier dock, unloading order ${task.orderNumber || ''}`, icon: '🚚' });
          }
        } else if (robot.returnTo) {
          // Arrived at destination — now return to origin
          const origin = { ...robot.returnTo };
          robot.returnTo = null;
          this.setRobotMessage(robot.id, `Done! Heading back`);
          this.addLog({ robotId: robot.id, robotName: robot.name, type: 'command', message: `${robot.name}: Task complete, returning to base`, icon: '↩️' });
          this.sendRobotTo(robot.id, origin);
        } else {
          robot.status = 'IDLE';
        }
      }

      // Safety: stuck MOVING/CARRYING with no path — go charge
      if ((robot.status === 'MOVING' || robot.status === 'CARRYING') && robot.path.length === 0 && !robot.target && !robot.currentTask) {
        const chargingZone = this.state.zones.find(z => z.type === 'CHARGING')!;
        const chargeTarget = {
          x: chargingZone.bounds.x + 1 + Math.floor(Math.random() * 4) * 2,
          y: chargingZone.bounds.y + 1,
        };
        const returnPath = astarPath(this.state.grid, robot.position, chargeTarget);
        if (returnPath.length > 0) {
          robot.path = returnPath;
          robot.pathIndex = 0;
          robot.target = chargeTarget;
          this.setRobotMessage(robot.id, `Heading to charging station`);
        } else {
          robot.status = 'IDLE';
        }
      }
    }
  }

  // Stage 4: Process pick/pack/ship actions
  private processActions() {
    for (const robot of this.state.robots) {
      if (!robot.currentTask) continue;
      const task = robot.currentTask;

      // PICKING — Grab items from shelves
      if (robot.status === 'PICKING') {
        if (this.state.tick % 2 === 0) {
          const item = task.items[task.currentItemIndex];
          if (item) {
            item.picked = true;
            robot.itemsCarried.push({
              productName: item.productName,
              quantity: item.quantity,
              slotId: item.slotId,
            });
            robot.totalItemsPicked++;
            this.itemsPickedTotal++;

            // Robot thought: found item
            const slot = this.findSlot(item.slotId);
            const zone = slot ? this.state.zones.find(z => z.id === slot.zoneId) : null;
            this.addLog({ robotId: robot.id, robotName: robot.name, type: 'pick', message: `${robot.name} picked: ${item.productName.substring(0,40)} x${item.quantity}`, icon: '📦', details: zone ? `from ${zone.name}` : undefined });
            this.setRobotMessage(robot.id, `Got it! ${item.productName.substring(0,25)}`);
            if (slot) {
              slot.quantity = Math.max(0, slot.quantity - item.quantity);
              // Update zone total
              const zone = this.state.zones.find(z => z.id === slot.zoneId);
              if (zone) {
                zone.totalStock = zone.slots.reduce((s, sl) => s + sl.quantity, 0);
              }
            }

            task.currentItemIndex++;

            if (task.currentItemIndex < task.items.length) {
              // Move to next item
              const nextItem = task.items[task.currentItemIndex];
              const nextSlot = this.findSlot(nextItem.slotId);
              if (nextSlot) {
                robot.status = 'MOVING';
                const path = astarPath(this.state.grid, robot.position, nextSlot.position);
                robot.path = path;
                robot.pathIndex = 0;
                robot.target = nextSlot.position;
                const nextZone = this.state.zones.find(z => z.id === nextSlot.zoneId);
                this.setRobotMessage(robot.id, `Next: ${nextItem.productName.substring(0,25)}`);
                this.addLog({ robotId: robot.id, robotName: robot.name, type: 'move', message: `${robot.name} heading to ${nextZone?.name || 'shelf'} for next item`, icon: '🚗' });
              }
            } else {
              // All items picked — TRANSPORTING (carrying) to packing zone
              task.status = 'TRANSPORTING';
              robot.status = 'CARRYING';
              this.setRobotMessage(robot.id, `📦 Carrying ${task.items.length} items to packing zone`);
              this.addLog({ robotId: robot.id, robotName: robot.name, type: 'move', message: `${robot.name}: All ${task.items.length} items picked! Carrying products to packing zone`, icon: '🏋️', details: `${task.items.map(i => i.productName.substring(0,30)).join(', ')}` });
              const packingZone = this.state.zones.find(z => z.type === 'PACKING')!;
              const packTarget = {
                x: packingZone.bounds.x + 2,
                y: packingZone.bounds.y + Math.floor(packingZone.bounds.h / 2),
              };
              const path = astarPath(this.state.grid, robot.position, packTarget);
              robot.path = path;
              robot.pathIndex = 0;
              robot.target = packTarget;
            }
          }
        }
      }

      // PACKING — Wrap and prepare order (takes ~3 seconds for realistic packing)
      if (robot.status === 'PACKING') {
        const packingDuration = task.packingStartedAt ? Date.now() - task.packingStartedAt : 0;
        // Show packing progress  
        const progress = Math.min(100, Math.round((packingDuration / 3000) * 100));
        if (progress < 100) {
          this.setRobotMessage(robot.id, `📦 Packing order... ${progress}%`);
        }
        if (packingDuration > 3000) {
          // Packing done — carry box to courier dock
          task.status = 'SHIPPING';
          robot.status = 'CARRYING';
          robot.itemsCarried = task.items.map(i => ({ productName: i.productName, quantity: i.quantity, slotId: i.slotId }));
          this.setRobotMessage(robot.id, `📦 Packed! Carrying box to courier dock`);
          this.addLog({ robotId: robot.id, robotName: robot.name, type: 'pack', message: `${robot.name} finished packing order ${task.orderNumber || ''}, carrying box to courier dock`, icon: '📦' });
          const shippingZone = this.state.zones.find(z => z.type === 'SHIPPING')!;
          const shipTarget = {
            x: shippingZone.bounds.x + 2,
            y: shippingZone.bounds.y + Math.floor(shippingZone.bounds.h / 2),
          };
          const path = astarPath(this.state.grid, robot.position, shipTarget);
          robot.path = path;
          robot.pathIndex = 0;
          robot.target = shipTarget;
        }
      }

      // SHIPPING — Deliver to courier area -> COMPLETED
      if (task.status === 'SHIPPING' && (robot.status === 'CARRYING' || (robot.status !== 'MOVING' && robot.status !== 'PICKING'))) {
        // Wait for unloading time (~2 seconds)
        const unloadDuration = task.shippingStartedAt ? Date.now() - task.shippingStartedAt : 0;
        if (unloadDuration > 2000) {
          task.status = 'COMPLETED';
          task.completedAt = Date.now();
          robot.currentTask = null;
          robot.itemsCarried = [];
          robot.target = null;
          robot.totalOrdersCompleted++;

          this.setRobotMessage(robot.id, `🎉 Order delivered! Returning to charge`);
          this.addLog({ robotId: robot.id, robotName: robot.name, type: 'complete', message: `${robot.name}: Order ${task.orderNumber || ''} delivered to courier!`, icon: '🎉', details: `${task.items.length} items delivered to courier dock` });

          // Other robots congratulate
          for (const other of this.state.robots) {
            if (other.id !== robot.id && (other.status === 'IDLE' || other.status === 'CHARGING')) {
              this.addLog({ robotId: other.id, robotName: other.name, type: 'communicate', message: `${other.name}: Nice job ${robot.name}! 🤖`, icon: '💬' });
            }
          }

          this.completedTasks.push(task);
          this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);

          const stateTask = this.state.tasks.find(t => t.id === task.id);
          if (stateTask) {
            stateTask.status = 'COMPLETED';
            stateTask.completedAt = task.completedAt;
          }

          // Notify Medusa
          this.onTaskCompleteCallback?.(task);

          // Return robot to charging station
          const chargingZone = this.state.zones.find(z => z.type === 'CHARGING')!;
          const chargeTarget = {
            x: chargingZone.bounds.x + 1 + Math.floor(Math.random() * 4) * 2,
            y: chargingZone.bounds.y + 1,
          };
          const returnPath = astarPath(this.state.grid, robot.position, chargeTarget);
          if (returnPath.length > 0) {
            robot.path = returnPath;
            robot.pathIndex = 0;
            robot.target = chargeTarget;
            robot.status = 'MOVING';
            this.addLog({ robotId: robot.id, robotName: robot.name, type: 'move', message: `${robot.name} heading back to charging station`, icon: '🔋' });
          } else {
            robot.status = 'IDLE';
          }
        }
      }
    }
  }

  // Battery management
  private updateBatteries() {
    for (const robot of this.state.robots) {
      if (robot.status === 'MOVING' || robot.status === 'CARRYING') {
        robot.battery = Math.max(0, robot.battery - 0.04);
      } else if (robot.status === 'PICKING' || robot.status === 'PACKING') {
        robot.battery = Math.max(0, robot.battery - 0.02);
      }

      // Charging zone
      const chargingZone = this.state.zones.find(z => z.type === 'CHARGING');
      if (chargingZone && (robot.status === 'IDLE' || robot.status === 'CHARGING') &&
          robot.position.x >= chargingZone.bounds.x &&
          robot.position.x < chargingZone.bounds.x + chargingZone.bounds.w &&
          robot.position.y >= chargingZone.bounds.y &&
          robot.position.y < chargingZone.bounds.y + chargingZone.bounds.h) {
        if (robot.status !== 'CHARGING') {
          this.addLog({ robotId: robot.id, robotName: robot.name, type: 'charge', message: `${robot.name} docked at charging station`, icon: '🔋' });
        }
        robot.battery = Math.min(100, robot.battery + 0.4);
        robot.status = 'CHARGING';
        this.setRobotMessage(robot.id, `Charging... ${Math.round(robot.battery)}%`);
      }

      // Done charging
      if (robot.status === 'CHARGING' && robot.battery >= 95) {
        robot.status = 'IDLE';
        const chZone = this.state.zones.find(z => z.type === 'CHARGING')!;
        const exitTarget = { x: chZone.bounds.x - 2, y: chZone.bounds.y + 1 };
        robot.path = astarPath(this.state.grid, robot.position, exitTarget);
        robot.pathIndex = 0;
        robot.target = exitTarget;
        if (robot.path.length > 0) {
          robot.status = 'MOVING';
        }
      }

      // Low battery — charge
      if (robot.battery < 15 && robot.status === 'IDLE') {
        robot.status = 'MOVING';
        const chZone = this.state.zones.find(z => z.type === 'CHARGING')!;
        const chargeTarget = { x: chZone.bounds.x + 1 + Math.floor(Math.random() * 3), y: chZone.bounds.y + 1 };
        robot.path = astarPath(this.state.grid, robot.position, chargeTarget);
        robot.pathIndex = 0;
        robot.target = chargeTarget;
      }
    }
  }

  private findSlot(slotId: string): ShelfSlot | undefined {
    for (const zone of this.state.zones) {
      const slot = zone.slots.find(s => s.id === slotId);
      if (slot) return slot;
    }
    return undefined;
  }

  private findAlternativeSlot(item: TaskItem): ShelfSlot | undefined {
    for (const zone of this.state.zones) {
      if (zone.type !== 'SHELF') continue;
      if (item.category && (zone.category === item.category || zone.subCategories?.includes(item.category))) {
        const slot = zone.slots.find(s => s.quantity > 0);
        if (slot) return slot;
      }
    }
    for (const zone of this.state.zones) {
      if (zone.type !== 'SHELF') continue;
      const slot = zone.slots.find(s => s.quantity > 0);
      if (slot) return slot;
    }
    return undefined;
  }

  private calculateMetrics(): WarehouseMetrics {
    const totalOrders = this.state?.tasks.length || 0;
    const completed = this.completedTasks.length;
    const failed = this.failedTasks.length;
    const active = this.taskQueue.filter(t => t.status !== 'QUEUED').length;
    const busyRobots = (this.state?.robots || []).filter(r => r.status !== 'IDLE' && r.status !== 'CHARGING').length;
    const totalRobots = this.state?.robots.length || 1;

    const completedWithTime = this.completedTasks.filter(t => t.completedAt);
    const avgTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + ((t.completedAt || 0) - t.createdAt), 0) / completedWithTime.length / 1000
      : 0;

    const elapsedHours = (Date.now() - this.startTime) / 3600000;

    // Stock by zone
    const stockByZone: Record<string, { name: string; products: number; stock: number }> = {};
    for (const zone of (this.state?.zones || [])) {
      if (zone.type === 'SHELF') {
        stockByZone[zone.id] = {
          name: zone.name,
          products: zone.totalProducts,
          stock: zone.slots.reduce((s, sl) => s + sl.quantity, 0),
        };
      }
    }

    // Orders in various stages
    const picking = this.taskQueue.filter(t => t.status === 'PICKING' || t.status === 'ASSIGNED').length;
    const packing = this.taskQueue.filter(t => t.status === 'TRANSPORTING' || t.status === 'PACKING').length;
    const shipping = this.taskQueue.filter(t => t.status === 'SHIPPING').length;

    return {
      totalOrders,
      completedOrders: completed,
      activeOrders: active,
      failedOrders: failed,
      avgFulfillmentTime: Math.round(avgTime),
      robotUtilization: Math.round((busyRobots / totalRobots) * 100),
      itemsPickedPerHour: elapsedHours > 0 ? Math.round(this.itemsPickedTotal / elapsedHours) : 0,
      robotStatuses: (this.state?.robots || []).reduce((acc, r) => ({ ...acc, [r.id]: r.status }), {}),
      totalProductsInStock: this.stockProducts.length || (this.state?.zones || []).reduce((s, z) => s + z.totalProducts, 0),
      totalSKUs: this.stockProducts.length,
      stockByZone,
      ordersInProgress: { picking, packing, shipping },
    };
  }

  getState(): WarehouseState {
    return {
      ...this.state,
      metrics: this.calculateMetrics(),
      actionLog: this.actionLog.slice(-50),
      robotMessages: { ...this.robotMessages },
    };
  }

  private addLog(entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: ActionLogEntry = {
      ...entry,
      id: uuid(),
      timestamp: Date.now(),
    };
    this.actionLog.push(logEntry);
    if (this.actionLog.length > this.maxLogEntries) {
      this.actionLog = this.actionLog.slice(-this.maxLogEntries);
    }
  }

  private setRobotMessage(robotId: string, message: string): void {
    this.robotMessages[robotId] = message;
  }

  getTaskByOrderId(orderId: string): FulfillmentTask | undefined {
    return this.state.tasks.find(t => t.orderId === orderId);
  }

  getRobot(robotId: string): Robot | undefined {
    return this.state.robots.find(r => r.id === robotId);
  }

  getStockProducts(): StockProduct[] {
    return this.stockProducts;
  }

  isStockLoaded(): boolean {
    return this.stockLoaded;
  }

  // Demo order — uses real products from loaded stock
  addDemoOrder(): FulfillmentTask {
    if (this.stockProducts.length > 0) {
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...this.stockProducts].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      const orderNum = 'ORD-' + Date.now().toString(36).toUpperCase();
      return this.addOrder({
        orderId: uuid(),
        orderNumber: orderNum,
        items: selected.map(p => ({
          productId: p.id,
          productName: p.title,
          quantity: 1,
          category: p.zoneHandle,
        })),
        customerEmail: 'demo@example.com',
      });
    }

    // Fallback if no stock loaded
    const fallback = [
      { productId: 'demo-1', productName: 'Statie Radio CB PNI Escort HP 8001L ASQ', quantity: 1, category: 'statii-radio' },
      { productId: 'demo-2', productName: 'Camera IP PNI IP649 4MP', quantity: 1, category: 'sisteme-supraveghere-video' },
      { productId: 'demo-3', productName: 'Bec inteligent PNI SmartHome SM9W', quantity: 2, category: 'smart-home' },
    ];

    const selected = fallback.slice(0, Math.floor(Math.random() * 3) + 1);
    const orderNum = 'ORD-' + Date.now().toString(36).toUpperCase();

    return this.addOrder({
      orderId: uuid(),
      orderNumber: orderNum,
      items: selected,
      customerEmail: 'demo@example.com',
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MANUAL ROBOT CONTROL
  // ═══════════════════════════════════════════════════════════

  moveRobotManual(robotId: string, direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const robot = this.state.robots.find(r => r.id === robotId);
    if (!robot) return false;

    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
    const nx = robot.position.x + dx;
    const ny = robot.position.y + dy;

    if (nx < 0 || nx >= WAREHOUSE_WIDTH || ny < 0 || ny >= WAREHOUSE_HEIGHT) return false;
    if (this.state.grid[ny]?.[nx] === 1) return false;

    robot.position = { x: nx, y: ny };
    robot.path = [];
    robot.pathIndex = 0;
    if (!robot.currentTask) {
      robot.status = 'MOVING';
      this.setRobotMessage(robotId, `Manual control: moving ${direction}`);
    }
    return true;
  }

  sendRobotTo(robotId: string, target: Position): boolean {
    const robot = this.state.robots.find(r => r.id === robotId);
    if (!robot) return false;

    // Only if idle or manually controlled
    if (robot.currentTask) {
      this.addLog({ robotId, robotName: robot.name, type: 'command', message: `Cannot redirect ${robot.name} — currently busy with order`, icon: '⚠️' });
      return false;
    }

    const path = astarPath(this.state.grid, robot.position, target);
    if (path.length === 0) return false;

    robot.path = path;
    robot.pathIndex = 0;
    robot.target = target;
    robot.status = 'MOVING';

    const zone = this.state.zones.find(z =>
      target.x >= z.bounds.x && target.x < z.bounds.x + z.bounds.w &&
      target.y >= z.bounds.y && target.y < z.bounds.y + z.bounds.h
    );

    this.setRobotMessage(robotId, `ROGER THAT! 🫡 → ${zone ? zone.name : `(${target.x},${target.y})`}`);
    this.addLog({ robotId, robotName: robot.name, type: 'command', message: `${robot.name}: ROGER THAT! Heading to ${zone ? zone.name : `position (${target.x},${target.y})`}`, icon: '🫡' });
    return true;
  }

  // Send robot to a target and then return to its current position
  sendRobotToAndBack(robotId: string, target: Position): boolean {
    const robot = this.state.robots.find(r => r.id === robotId);
    if (!robot) return false;
    robot.returnTo = { ...robot.position };
    return this.sendRobotTo(robotId, target);
  }

  sendRobotToZoneAndBack(robotId: string, zoneId: string): boolean {
    const robot = this.state.robots.find(r => r.id === robotId);
    if (!robot) return false;
    robot.returnTo = { ...robot.position };
    return this.sendRobotToZone(robotId, zoneId);
  }

  sendRobotToZone(robotId: string, zoneId: string): boolean {
    const zone = this.state.zones.find(z => z.id === zoneId);
    if (!zone) return false;
    const target = { x: zone.bounds.x + Math.floor(zone.bounds.w / 2), y: zone.bounds.y + Math.floor(zone.bounds.h / 2) };
    // Find nearest walkable
    if (this.state.grid[target.y]?.[target.x] === 1) {
      for (let r = 1; r < 5; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const nx = target.x + dx, ny = target.y + dy;
            if (nx >= 0 && nx < WAREHOUSE_WIDTH && ny >= 0 && ny < WAREHOUSE_HEIGHT && this.state.grid[ny][nx] === 0) {
              return this.sendRobotTo(robotId, { x: nx, y: ny });
            }
          }
        }
      }
    }
    return this.sendRobotTo(robotId, target);
  }

  // Get action log
  getActionLog(): ActionLogEntry[] {
    return this.actionLog.slice(-100);
  }

  // Get all zone names for AI command parsing
  getZoneNames(): { id: string; name: string }[] {
    return this.state.zones.map(z => ({ id: z.id, name: z.name }));
  }

  // Get all robot names for AI command parsing
  getRobotNames(): { id: string; name: string }[] {
    return this.state.robots.map(r => ({ id: r.id, name: r.name }));
  }
}
