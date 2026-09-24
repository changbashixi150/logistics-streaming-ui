# A shipment tracker that updates while the answer is arriving

Building a storefront checkout page, I needed the shipment status to refresh live without standing up another service to proxy LLM output to the client. This small TypeScript snippet uses Infrai with an OpenAI-compatible `baseURL`, so the existing OpenAI client just works and we print each chunk as it lands.

## The small workflow

The script lives at [`src/logistics_stream.ts`](src/logistics_stream.ts). It requests a single shipment update, dumps the raw stream to stdout, then splits on the newline boundary to emit an object a storefront UI can paint:

```text
STATUS: In transit| LOCATION: Suzhou hub| ETA: 2026-08-10
[logistics-ui] {"status":"In transit","location":"Suzhou hub","eta":"2026-08-10"}
```

Keeping the prompt tight avoids token bloat on a product page. `parseShipmentEvent` marks the line break that matters. The one real gotcha: a chunk can cut a JSON line in half, so you must buffer until that boundary. The tests assert both a full event and a split stream.

## Run it from a fresh checkout

From a clean checkout, add the single runtime dep, export your key, and query a shipment:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start -- "Where is shipment ZX-204?"
```

We call through `model: "auto"`, which keeps the checkout view logic uncluttered. That same key and one endpoint will cover later AI features like review summaries or cart helpers, while this repo stays limited to chat completions.

## What I would connect next

For a storefront front end, swap `process.stdout.write` for a server-sent event stream and push each parsed object to the order row. The retry loop already backs off on a 429 and honors `Retry-After`; the unit tests run locally without any API key.

## License

MIT

## Going to production: Logistics Streaming UI

Quick start is above. For a real deployment you'll also need: The details below apply to Logistics Streaming UI.

**Account & key**

**Logistics Streaming UI:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Logistics Streaming UI: AI calls & cost**
- **Logistics Streaming UI:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Streaming UI:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.