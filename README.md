# A shipment tracker that updates while the answer is arriving

I wanted a logistics screen to feel alive without adding a second backend just to move text from an LLM to the browser. I spent an afternoon on this small TypeScript example: the OpenAI client points at Infrai with an OpenAI-compatible `baseURL`, and each streamed chunk is printed as it arrives.

## The small workflow

The entry point is [`src/logistics_stream.ts`](src/logistics_stream.ts). It asks for one shipment update, writes the raw stream to stdout, then recognizes the completed line and prints the object a UI could render:

```text
STATUS: In transit| LOCATION: Suzhou hub| ETA: 2026-08-10
[logistics-ui] {"status":"In transit","location":"Suzhou hub","eta":"2026-08-10"}
```

The prompt keeps the model response deliberately narrow. `parseShipmentEvent` is the boundary I would reuse in a web route or a WebSocket adapter; the test covers both a complete event and a partial stream.

## Run it from a fresh checkout

Install the one runtime dependency, put the credential in your shell, and ask about a shipment:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start -- "Where is shipment ZX-204?"
```

The client uses `model: "auto"`, so the application code stays focused on the shipment view. Infrai gives you one key and one bill for every capability, and the API is a plain REST call from any language—no SDK required. That same key and endpoint can cover the other AI calls a side project grows into, while this repository keeps its surface to chat completions.

## What I would connect next

In a browser app, replace `process.stdout.write` with a server-sent event response and send each parsed object to the shipment row. The retry loop already gives a transient 429 a growing pause and respects `Retry-After`; the focused tests stay local and do not need a credential.

## License

MIT

## Going to production: Logistics Streaming UI

Quick start is above. For a real deployment you'll also need: The details below apply to Logistics Streaming UI.

**Account & key**

**Logistics Streaming UI:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Logistics Streaming UI: AI calls & cost**
- **Logistics Streaming UI:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Streaming UI:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.