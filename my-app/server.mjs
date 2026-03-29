import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { InferenceClient } from "@huggingface/inference";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const port = Number(env.IMAGE_API_PORT || 8787);

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(payload));
};

const getBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

const mapProviderError = (error) => {
  const rawMessage = error?.message || "Image generation failed";
  const message = rawMessage.toLowerCase();

  if (
    message.includes("invalid username or password") ||
    message.includes("authorization header is correct") ||
    message.includes("unauthorized") ||
    message.includes("authentication")
  ) {
    return {
      statusCode: 401,
      code: "HF_AUTH_INVALID",
      message:
        "Hugging Face rejected the server token for image generation. Refresh HF_TOKEN, restart the dev server, and confirm your inference provider access.",
      details: [
        "Set HF_TOKEN in my-app/.env with a valid Hugging Face User Access Token.",
        "Restart npm run dev after updating the token.",
        "Check https://hf.co/settings/inference-providers if auto-routing keeps choosing a blocked provider.",
      ],
    };
  }

  if (message.includes("model") && message.includes("loading")) {
    return {
      statusCode: 503,
      code: "HF_MODEL_LOADING",
      message:
        "The selected image model is still warming up on Hugging Face. Wait a moment and try again.",
      details: [],
    };
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return {
      statusCode: 429,
      code: "HF_RATE_LIMITED",
      message: "Hugging Face rate-limited this request. Wait a bit and try again.",
      details: [],
    };
  }

  return {
    statusCode: 500,
    code: "HF_IMAGE_FAILED",
    message: rawMessage,
    details: [],
  };
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/image/generate") {
    json(res, 404, {
      code: "NOT_FOUND",
      message: "Route not found",
    });
    return;
  }

  if (!env.HF_TOKEN?.trim()) {
    json(res, 500, {
      code: "HF_TOKEN_MISSING",
      message:
        "HF_TOKEN is missing on the server. Add it to my-app/.env and restart the dev server.",
      details: [
        "Use HF_TOKEN for the backend proxy.",
        "Do not use VITE_HF_TOKEN in the browser anymore.",
      ],
    });
    return;
  }

  try {
    const body = await getBody(req);
    const payload = JSON.parse(body || "{}");
    const { model, prompt, parameters } = payload;

    if (!model || !prompt) {
      json(res, 400, {
        code: "INVALID_REQUEST",
        message: "model and prompt are required",
      });
      return;
    }

    const client = new InferenceClient(env.HF_TOKEN.trim());
    const imageBlob = await client.textToImage({
      model,
      inputs: prompt,
      parameters,
    });
    const arrayBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    json(res, 200, {
      imageBase64,
      mimeType: imageBlob.type || "image/png",
      model,
    });
  } catch (error) {
    const mapped = mapProviderError(error);
    json(res, mapped.statusCode, mapped);
  }
});

server.listen(port, () => {
  console.log(`Image proxy listening on http://localhost:${port}`);
});
