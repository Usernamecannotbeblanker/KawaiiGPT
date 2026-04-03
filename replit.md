# KawaiiGPT

A kawaii-themed AI chatbot and code writer powered by GPT-4o and Flask.

## Architecture

- **Backend**: Python Flask (`app.py`) serving on port 5000
- **Frontend**: Vanilla HTML/CSS/JS with markdown + syntax highlighting (highlight.js + marked.js)
- **AI**: OpenAI GPT-4o via streaming API
- **Original installer**: `kawaii.py` (kept for reference, not used in web mode)

## Project Structure

```
app.py              - Flask backend with streaming chat endpoint
kawaii.py           - Original CLI installer (unused in web mode)
templates/
  index.html        - Main chat UI
static/
  css/style.css     - Dark purple-themed UI styles
  js/app.js         - Chat logic, markdown rendering, streaming
```

## Features

- Real-time streaming responses
- Markdown + syntax-highlighted code blocks
- Chat mode and Code Writer mode
- Quick prompt shortcuts
- New chat / clear chat
- Mobile responsive sidebar
- Copy code button on all code blocks

## Environment Variables

- `OPENAI_API_KEY` - Required. OpenAI API key for GPT-4o access.

## Running

The app runs via the "Start application" workflow:
```
python3 app.py
```
Serves on `0.0.0.0:5000`.
