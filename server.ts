import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
]);

const ALLOWED_IMAGE_SIZES = new Set(["1K", "2K", "4K"]);

const ALLOWED_MODELS = new Set([
  "gemini-3-pro-image-preview",
  "gemini-nano-banana-2.1",
]);

const VARIATION_DIRECTIVES = [
  {
    label: "Wide Atmospheric",
    prompt:
      "Compose an expansive atmospheric establishing view with layered depth, rich environmental lighting, and clean breathing room in the upper third suitable for a phone lock-screen clock.",
  },
  {
    label: "Intimate Texture",
    prompt:
      "Compose an intimate close-up perspective emphasizing tactile textures, reflections, light bokeh, and shallow depth of field with a dark or calm top zone for clear clock legibility.",
  },
  {
    label: "Architectural Light",
    prompt:
      "Compose a striking architectural or geometric framing with dramatic rim light, shadows, and clean leading lines flowing vertically through the frame.",
  },
  {
    label: "Minimalist Horizon",
    prompt:
      "Compose a serene, minimalist interpretation with generous negative space, soft atmospheric gradients, and refined color restraint.",
  },
];

interface GenerateOneBody {
  vibe?: string;
  aspectRatio?: string;
  imageSize?: string;
  model?: string;
  variationIndex?: number;
  remixNote?: string;
  referenceImage?: {
    data?: string;
    mimeType?: string;
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function classifyGeminiError(err: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown generation error";
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key")
  ) {
    return {
      status: 400,
      code: "API_KEY_INVALID",
      message:
        "Your Gemini API key appears invalid. Please verify or select a valid key in Settings > Secrets.",
    };
  }

  if (
    lower.includes("permission_denied") ||
    lower.includes("permission denied") ||
    lower.includes("billing") ||
    lower.includes("403")
  ) {
    return {
      status: 403,
      code: "PERMISSION_DENIED",
      message:
        "This image model requires a billing-enabled Gemini API key. Open Settings > Secrets to attach a paid API key.",
    };
  }

  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("429")
  ) {
    return {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
      message:
        "Rate limit or quota reached for this API key. Attach a billing-enabled key in Settings > Secrets or retry in a moment.",
    };
  }

  if (lower.includes("not_found") || lower.includes("404")) {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      message:
        "The selected image model was unavailable on this key. Try switching between Studio Pro and Nano Banana 2.1.",
    };
  }

  if (lower.includes("safety") || lower.includes("blocked") || lower.includes("prohibited")) {
    return {
      status: 422,
      code: "CONTENT_BLOCKED",
      message:
        "This prompt was filtered by safety policies. Try adjusting the description with different phrasing.",
    };
  }

  return {
    status: 500,
    code: "GENERATION_FAILED",
    message: rawMessage.slice(0, 260) || "Image generation failed. Please retry.",
  };
}

function buildWallpaperPrompt(
  vibe: string,
  aspectRatio: string,
  variationIndex: number,
  hasReference: boolean,
  remixNote?: string
): string {
  const directive = VARIATION_DIRECTIVES[variationIndex % VARIATION_DIRECTIVES.length];
  const framingContext =
    aspectRatio === "9:16" || aspectRatio === "2:3" || aspectRatio === "3:4"
      ? "vertical phone lock-screen wallpaper"
      : aspectRatio === "1:1"
        ? "square art wallpaper"
        : "widescreen display wallpaper";

  if (hasReference) {
    const tweak = remixNote?.trim()
      ? `Apply this specific remix direction: "${remixNote.trim()}". `
      : "";
    return (
      `Create a fresh high-craft ${framingContext} remix inspired by the attached reference image. ` +
      `Preserve the core mood, palette harmony, and aesthetic DNA of the reference while reimagining the composition for the vibe: "${vibe}". ` +
      `${tweak}` +
      `Variation angle (${directive.label}): ${directive.prompt} ` +
      `No watermarks, no UI overlays, no mock phone bezels, no text unless organically part of the scene. Edge-to-edge full-bleed artwork.`
    );
  }

  return (
    `Create a stunning, gallery-grade ${framingContext} capturing this exact vibe: "${vibe}". ` +
    `Variation angle (${directive.label}): ${directive.prompt} ` +
    `Ultra-crisp detail, cohesive atmospheric lighting, no phone frames, no UI overlays, no borders or watermarks. Edge-to-edge full-bleed artwork.`
  );
}

async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      const isTransient =
        msg.includes("503") ||
        msg.includes("unavailable") ||
        msg.includes("deadline") ||
        msg.includes("econnreset") ||
        msg.includes("500");
      if (!isTransient || attempt === 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY?.trim() &&
        process.env.GEMINI_API_KEY.trim() !== "MY_GEMINI_API_KEY"
    );
    res.json({ ok: true, apiKeyConfigured: hasKey });
  });

  app.post("/api/wallpapers/generate-one", async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as GenerateOneBody;
    const vibe = typeof body.vibe === "string" ? body.vibe.trim() : "";

    if (!vibe) {
      res.status(400).json({
        code: "INVALID_PROMPT",
        message: "Please describe a vibe before generating wallpapers.",
      });
      return;
    }

    const aspectRatio =
      typeof body.aspectRatio === "string" && ALLOWED_ASPECT_RATIOS.has(body.aspectRatio)
        ? body.aspectRatio
        : "9:16";

    const imageSize =
      typeof body.imageSize === "string" && ALLOWED_IMAGE_SIZES.has(body.imageSize)
        ? body.imageSize
        : "1K";

    const model =
      typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
        ? body.model
        : "gemini-3-pro-image-preview";

    const variationIndex =
      typeof body.variationIndex === "number" && Number.isInteger(body.variationIndex)
        ? Math.max(0, Math.min(3, body.variationIndex))
        : 0;

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: "MISSING_API_KEY",
        message:
          "No Gemini API key is configured. Add a billing-enabled GEMINI_API_KEY in Settings > Secrets to generate new wallpapers.",
      });
      return;
    }

    const hasReference = Boolean(
      body.referenceImage?.data &&
        typeof body.referenceImage.data === "string" &&
        body.referenceImage.data.length > 0
    );

    const promptText = buildWallpaperPrompt(
      vibe,
      aspectRatio,
      variationIndex,
      hasReference,
      typeof body.remixNote === "string" ? body.remixNote : undefined
    );

    const parts: Array<
      | { text: string }
      | { inlineData: { data: string; mimeType: string } }
    > = [];

    if (hasReference && body.referenceImage?.data) {
      parts.push({
        inlineData: {
          data: body.referenceImage.data,
          mimeType: body.referenceImage.mimeType || "image/jpeg",
        },
      });
    }

    parts.push({ text: promptText });

    try {
      const response = await generateWithRetry(ai, {
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let mimeType = "image/png";
      let textNotes = "";

      const candidateParts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of candidateParts) {
        if (part.inlineData?.data && !imageUrl) {
          mimeType = part.inlineData.mimeType || "image/png";
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textNotes += part.text;
        }
      }

      if (!imageUrl) {
        res.status(502).json({
          code: "EMPTY_IMAGE_RESPONSE",
          message:
            textNotes.trim() ||
            "The model completed without returning an image. Try adjusting your vibe prompt and retrying.",
        });
        return;
      }

      const directive = VARIATION_DIRECTIVES[variationIndex % VARIATION_DIRECTIVES.length];

      res.json({
        imageUrl,
        mimeType,
        variationIndex,
        variationLabel: directive.label,
        aspectRatio,
        imageSize,
        model,
      });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({
        code: classified.code,
        message: classified.message,
      });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.resolve(__dirname, "dist");

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VibeFrame server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
