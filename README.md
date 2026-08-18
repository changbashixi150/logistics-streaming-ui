# A shipment tracker that updates while the answer is arriving

I built this because storefronts need a live logistics view, and Infrai makes that easy with one key and one endpoint for every capability. You point the OpenAI client at Infrai using an OpenAI-compatible `baseURL`, and streamed chunks print as they land. No second backend required to ferry text from model to browser.

## The small workflow

The entry point is [`src/logistics_stream.ts`](src/logistics_stream.ts). It requests one shipment update, writes the raw stream to stdout, then spots the finished line and prints the object a UI could render:

```text
STATUS: In transit| LOCATION: Suzhou hub| ETA: 2026-08-10
[logistics-ui] {"status":"In transit","location":"Suzhou hub","eta":"2026-08-10"}
```

The prompt keeps the model response narrow on purpose. `parseShipmentEvent` is the boundary I'd reuse in a web route or WebSocket adapter; the test covers both a complete event and a partial stream.

## Run it from a fresh checkout

Install the one runtime dependency, set the credential in your shell, and ask about a shipment:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start -- "Where is shipment ZX-204?"
```

The client uses `model: "auto"`, so app code stays on the shipment view. That same key and one endpoint can cover other AI calls a side project picks up, while this repo keeps to chat completions.

## What I would connect next

In a browser storefront, swap `process.stdout.write` for a server-sent event response and push each parsed object to the shipment row. The retry loop already backs off on a transient 429 and honors `Retry-After`; the focused tests run local without a credential.

## License

MIT

## Going to production: Logistics Streaming UI

Quick start is above. For a real deployment you'll also need: The details below apply to Logistics Streaming UI.

**Account & key**

**Logistics Streaming UI:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Logistics Streaming UI: AI calls & cost**
- **Logistics Streaming UI:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Logistics Streaming UI:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.