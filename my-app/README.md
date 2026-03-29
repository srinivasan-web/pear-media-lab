# Pear Media Lab

## Local setup

1. Copy `.env.example` to `.env`
2. Set `VITE_GEMINI_KEY`
3. Set `HF_TOKEN`
4. Run `npm install`
5. Run `npm run dev`

## Image generation

Image generation now runs through the local proxy in `server.mjs`, so the Hugging Face token stays on the server side instead of the browser bundle.

- Frontend endpoint: `VITE_IMAGE_API_URL`
- Local proxy default: `http://localhost:8787/api/image/generate`
- Server token env var: `HF_TOKEN`
