export const DEFAULT_PROMPTS = {
  greeting: "Hello! How can I assist you today?",
  error: "An error occurred. Please try again.",
  loading: "Loading...",
  success: "Operation completed successfully.",
};

export const API_CONFIG = {
  geminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  geminiApiKey: import.meta.env.VITE_GEMINI_KEY || "",
  imageGenerationUrl:
    import.meta.env.VITE_IMAGE_API_URL || "http://localhost:8787/api/image/generate",
  timeout: 5000,
  retries: 2,
};

export const APP_CONFIG = {
  appName: "Pear Media Lab",
  version: "2.0.0",
  environment: import.meta.env.MODE || "development",
};

export const MESSAGES = {
  required: "This field is required.",
  invalidEmail: "Please enter a valid email address.",
  passwordMismatch: "Passwords do not match.",
  promptRequired: "Prompt cannot be empty.",
  imageRequired: "Upload an image first.",
  analysisRequired: "Analyze an image first.",
};

export const TEXT_MODELS = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    task: "text",
    speed: "Fast",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    task: "text",
    speed: "Balanced",
  },
];

export const IMAGE_ANALYSIS_MODELS = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash Vision",
    provider: "Google",
    task: "vision",
    speed: "Fast",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro Vision",
    provider: "Google",
    task: "vision",
    speed: "Detailed",
  },
];

export const IMAGE_GENERATION_MODELS = [
  {
    id: "stabilityai/stable-diffusion-xl-base-1.0",
    label: "SDXL Base",
    provider: "Hugging Face",
    quality: "Balanced",
  },
  {
    id: "black-forest-labs/FLUX.1-schnell",
    label: "FLUX.1 Schnell",
    provider: "Hugging Face",
    quality: "Fast",
  },
  {
    id: "black-forest-labs/FLUX.1-dev",
    label: "FLUX.1 Dev",
    provider: "Hugging Face",
    quality: "Detailed",
  },
];

export const STYLE_PRESETS = [
  {
    id: "realistic",
    label: "Realistic",
    prompt:
      "realistic, DSLR camera, natural lighting, depth of field, soft shadows",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    prompt:
      "cinematic, dramatic lighting, wide angle lens, movie scene, rich color grading",
  },
  {
    id: "anime",
    label: "Anime",
    prompt: "anime style, vibrant colors, detailed illustration, studio quality",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    prompt:
      "cyberpunk, neon lights, futuristic city, dark atmosphere, glowing effects",
  },
  {
    id: "cartoon",
    label: "Cartoon",
    prompt: "cartoon illustration, playful shapes, clean outlines, vivid palette",
  },
];

export const TEXT_TEMPLATES = [
  "A futuristic city at night with flying cars and cinematic lighting",
  "A fantasy dragon flying over snowy mountains at sunrise",
  "A realistic portrait of a fashion model in a studio shoot",
  "A luxury product shot of a perfume bottle on reflective glass",
];
