// CarphaCom Digital Twin — Main Server
// Express + Socket.IO + Warehouse Engine + Gemini AI

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Warehouse, type WarehouseState, type FulfillmentTask } from './warehouse.js';
import { GeminiService } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const PORT = parseInt(process.env.PORT || '4000');
const TICK_INTERVAL = parseInt(process.env.TICK_INTERVAL || '500'); // ms between ticks
const ROBOT_COUNT = parseInt(process.env.ROBOT_COUNT || '4');
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const DEMO_MODE = process.env.DEMO_MODE === 'true'; // Demo off by default — real orders only
const DB_URL = process.env.DATABASE_URL || 'postgresql://medusa:YOUR_DB_PASSWORD@localhost:5432/medusa_store';

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

const warehouse = new Warehouse(ROBOT_COUNT);
const gemini = new GeminiService();

// ═══════════════════════════════════════════════════════════
// MEDUSA FULFILLMENT CALLBACK
// ═══════════════════════════════════════════════════════════

// When a task is completed by a robot, notify Medusa to create a fulfillment
warehouse.onTaskComplete(async (task) => {
  // Skip demo orders (they don't exist in Medusa)
  if (!task.orderId.startsWith('order_')) {
    console.log(`📦 [Demo] Task ${task.id} completed for demo order ${task.orderNumber} — skipping Medusa callback`);
    return;
  }

  console.log(`📦 Task ${task.id} completed for order ${task.orderId} — notifying Medusa...`);

  try {
    const robot = task.assignedRobot ? warehouse.getRobot(task.assignedRobot) : null;

    const response = await fetch(`${MEDUSA_URL}/warehouse-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: task.orderId,
        status: 'COMPLETED',
        taskId: task.id,
        robotName: robot?.name || 'AGV',
        completedAt: task.completedAt,
        items: task.items.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          picked: i.picked,
        })),
      }),
    });

    const result = await response.json() as any;

    if (response.ok) {
      console.log(`✅ Medusa fulfillment created: ${result.fulfillmentId || 'OK'} for order ${task.orderId}`);
      io.emit('fulfillmentCreated', {
        orderId: task.orderId,
        orderNumber: task.orderNumber,
        fulfillmentId: result.fulfillmentId,
        timestamp: Date.now(),
      });
    } else {
      console.error(`❌ Medusa callback failed (${response.status}):`, result.error || result);
    }
  } catch (error: any) {
    console.error(`❌ Failed to notify Medusa for order ${task.orderId}:`, error.message);
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ═══════════════════════════════════════════════════════════
// REST API
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'CarphaCom Digital Twin',
    version: '2.0.0',
    uptime: process.uptime(),
    geminiEnabled: gemini.isEnabled(),
    stockLoaded: warehouse.isStockLoaded(),
    totalProducts: warehouse.getStockProducts().length,
  });
});

// Get current warehouse state
app.get('/api/warehouse/state', (_req, res) => {
  res.json(warehouse.getState());
});

// Get metrics
app.get('/api/warehouse/metrics', (_req, res) => {
  res.json(warehouse.getState().metrics);
});

// Add order from Medusa webhook
app.post('/api/warehouse/order', async (req, res) => {
  try {
    const { orderId, orderNumber, items, customerEmail } = req.body;
    
    if (!orderId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid order data. Required: orderId, items[]' });
    }

    const task = warehouse.addOrder({
      orderId,
      orderNumber,
      items: items.map((item: any) => ({
        productId: item.product_id || item.productId || 'unknown',
        productName: item.title || item.productName || 'Unknown Product',
        quantity: item.quantity || 1,
        category: item.category || undefined,
      })),
      customerEmail,
    });

    // Notify connected dashboards
    io.emit('newOrder', { task, timestamp: Date.now() });

    console.log(`📦 New order received: ${orderNumber || orderId} (${items.length} items)`);
    res.json({ success: true, taskId: task.id, status: task.status });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get order tracking status
app.get('/api/warehouse/order/:orderId', (req, res) => {
  const task = warehouse.getTaskByOrderId(req.params.orderId);
  if (!task) {
    return res.status(404).json({ error: 'Order not found in warehouse' });
  }

  const robot = task.assignedRobot ? warehouse.getRobot(task.assignedRobot) : null;

  res.json({
    orderId: task.orderId,
    orderNumber: task.orderNumber,
    status: task.status,
    items: task.items.map(i => ({
      productName: i.productName,
      quantity: i.quantity,
      picked: i.picked,
    })),
    robot: robot ? { name: robot.name, status: robot.status, position: robot.position } : null,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  });
});

// Stock products list
app.get('/api/warehouse/stock', (_req, res) => {
  const products = warehouse.getStockProducts();
  const state = warehouse.getState();
  const zoneStock = state.zones
    .filter(z => z.type === 'SHELF')
    .map(z => ({
      zoneId: z.id,
      zoneName: z.name,
      category: z.category,
      totalProducts: z.totalProducts,
      totalStock: z.slots.reduce((s, sl) => s + sl.quantity, 0),
      slots: z.slots.map(s => ({
        id: s.id,
        productName: s.productName,
        productId: s.productId,
        quantity: s.quantity,
        sku: s.sku,
        thumbnail: s.thumbnail,
      })),
    }));
  res.json({
    totalProducts: products.length,
    stockLoaded: warehouse.isStockLoaded(),
    zones: zoneStock,
  });
});

// Stock reload
app.post('/api/warehouse/stock/reload', async (_req, res) => {
  try {
    await warehouse.loadStock(DB_URL);
    res.json({ success: true, totalProducts: warehouse.getStockProducts().length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Copilot endpoint
app.post('/api/ai/copilot', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question required' });
  }

  const answer = await gemini.warehouseCopilot(question, warehouse.getState());
  res.json({ answer, model: 'gemini-2.5-pro' });
});

// AI Performance Report
app.get('/api/ai/report', async (_req, res) => {
  const report = await gemini.generatePerformanceReport(warehouse.getState());
  res.json({ report, generatedAt: new Date().toISOString() });
});

// AI Anomaly Detection
app.get('/api/ai/anomalies', async (_req, res) => {
  const result = await gemini.detectAnomalies(warehouse.getState());
  res.json(result);
});

// Audio transcription via Gemini
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    const transcript = await gemini.transcribeAudio(audio, mimeType || 'audio/webm');
    res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Dashboard page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ═══════════════════════════════════════════════════════════
// WEBSOCKET (Real-time updates)
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`🔌 Dashboard connected: ${socket.id}`);

  // Send initial state
  socket.emit('warehouseState', warehouse.getState());

  // Handle copilot questions via socket
  socket.on('copilotQuestion', async (data: { question: string }) => {
    const answer = await gemini.warehouseCopilot(data.question, warehouse.getState());
    socket.emit('copilotAnswer', { question: data.question, answer });
  });

  // Handle manual order trigger
  socket.on('addDemoOrder', () => {
    const task = warehouse.addDemoOrder();
    io.emit('newOrder', { task, timestamp: Date.now() });
    console.log(`📦 Demo order added: ${task.orderNumber}`);
  });

  // Handle manual robot movement (joystick)
  socket.on('moveRobot', (data: { robotId: string; direction: 'up' | 'down' | 'left' | 'right' }) => {
    const success = warehouse.moveRobotManual(data.robotId, data.direction);
    socket.emit('moveResult', { success, robotId: data.robotId, direction: data.direction });
  });

  // Handle send robot to position
  socket.on('sendRobotTo', (data: { robotId: string; x: number; y: number }) => {
    const success = warehouse.sendRobotTo(data.robotId, { x: data.x, y: data.y });
    socket.emit('commandResult', { success, robotId: data.robotId, target: { x: data.x, y: data.y } });
  });

  // Handle send robot to zone
  socket.on('sendRobotToZone', (data: { robotId: string; zoneId: string }) => {
    const success = warehouse.sendRobotToZone(data.robotId, data.zoneId);
    socket.emit('commandResult', { success, robotId: data.robotId, zoneId: data.zoneId });
  });

  // Handle AI robot command (natural language)
  socket.on('aiRobotCommand', async (data: { command: string }) => {
    const robots = warehouse.getRobotNames();
    const zones = warehouse.getZoneNames();
    const state = warehouse.getState();

    // Use Gemini to parse the command
    const systemPrompt = `You are a warehouse robot command parser. Parse the user command and return a JSON object.
Available robots: ${robots.map(r => r.name).join(', ')}
Available zones: ${zones.map(z => `${z.name} (${z.id})`).join(', ')}
Current robot statuses: ${state.robots.map(r => `${r.name}: ${r.status} at (${r.position.x},${r.position.y})`).join(', ')}

IMPORTANT: The robot names are: Octobot, Marcobot, Cyberbot, Vegbot. Match what the user says even if slightly different (e.g. "veg bot" = "Vegbot", "marco" = "Marcobot", "cyber" = "Cyberbot", "octo" = "Octobot").

Return JSON with ONE of these actions:
- {"action": "sendToZone", "robotName": "Vegbot", "zoneId": "zone-radio", "returnAfter": false, "response": "Roger that! Sending Vegbot to Radio zone"}
- {"action": "sendToPosition", "robotName": "Octobot", "x": 10, "y": 5, "returnAfter": false, "response": "Roger that! Sending Octobot to position"}
- {"action": "sendToZoneAndBack", "robotName": "Cyberbot", "zoneId": "zone-radio", "response": "Roger that! Sending Cyberbot to Radio zone and back"}
- {"action": "addOrder", "response": "Creating a new demo order"}
- {"action": "status", "response": "describe current status"}

If the user says "go and come back", "go check and return", "go there and back", or similar round-trip commands, use "sendToZoneAndBack" action.
If you can't parse the command, return {"action": "chat", "response": "your helpful response"}`;

    try {
      const answer = await gemini.parseCommand(systemPrompt + '\n\nUser command: ' + data.command);
      
      // Try to parse AI response as JSON
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (parsed.action === 'sendToZone' && parsed.robotName && parsed.zoneId) {
            const robot = state.robots.find(r => r.name.toLowerCase() === parsed.robotName.toLowerCase());
            if (robot) {
              warehouse.sendRobotToZone(robot.id, parsed.zoneId);
              socket.emit('copilotAnswer', { question: data.command, answer: parsed.response || `🫡 ROGER THAT! Sending ${robot.name} to ${parsed.zoneId}` });
              return;
            }
          }

          if ((parsed.action === 'sendToZoneAndBack') && parsed.robotName && parsed.zoneId) {
            const robot = state.robots.find(r => r.name.toLowerCase() === parsed.robotName.toLowerCase());
            if (robot) {
              warehouse.sendRobotToZoneAndBack(robot.id, parsed.zoneId);
              socket.emit('copilotAnswer', { question: data.command, answer: parsed.response || `🫡 ROGER THAT! Sending ${robot.name} to ${parsed.zoneId} and back` });
              return;
            }
          }
          
          if (parsed.action === 'sendToPosition' && parsed.robotName && parsed.x !== undefined) {
            const robot = state.robots.find(r => r.name.toLowerCase() === parsed.robotName.toLowerCase());
            if (robot) {
              if (parsed.returnAfter) {
                warehouse.sendRobotToAndBack(robot.id, { x: parsed.x, y: parsed.y });
              } else {
                warehouse.sendRobotTo(robot.id, { x: parsed.x, y: parsed.y });
              }
              socket.emit('copilotAnswer', { question: data.command, answer: parsed.response || `🫡 ROGER THAT! Sending ${robot.name} to (${parsed.x},${parsed.y})` });
              return;
            }
          }
          
          if (parsed.action === 'addOrder') {
            const task = warehouse.addDemoOrder();
            io.emit('newOrder', { task, timestamp: Date.now() });
            socket.emit('copilotAnswer', { question: data.command, answer: parsed.response || `Order created: ${task.orderNumber}` });
            return;
          }

          socket.emit('copilotAnswer', { question: data.command, answer: parsed.response || answer });
        } catch {
          socket.emit('copilotAnswer', { question: data.command, answer });
        }
      } else {
        socket.emit('copilotAnswer', { question: data.command, answer });
      }
    } catch {
      socket.emit('copilotAnswer', { question: data.command, answer: 'AI command processing failed. Try: "Send Vegbot to zone A"' });
    }
  });

  // Handle route optimization request
  socket.on('optimizeRoute', async (data: { robotId: string }) => {
    const robot = warehouse.getRobot(data.robotId);
    if (robot && robot.currentTask) {
      const items = robot.currentTask.items
        .filter(i => !i.picked)
        .map(i => {
          const zone = warehouse.getState().zones.find(z => 
            z.slots.some(s => s.id === i.slotId)
          );
          const slot = zone?.slots.find(s => s.id === i.slotId);
          return {
            productName: i.productName,
            slotPosition: slot?.position || { x: 0, y: 0 },
            zoneId: zone?.id || '',
          };
        });

      const result = await gemini.optimizePickingRoute(robot, items, warehouse.getState().zones);
      socket.emit('routeOptimized', { robotId: data.robotId, ...result });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Dashboard disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════════
// SIMULATION LOOP
// ═══════════════════════════════════════════════════════════

let tickCount = 0;

const simulationLoop = setInterval(() => {
  const state = warehouse.tick();
  tickCount++;

  // Broadcast state to all connected dashboards
  io.emit('warehouseState', state);

  // Demo mode: add random orders periodically
  if (DEMO_MODE && tickCount % 40 === 0) { // Every ~20 seconds
    const task = warehouse.addDemoOrder();
    io.emit('newOrder', { task, timestamp: Date.now() });
    console.log(`📦 [Demo] Auto-order: ${task.orderNumber} (${task.items.length} items)`);
  }

  // AI anomaly check every 60 ticks (~30s)
  if (tickCount % 60 === 0) {
    gemini.detectAnomalies(state).then(result => {
      if (result.anomalies.length > 0) {
        io.emit('anomalies', result);
        console.log(`⚠️  Anomalies detected (${result.severity}):`, result.anomalies);
      }
    });
  }
}, TICK_INTERVAL);

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

// Load stock from DB before starting
(async () => {
  console.log('⏳ Loading real product stock from Medusa database...');
  await warehouse.loadStock(DB_URL);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           CarphaCom Digital Twin Warehouse v2            ║');
    console.log('║      AI-Powered Robotic Order Fulfillment               ║');
    console.log('║      Real Products • Real Stock • Real Categories       ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Dashboard:    http://localhost:${PORT}                 ║`);
    console.log(`║  📡 API:          http://localhost:${PORT}/api             ║`);
    console.log(`║  🔌 WebSocket:    ws://localhost:${PORT}                   ║`);
    console.log(`║  🤖 Robots:       ${ROBOT_COUNT} AGV units                            ║`);
    console.log(`║  🧠 Gemini AI:    ${gemini.isEnabled() ? 'ENABLED ✅' : 'DISABLED ❌'}                         ║`);
    console.log(`║  🎮 Demo Mode:    ${DEMO_MODE ? 'ON' : 'OFF'}                                ║`);
    console.log(`║  ⏱️  Tick Rate:    ${TICK_INTERVAL}ms                              ║`);
    console.log(`║  📦 Products:     ${warehouse.getStockProducts().length} loaded from DB               ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  });
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  clearInterval(simulationLoop);
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  clearInterval(simulationLoop);
  httpServer.close();
  process.exit(0);
});
