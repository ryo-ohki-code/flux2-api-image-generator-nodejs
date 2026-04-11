// https://docs.bfl.ml/api-reference/get-the-users-credits
// app.js — BFL AI version (drop-in for your existing HTML)
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import axios from 'axios';
import sharp from 'sharp';

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Upload handling
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, 'uploads/'),
	filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ensure dirs exist
await fs.mkdir('uploads', { recursive: true });
await fs.mkdir('images', { recursive: true });

// --- Constants & Helpers ---
const BFL_API_KEY = process.env.BFL_API_KEY || 'YOUR_BFL_API_KEY_HERE';
const BASE_URL = 'https://api.bfl.ai/v1';

// Ollama
const OLLAMA_HOST = 'http://localhost:11434';
const OLLAMA_MODEL = 'mistral-nemo:12b-instruct-2407-fp16';

async function callOllama(prompt, model = OLLAMA_MODEL) {
	try {
		const res = await axios.post(`${OLLAMA_HOST}/api/generate`, {
			model,
			prompt,
			stream: false
		});
		return res.data.response || '';
	} catch (err) {
		console.error('Ollama error:', err.message);
		return '';
	}
}

let HeaderSimpleWithoutToken = {
	"User-Agent": "browser v3",
	"Accept": "*/*",
	"Accept-Language": "en-US,en;q=0.5",
	"Content-Type": "application/json",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"Sec-Fetch-Site": "same-site"
}

async function checkServerStatus() {
	let PingServer = await fetch(OLLAMA_HOST, {
		"Content-Type": "application/json",
		"headers": HeaderSimpleWithoutToken,
		"method": "GET",
		"mode": "cors"
	});

	let data2 = PingServer;
	console.log("Ollama Server: " + data2.statusText);
}

// Map UI model names to BFL endpoints
const BFL_ENDPOINT_MAP = {
	'flux.2-pro': '/flux-2-pro',
	'flux-2-flex': '/flux-2-flex',
	'flux-2-max': '/flux-2-max',
	'flux-2-pro-preview': '/flux-2-pro-preview',
};

// Map aspect ratios to dimensions
const ASPECT_RATIO_DIMS = {
	"1:1": { width: 1920, height: 1920 },
	"2:3": { width: 1280, height: 1920 },
	"3:2": { width: 1920, height: 1280 },
	"3:4": { width: 1440, height: 1920 },
	"4:3": { width: 1920, height: 1440 },
	"4:5": { width: 1536, height: 1920 },
	"5:4": { width: 1920, height: 1536 },
	"9:16": { width: 1072, height: 1920 },
	"16:9": { width: 1920, height: 1072 },
	"21:9": { width: 2560, height: 1080 }
};

// Polling helper
async function pollForResult(pollingUrl, requestId) {
	const headers = {
		'accept': 'application/json',
		'x-key': BFL_API_KEY,
	};

	// Use pollingUrl if provided (preferred), else construct fallback
	const url = pollingUrl || `${BASE_URL}/get?requestId=${requestId}`;
	let hasLoggedPending = false;

	while (true) {
		await new Promise(r => setTimeout(r, 500)); // 0.5s delay

		const res = await axios.get(url, { headers });

		const { status, result } = res.data;
		if (status !== 'Ready' && status !== 'Pending') {
			console.log('error', res.data)
		}
		if (status === 'Pending' && !hasLoggedPending) {
			console.log('Generating image', res.data.id);
			hasLoggedPending = true;
		}
		if (status === 'Error' || status === 'Failed' || status === 'Request Moderated') {
			throw new Error(`Generation failed: ${JSON.stringify(res.data)}`);
		}
		if (res.data.details) {
			throw new Error(`Generation failed: ${JSON.stringify(res.data)}`); // .details["Moderation Reasons"]
		}
		if (status === 'Ready') return result.sample;
	}
}

// Download image from signed URL (10-min expiry)
async function downloadImageToDisk(url, filename) {
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	await fs.writeFile(filename, response.data);
	return filename;
}

// Helper: encode image to base64 (PNG, max 1024px per BFL recommendation)
async function encodeImageToBase64(filePath, maxDimension = 1024) {
	const img = sharp(filePath);
	const metadata = await img.metadata();
	const { width, height } = metadata;

	if (!width || !height) {
		throw new Error(`Invalid image: ${filePath}`);
	}

	const scale = Math.min(maxDimension / width, maxDimension / height, 1);
	const resizedWidth = Math.round(width * scale);
	const resizedHeight = Math.round(height * scale);

	const buffer = await img
		.resize(resizedWidth, resizedHeight, { fit: 'inside', withoutEnlargement: true })
		.png()
		.toBuffer();

	return buffer.toString('base64');
}


async function generateAdvancedPrompt(data) {
	const { prompt, style, mood, colors, details, negative_prompt, camera_angle, camera_lens, depth_of_field, camera_distance, title, subtitle } = data;

	const arrayDetails = details.split(',');
	const arrayNegativePrompt = negative_prompt.split(',');

	let LLM_Promt = `You are an expert prompt engineer for AI image generation (Flux 2). 
Given a user's natural-language scene description and optional preferences, generate a complete, valid JSON object with the following keys:
`
	if (title !== '') {
		LLM_Promt += `- "title": the title of the image`;
	}
	if (subtitle !== '') {
		LLM_Promt += `\n- "subtitle": the subtitle of the image`;
	}

	LLM_Promt += `
- "scene": expanded vivid description (keep concise but evocative)
- "subjects": array of objet like: {description: "detailled description of the scene or element", position: "position of elements", action: "action description"}
- "style": visual style (e.g., "cinematic semi-realistic illustration")
- "color_palette": array of 3–5 hex codes (prioritize mood-appropriate palettes)
- "lighting": describe light sources, quality, contrast (e.g., "soft moonlight + warm sparkler glow")
- "mood": comma-separated emotional tone (e.g., "warm, intimate, reflective")
- "background": descriptive but non-distracting backdrop (e.g., "out-of-focus city skyline with distant fireworks")
- "composition": framing, perspective, visual balance, negative space usage (e.g., "wide medium shot, balanced arc framing, negative space above for sky")
`;

	if (camera_angle !== '' || camera_lens !== '' || depth_of_field !== '') {
		LLM_Promt += `- "camera": object with {angle: "camera height/angle", lens: "focal length + style", distance: "camera distance", focus: "focus description"}`;
	}
	if (Array.isArray(arrayDetails) && arrayDetails.length > 0) {
		LLM_Promt += `\n- "details": array of 4–7 subtle visual elements that enhance realism (e.g., ["subtle breath vapor", "soft fabric textures"])`;
	}
	if (Array.isArray(arrayNegativePrompt) && arrayNegativePrompt.length > 0) {
		LLM_Promt += `\n- "negative_prompt": array of 6–10 items to avoid (e.g., ["cartoon style", "text", "distorted faces"])`;
	}

	LLM_Promt += `\n
Rules:
- Use ONLY the user's input as context. Do not invent unrelated elements.
- Prioritize coherence, realism, and emotional resonance.
- Output ONLY valid JSON — no markdown, no explanations.
- Avoid hallucinations: only add details implied or strongly suggested by the input.

User input:
Scene: "${prompt}"
Optional: Style = "${style}", Mood = "${mood}", Colors = ${colors}
	`;

	if (title !== '') {
		LLM_Promt += `\nTitle: ${title}`;
	}
	if (subtitle !== '') {
		LLM_Promt += `\nSubtitle: ${subtitle}`;
	}

	if (Array.isArray(arrayDetails) && arrayDetails.length > 0) {
		LLM_Promt += `\nDetails = ${arrayDetails}`;
	}

	if (Array.isArray(arrayNegativePrompt) && arrayNegativePrompt.length > 0) {
		LLM_Promt += `\nNegative Prompt = ${arrayNegativePrompt}`;
	}

	if (camera_angle !== '' || camera_lens !== '' || depth_of_field !== '') {
		LLM_Promt += `\nCamera setting: Angle = "${camera_angle}", Lens = "${camera_lens}", Distance: ${camera_distance}, Focus = ${depth_of_field}`
	}

	let response;
	try {
		response = await callOllama(LLM_Promt);
	} catch (err) {
		response = null;
	}

	return response;
}


// --- Main generation route (with BFL input_image support) ---
app.post('/generate', upload.array('referenceImages'), async (req, res) => {
	console.log('Request received');
	try {
		let prompt;
		const { mode, ratio, model } = req.body;
		const uploadedFiles = req.files || [];

		prompt = req.body.prompt;

		if (mode === 'advanced') {
			console.log('Generating advanced prompt');
			prompt = await generateAdvancedPrompt(req.body);
		}

		if (!prompt) {
			throw new Error('Prompt is required');
		}

		// Map UI model name to BFL endpoint (e.g., 'flux-2-pro' → '/v1/flux-2-pro')
		const endpoint = BFL_ENDPOINT_MAP[model];
		if (!endpoint) {
			return res.status(400).json({ error: `Unsupported model: ${model}` });
		}

		let imageWidth, imageHeight;
		if (ratio === 'custom') {
			const { customWidth, customHeight } = req.body;
			imageWidth = Number(customWidth);
			imageHeight = Number(customHeight);
		} else {
			const { width, height } = ASPECT_RATIO_DIMS[ratio] || { width: 1440, height: 2048 };
			imageWidth = Number(width);
			imageHeight = Number(height);
		}

		let guidance, steps;
		if (model.includes("flex")) {
			guidance = Number(req.body.guidance) || 5;
			steps = Number(req.body.steps) || 50;
		}

		try {
			// Prepare reference images (up to 8)
			const inputImages = {};
			for (let i = 0; i < Math.min(uploadedFiles.length, 8); i++) {
				const filePath = uploadedFiles[i].path;
				const base64Data = await encodeImageToBase64(filePath);
				if (i === 0) {
					inputImages[`input_image`] = `data:image/png;base64,${base64Data}`;
				} else {
					inputImages[`input_image_${i + 1}`] = `data:image/png;base64,${base64Data}`;
				}
			}

			// Build payload — include input_image_* fields only if images provided
			const payload = {
				prompt,
				width: imageWidth,
				height: imageHeight,
				seed: req.body.seed ? parseInt(req.body.seed, 10) : Math.floor(Math.random() * 1000000),
				...inputImages,
				output_format: req.body.outputFormat || 'png',
				safety_tolerance: req.body.safetyTolerance || 5,
				...(model.includes("flex") && { guidance: guidance }),
				...(model.includes("flex") && { steps: steps }),
				disable_pup: mode === 'advanced',
				transparent_bg: req.body.transparentBg === 'on'
			};

			console.log('Calling BFL API');

			const submitRes = await axios.post(`${BASE_URL}${endpoint}`, payload, {
				headers: {
					'accept': 'application/json',
					'x-key': BFL_API_KEY,
					'Content-Type': 'application/json',
				}
			});

			const { id: requestId, polling_url: pollingUrl } = submitRes.data;
			if (!requestId || !pollingUrl) {
				throw new Error('Missing request ID or polling URL from BFL');
			}

			// Step 2: Poll until ready
			const imageUrl = await pollForResult(pollingUrl, requestId);

			console.log(`Done\nUrl: ${pollingUrl}\n`);

			// Step 3: Download image locally
			const timestamp = Date.now();
			const outputPath = path.join('images', `${timestamp}_image.png`);
			await downloadImageToDisk(imageUrl, outputPath);

			// Save config (with image count)
			const config = {
				prompt,
				ratio,
				model,
				aspect: { width: imageWidth, height: imageHeight },
				timestamp,
				bfl_request_id: requestId,
				referenceImagesUsed: Math.min(uploadedFiles.length, 8)
			};
			await fs.writeFile(
				path.join('images', `${timestamp}_config.txt`),
				JSON.stringify(config, null, 2),
				'utf8'
			);

			// Clean up uploaded files
			for (const file of uploadedFiles) {
				try { await fs.unlink(file.path); } catch (e) { /* ignore */ }
			}

			// Return result
			res.json({
				success: true,
				urls: [`/images/${path.basename(outputPath)}`],
				config,
			});

		} catch (error) {
			console.error('BFL Error:', error.response?.data || error.message);
			res.status(500).json({
				error: 'Failed to generate image',
				details: error.response?.data || error.message || error.details["Moderation Reasons"]
			});
		}
	} catch (err) {
		console.log(err);
	}
});

// --- History route ---
app.get('/api/history', async (req, res) => {
	try {
		const files = await fs.readdir(path.resolve('./images'));
		const images = files.filter(f => f.endsWith('.png') && !f.includes('config'));

		const history = await Promise.all(images.map(async img => {
			const ts = parseInt(img.split('_')[0]);
			const configPath = path.join('./images', `${ts}_config.txt`);
			let configExists = null;
			try {
				configExists = fs.access(configPath).then(() => true).catch(() => false);

			} catch (e) { }

			return {
				image: `/images/${img}`,
				timestamp: ts,
				configExists
			};
		}));

		history.sort((a, b) => b.timestamp - a.timestamp);
		res.json(history);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Get list of supported BFL models
app.get('/api/models', (req, res) => {
	const models = Object.keys(BFL_ENDPOINT_MAP).map(value => ({
		value,
		label: value.replace('.', ' ').replace(/-/g, ' ')
	}));

	const aspectRatios = ASPECT_RATIO_DIMS;

	res.json({ models, aspectRatios });
});

// GET route to return credits data
app.get('/credits', async (req, res) => {
	try {
		const response = await axios.get(`${BASE_URL}/credits`, {
			headers: {
				'x-key': BFL_API_KEY
			}
		});

		if (!response.data.credits) {
			throw new Error('Missing credit data');
		}

		res.json(response.data.credits);
	} catch (error) {
		console.error('Error fetching credits:', error);
		res.status(500).json({
			error: 'Failed to fetch credits data',
			message: error.response?.data?.message || error.message
		});
	}
});


// Start server
app.listen(PORT, () => {
	console.log(`🖼️ BFL AI Generator running on http://localhost:${PORT}`);
});
