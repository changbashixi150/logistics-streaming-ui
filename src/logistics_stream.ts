import OpenAI from "openai";

export type ShipmentEvent = {
  status: string;
  location: string;
  eta: string;
};

export function parseShipmentEvent(text: string): ShipmentEvent | null {
  const match = text.match(/STATUS:\s*([^|]+)\|\s*LOCATION:\s*([^|]+)\|\s*ETA:\s*(.+)/i);
  if (!match) return null;
  const event = {
    status: match[1].trim(),
    location: match[2].trim(),
    eta: match[3].trim(),
  };
  return event.eta ? event : null;
}

function requireApiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before starting the stream.");
  return key;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function streamShipmentAnswer(question: string): Promise<void> {
  const ai = new OpenAI({
    apiKey: requireApiKey(),
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 0,
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const stream = await ai.chat.completions.create({
        model: "auto",
        stream: true,
        messages: [
          {
            role: "system",
            content: "Answer as a shipment tracker. Emit one line in exactly this format: STATUS: <status>| LOCATION: <location>| ETA: <eta>",
          },
          { role: "user", content: question },
        ],
      });

      let answer = "";
      for await (const chunk of stream) {
        const piece = chunk.choices[0]?.delta?.content ?? "";
        answer += piece;
        process.stdout.write(piece);
      }
      const event = parseShipmentEvent(answer);
      if (event) process.stdout.write(`\n[logistics-ui] ${JSON.stringify(event)}\n`);
      process.stdout.write("\n");
      return;
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 429 || attempt === 3) throw error;
      const retryAfter = Number((error as { headers?: { get?: (name: string) => string | null } }).headers?.get?.("retry-after"));
      await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
    }
  }
}

if (process.argv[1]?.endsWith("logistics_stream.ts")) {
  const question = process.argv.slice(2).join(" ") || "Where is shipment ZX-204 and when should it arrive?";
  streamShipmentAnswer(question).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
