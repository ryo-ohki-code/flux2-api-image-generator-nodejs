# flux2-api-image-generator-nodejs - BFL AI Image Generator

A powerful Express.js application that integrates with the [BFL AI API](https://bfl.ai) to generate stunning AI images using the Flux 2 model family. Supports advanced prompt engineering via Ollama, reference image uploads, and detailed configuration options.

**Note:** I noticed sometime if the generation fail, the app do not catches all errors, so if it take took long to get an image, assume it fails.

---

## 🚀 Features

- **AI Image Generation**: Generate high-quality images using BFL's Flux 2 models.
- **Advanced Prompt Engineering**: Leverages Ollama (Mistral-Nemo) to convert natural language prompts into structured, optimized JSON prompts.
- **Reference Image Support**: Upload up to 8 reference images to guide image generation.
- **Flexible Aspect Ratios**: Choose from 11 common aspect ratios (1:1, 2:3, 3:2, etc.).
- **Customizable Parameters**: Adjust guidance, steps, seed, safety tolerance, and more.
- **Transparent Backgrounds**: Option to generate images with transparent backgrounds.
- **Image History**: View and manage generated images with metadata.
- **Responsive UI**: Built-in HTML/CSS/JS frontend for easy interaction.

---

## 🛠️ Prerequisites

- Node.js
- [Ollama](https://ollama.com/) installed and running locally (for advanced prompt engineering)
- BFL API Key (get one from [BFL AI](https://bfl.ai))

---

## 📦 Installation

1. Clone or download the repository.
```bash
git clone https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs
```

2. Install dependencies:

```bash
npm install express multer axios sharp
```

3. Set up environment variables:

```bash
BFL_API_KEY=your_bfl_api_key_here
```

4. Ensure Ollama is installed and running locally:

I used `mistral-nemo:12b-instruct-2407-fp16` model, but you can modify `OLLAMA_MODEL` to use another one.

5. Start the server:

```bash
BFL_API_KEY=put_your_bfl_key_here node server.js
```

The app will be available at `http://localhost:3000`.

---

## 🖼️ Usage

### 1. Upload Reference Images (Optional)

Upload up to 8 reference images to guide the AI in generating your image.

### 2. Configure Generation

- **Model**: Select from available BFL models (e.g., `flux.2-pro`, `flux-2-flex`).
- **Mode**: Choose between `simple` or `advanced` prompt modes.
  - **Simple**: Direct prompt input.
  - **Advanced**: Uses Ollama to enhance your prompt with detailed scene breakdowns, camera settings, color palettes, and more.
- **Aspect Ratio**: Choose from 11 standard aspect ratios.
- **Custom Parameters**:
  - **Guidance**: For `flex` models (default: 5)
  - **Steps**: For `flex` models (default: 50)
  - **Seed**: Random or custom seed for reproducible results
  - **Safety Tolerance**: Adjust safety settings (default: 5)
  - **Transparent Background**: Enable for PNG output with transparency

### 3. Generate & View

Click "Generate" to create your image. Generated images and metadata are saved in the `images/` directory.

---

## 📁 File Structure

```
.
├── app.js                 # Main Express app
├── public/                # Static assets (HTML, CSS, JS)
├── uploads/               # Temporary uploaded files
├── images/                # Generated images and config files
├── README.md              # This file
└── package.json
```

---

## 🧠 Advanced Prompting with Ollama

When using the `advanced` mode, the app uses Ollama to enhance your prompt into a structured JSON format that includes:

- Scene description
- Subjects with details and actions
- Visual style and color palette
- Lighting and mood
- Background and composition
- Camera settings (angle, lens, distance, focus)
- Subtle details and negative prompts

This ensures more coherent and visually rich outputs.

---

## 📡 API Endpoints

| Endpoint           | Method | Description                        |
|--------------------|--------|------------------------------------|
| `/generate`        | POST   | Generate an image                  |
| `/api/history`     | GET    | Retrieve generation history        |
| `/api/models`      | GET    | Get supported BFL models           |

---

## 🔐 Security Notes

- Ensure your BFL API key is kept secure and not exposed in client-side code.
- Uploaded files are temporarily stored in `uploads/` and cleaned up after processing. (Or remove manually if needed)

---

## 🧪 Testing

Run the server and open `http://localhost:3000` in your browser. Use the UI to test image generation with or without reference images.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---


Enjoy creating amazing AI-generated images! 🎨✨
