# flux2-api-image-generator-nodejs - BFL AI Image Generator

A powerful Express.js application that integrates with the [BFL AI API](https://bfl.ai) to generate stunning AI images using the Flux 2 model family. Supports advanced prompt engineering via Ollama, reference image uploads, and detailed configuration options.

---

## 🚀 Features

- **AI Image Generation**: Generate high-quality images using BFL's Flux 2 models.
- **Advanced Prompt Engineering**: Leverages Ollama (Mistral-Nemo) to convert natural language prompts into structured, optimized JSON prompts.
- **Reference Image Support**: Upload up to 8 reference images to guide image generation.
- **Flexible Aspect Ratios**: Choose from 11 common aspect ratios (1:1, 2:3, 3:2, etc., or custom width/height).
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
npm install express multer axios sharp json5
```

3. Set up environment variables:

```bash
BFL_API_KEY=your_bfl_api_key_here
```

4. To use advanced prompting - Ensure Ollama is installed and running locally:

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
- **Aspect Ratio**: Choose from 11 standard aspect ratios (or use custom value).
- **Custom Parameters**:
  - **Seed**: Random or custom seed for reproducible results
  - **Safety Tolerance**: Adjust safety settings (default: 5)
  - **Transparent Background**: Enable for PNG output with transparency
  - **Guidance**: For `flex` models (default: 5)
  - **Steps**: For `flex` models (default: 50)
  
### 3. Generate & View

Click "Generate" to create your image. Generated images and metadata are saved in the `images/` directory.

---

## 📁 File Structure

```
.
├── app.js                 # Main Express app
├── public/                # Static assets (HTML, TXT)
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
- Subtle details

This ensures more coherent and visually rich outputs.

**Sample object:**
```JSON
{
  "scene": "New Year's Eve night on a rooftop overlooking a glowing city skyline",
  "subjects": [
    {
      "description": "Group of close friends including men and women in winter clothing, natural facial proportions, diverse appearances",
      "position": "center and slightly spread across the frame",
      "action": "standing together in a loose circle, some smiling softly, others quietly reflective, sharing the moment before midnight"
    }
  ],
  "style": "Cinematic semi-realistic illustration with grounded realism, subtle painterly softness",
  "color_palette": ["#0B132B", "#1C2541", "#EAEAEA", "#F4D35E"],
  "lighting": "Soft moonlight as ambient key light, warm glow from sparklers and nearby string lights illuminating faces, gentle contrast",
  "mood": "Warm, intimate, reflective, hopeful",
  "background": "Out-of-focus city skyline with distant fireworks softly lighting the sky, minimal visual noise",
  "composition": "Wide medium shot, balanced framing, friends forming a natural arc, fireworks in the sky",
  "camera": {
    "angle": "eye-level",
    "lens": "50mm stadard",
    "depth_of_field": "sharp focus on group, gentle background blur"
  },
  "details": [
    "subtle breath vapor in cold air",
    "natural body language and expressions",
    "no exaggerated poses or faces"
  ]
}
```

---

## 📡 API Endpoints

| Endpoint           | Method | Description                        |
|--------------------|--------|------------------------------------|
| `/generate`        | POST   | Generate an image                  |
| `/api/history`     | GET    | Retrieve generation history        |
| `/api/models`      | GET    | Get supported BFL models           |
| `/api/credits`         | GET    | Get account credits                |

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


##  Sample images

**No cherry pick:** this is the first 4 images generated using this bird prompt.

### Prompt for simple mode: 
```
A vibrant, adventure movie poster scene featuring an array of exuberant birds from various regions. A Gabon grey parrot, a Cockatoo, a Cockatiel, a Parakeet, and a Starling. The movie title is 'The Parrot Incident' and it subtitle 'A Bird Story'
```

![Sample-01](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-01.png)



### Prompt for advanced mode (I just moved the title and subtitle in the appropriate input fied):
```
A vibrant, adventure movie poster scene featuring an array of exuberant birds from various regions. A Gabon grey parrot, a Cockatoo, a Cockatiel, a Parakeet, and a Starling.
```

![Sample-02](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-02.png)
- Style: Cinematic semirealistic
- Mood: joyful, festive, energic
- Camera angle: Dutch angle
- Lens: 35mm cinematic

---

![Sample-03](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-03.png)
- Style: Cyberpunk neon
- Mood: joyful, festive, energic
- Camera angle: Dutch angle
- Lens: 35mm cinematic

---

![Sample-04](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-04.png)
- Style: Steampunk
- Mood: joyful, festive, energic
- Camera angle: Dutch angle
- Lens: 35mm cinematic

---

![Sample-05](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-05.png)
- Style: Vintage
- Mood: dark, moody, dramatic
- Camera angle: Worm view
- Lens: 35mm cinematic

---

![Sample-06](https://github.com/ryo-ohki-code/flux2-api-image-generator-nodejs/blob/main/samples/sample-06.png)
- prompt: A vibrant, adventure movie poster scene featuring an array of exuberant birds from various regions. A Gabon grey parrot, a Cockatoo, a Cockatiel, a Parakeet, and a Starling. Birds are in a manor living room looking for clues.
- Style: Adventure Movie Poster
- Mood: Heroic, brave, powerful
- Camera angle: Worm view
- Lens: 35mm cinematic
- Key details: keys and maps hidden under a chair, one bird has a monocle
  
---

Enjoy creating amazing AI-generated images! 🎨✨



