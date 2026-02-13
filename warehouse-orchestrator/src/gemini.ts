// CarphaCom Digital Twin — Gemini AI Integration
// Uses Gemini Flash for real-time robot routing, Gemini Pro for warehouse copilot

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { WarehouseState, FulfillmentTask, Robot, Position, Zone } from './warehouse.js';

// ═══════════════════════════════════════════════════════════
// GEMINI AI SERVICE
// ═══════════════════════════════════════════════════════════

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;  // Fast routing/decisions
  private proModel: GenerativeModel;    // Deep analysis/copilot
  private enabled = false;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.proModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.enabled = true;
      console.log('🤖 Gemini AI initialized (Flash 2.0 + Flash 2.5)');
    } else {
      this.genAI = null as any;
      this.flashModel = null as any;
      this.proModel = null as any;
      console.log('⚠️  Gemini AI disabled (no API key). Set GEMINI_API_KEY env var.');
    }
  }

  isEnabled(): boolean { return this.enabled; }

  // ─────────────────────────────────────────────────────
  // FLASH: Real-time Robot Route Optimization
  // ─────────────────────────────────────────────────────

  async optimizePickingRoute(
    robot: Robot,
    items: { productName: string; slotPosition: Position; zoneId: string }[],
    warehouseLayout: Zone[]
  ): Promise<{ optimizedOrder: number[]; reasoning: string }> {
    if (!this.enabled) {
      return { optimizedOrder: items.map((_, i) => i), reasoning: 'AI disabled — using default order' };
    }

    try {
      const prompt = `You are a warehouse robot route optimizer. Given a robot position and items to pick, determine the optimal picking order to minimize travel distance.

Robot current position: (${robot.position.x}, ${robot.position.y})
Robot battery: ${robot.battery}%

Items to pick:
${items.map((item, i) => `${i}: "${item.productName}" at position (${item.slotPosition.x}, ${item.slotPosition.y}) in ${item.zoneId}`).join('\n')}

Warehouse zones:
${warehouseLayout.filter(z => z.type === 'SHELF').map(z => `${z.name}: (${z.bounds.x},${z.bounds.y}) size ${z.bounds.w}x${z.bounds.h}`).join('\n')}

Respond with JSON only: { "optimizedOrder": [indices], "reasoning": "brief explanation" }`;

      const result = await this.flashModel.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Gemini Flash route error:', error);
    }

    return { optimizedOrder: items.map((_, i) => i), reasoning: 'Fallback — sequential order' };
  }

  // ─────────────────────────────────────────────────────
  // FLASH: Task Priority Scoring
  // ─────────────────────────────────────────────────────

  async prioritizeTasks(
    tasks: FulfillmentTask[],
    robots: Robot[]
  ): Promise<{ taskPriorities: { taskId: string; priority: number; assignToRobot?: string }[]; reasoning: string }> {
    if (!this.enabled || tasks.length === 0) {
      return { taskPriorities: tasks.map(t => ({ taskId: t.id, priority: 1 })), reasoning: 'No AI or no tasks' };
    }

    try {
      const prompt = `As a warehouse AI, prioritize these fulfillment tasks and optionally assign them to available robots.

Tasks:
${tasks.map(t => `- ID: ${t.id.slice(0, 8)}, Items: ${t.items.length}, Status: ${t.status}, Age: ${Math.round((Date.now() - t.createdAt) / 1000)}s`).join('\n')}

Available Robots:
${robots.map(r => `- ${r.name}: status=${r.status}, battery=${r.battery}%, pos=(${r.position.x},${r.position.y})`).join('\n')}

Respond with JSON only: { "taskPriorities": [{ "taskId": "...", "priority": 1-10, "assignToRobot": "robot-id or null" }], "reasoning": "brief" }`;

      const result = await this.flashModel.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Gemini Flash priority error:', error);
    }

    return { taskPriorities: tasks.map(t => ({ taskId: t.id, priority: 1 })), reasoning: 'Fallback' };
  }

  // ─────────────────────────────────────────────────────
  // PRO: Warehouse Copilot Chat
  // ─────────────────────────────────────────────────────

  async warehouseCopilot(
    question: string,
    state: WarehouseState
  ): Promise<string> {
    if (!this.enabled) {
      return 'AI copilot is disabled. Please set the GEMINI_API_KEY environment variable.';
    }

    try {
      const stateSnapshot = {
        tick: state.tick,
        robots: state.robots.map(r => ({
          name: r.name,
          status: r.status,
          battery: Math.round(r.battery),
          position: r.position,
          carrying: r.itemsCarried,
        })),
        metrics: state.metrics,
        activeTasks: state.tasks.filter(t => t.status !== 'COMPLETED').map(t => ({
          orderId: t.orderId,
          orderNumber: t.orderNumber,
          status: t.status,
          items: t.items.length,
          pickedItems: t.items.filter(i => i.picked).length,
        })),
        zones: state.zones.map(z => ({ name: z.name, type: z.type, category: z.category })),
      };

      const prompt = `You are the AI Copilot for CarphaCom Digital Twin, a warehouse robotics digital twin system for a Romanian electronics e-commerce store (CB radios, antennas, security systems, IoT devices). Answer in a helpful and concise manner. Use Romanian if the user asks in Romanian.

Current Warehouse State:
${JSON.stringify(stateSnapshot, null, 2)}

User Question: ${question}

Provide actionable insights, performance analysis, or recommendations. If asked about optimizations, suggest specific improvements. Keep response under 300 words.`;

      const result = await this.proModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini Pro copilot error:', error);
      return `Error communicating with AI: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // ─────────────────────────────────────────────────────
  // PRO: Performance Report Generation
  // ─────────────────────────────────────────────────────

  async generatePerformanceReport(state: WarehouseState): Promise<string> {
    if (!this.enabled) return 'AI disabled';

    try {
      const prompt = `Generate a brief warehouse performance report for CarphaCom Digital Twin.

Metrics:
- Total Orders: ${state.metrics.totalOrders}
- Completed: ${state.metrics.completedOrders}
- Active: ${state.metrics.activeOrders}
- Avg Fulfillment Time: ${state.metrics.avgFulfillmentTime}s
- Robot Utilization: ${state.metrics.robotUtilization}%
- Items Picked/Hour: ${state.metrics.itemsPickedPerHour}
- Simulation Tick: ${state.tick}

Robots:
${state.robots.map(r => `${r.name}: ${r.status}, battery ${Math.round(r.battery)}%`).join('\n')}

Generate a 3-paragraph performance report with: (1) current status summary, (2) efficiency analysis, (3) optimization recommendations. Use professional tone.`;

      const result = await this.proModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      return `Report generation failed: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
  }

  // ─────────────────────────────────────────────────────
  // FLASH: Anomaly Detection
  // ─────────────────────────────────────────────────────

  async detectAnomalies(state: WarehouseState): Promise<{ anomalies: string[]; severity: 'low' | 'medium' | 'high' }> {
    // Quick rule-based checks (no API call needed)
    const anomalies: string[] = [];

    const lowBatteryRobots = state.robots.filter(r => r.battery < 20 && r.status !== 'CHARGING');
    if (lowBatteryRobots.length > 0) {
      anomalies.push(`${lowBatteryRobots.length} robot(s) with critically low battery`);
    }

    const stuckRobots = state.robots.filter(r => r.status === 'MOVING' && r.path.length === 0);
    if (stuckRobots.length > 0) {
      anomalies.push(`${stuckRobots.length} robot(s) stuck without path`);
    }

    const oldTasks = state.tasks.filter(t => t.status === 'QUEUED' && Date.now() - t.createdAt > 60000);
    if (oldTasks.length > 0) {
      anomalies.push(`${oldTasks.length} orders waiting > 60s for fulfillment`);
    }

    if (state.metrics.robotUtilization < 20 && state.metrics.activeOrders > 0) {
      anomalies.push('Low robot utilization despite active orders');
    }

    const severity = anomalies.length > 3 ? 'high' : anomalies.length > 1 ? 'medium' : 'low';

    return { anomalies, severity };
  }

  // ─────────────────────────────────────────────────────
  // FLASH: Fast Command Parsing (JSON extraction)
  // ─────────────────────────────────────────────────────

  async parseCommand(prompt: string): Promise<string> {
    if (!this.enabled) return '{"action":"chat","response":"AI disabled"}';
    try {
      const result = await this.flashModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
        },
      });
      return result.response.text();
    } catch (error) {
      console.error('Gemini parseCommand error:', error);
      return '{"action":"chat","response":"Command parsing failed"}';
    }
  }

  // ─────────────────────────────────────────────────────
  // FLASH: Audio Transcription (Speech-to-Text)
  // ─────────────────────────────────────────────────────

  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    if (!this.enabled) {
      return '';
    }

    try {
      const result = await this.flashModel.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64,
          },
        },
        { text: 'Transcribe this audio exactly. Return ONLY the spoken words, nothing else. No quotes, no explanation, no punctuation descriptions. If the audio is silent or unclear, return "SILENT".' },
      ]);
      const text = result.response.text().trim();
      console.log(`🎤 Gemini transcription: "${text}"`);
      return text;
    } catch (error) {
      console.error('Gemini transcription error:', error);
      return '';
    }
  }
}
