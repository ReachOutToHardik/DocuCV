const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (only if keys are present)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project-url.supabase.co') {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase Connected");
} else {
    console.log("⚠️ Supabase keys missing. Auth/DB features will be limited.");
}


const app = express();
const PORT = 3000;

// Enable CORS and large JSON bodies for images
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// --- ENDPOINT: AUTOMATIC TEMPLATE DISCOVERY ---
app.get('/api/templates', (req, res) => {
    const templatesDir = path.join(__dirname, 'templates');

    if (!fs.existsSync(templatesDir)) {
        // Create directory if it doesn't exist so script doesn't crash
        fs.mkdirSync(templatesDir);
        return res.json([]);
    }

    const items = fs.readdirSync(templatesDir, { withFileTypes: true });
    const folders = items.filter(item => item.isDirectory());

    const templates = folders.map(folder => {
        const folderPath = path.join(templatesDir, folder.name);
        const files = fs.readdirSync(folderPath);

        // 1. Find .tex file
        const texFile = files.find(f => f.endsWith('.tex'));
        if (!texFile) return null;

        // 2. Find Preview Image
        const imgFile = files.find(f => f.match(/\.(jpg|jpeg|png)$/i));

        // 3. Check for info.json (optional metadata)
        let meta = { name: folder.name, desc: 'Ready for launch.' };
        if (files.includes('info.json')) {
            try {
                const data = fs.readFileSync(path.join(folderPath, 'info.json'), 'utf-8');
                meta = JSON.parse(data);
            } catch (e) { console.error("Meta read error:", folder.name); }
        }

        return {
            name: meta.name || folder.name,
            desc: meta.description || meta.desc || 'Custom Template',
            order: meta.order || 999,
            path: `templates/${folder.name}/${texFile}`,
            img: imgFile ? `templates/${folder.name}/${imgFile}` : null
        };
    }).filter(t => t !== null);

    templates.sort((a, b) => a.order - b.order);

    res.json(templates);
});

// --- ENDPOINT: GENERATE RESUME ---
app.post('/api/generate', async (req, res) => {
    console.log("------------------------------------------------");
    console.log("Incoming Generation Request...");

    try {
        const { userData, templatePath, apiKey } = req.body;

        if (!apiKey) return res.status(400).json({ error: "API Key is missing." });
        if (!templatePath) return res.status(400).json({ error: "No template selected." });

        const hasImage = !!userData.profileImage;
        console.log(`User: ${userData.name} | Image Included: ${hasImage}`);
        console.log(`Selected Template: ${templatePath}`);

        // 1. Load Template
        const fullPath = path.join(__dirname, templatePath);
        if (!fs.existsSync(fullPath)) return res.status(404).json({ error: `Template file not found.` });

        let latexTemplate = fs.readFileSync(fullPath, 'utf-8');

        // 2. Prompt Engineering for Image
        let imageInstructions = "";
        if (hasImage) {
            imageInstructions = `
            **CRITICAL - IMAGE INSTRUCTION:**
            The user provided a profile picture. It is available to the compiler as 'profile.jpg'.
            1. You MUST include: \\includegraphics[width=2.5cm]{profile.jpg} (adjust width to fit).
            2. Ensure \\usepackage{graphicx} is in the preamble.
            3. Place the image in the header or near personal details.
            4. If the template design doesn't support an image, CREATE space for it (e.g., using minipage or wrapfig).
            `;
        } else {
            imageInstructions = `
            **IMAGE INSTRUCTION:**
            The user provided NO photo. Remove all \\includegraphics commands for profile pictures. Center the text if removing the image creates a gap.
            `;
        }

        // 3. Call Gemini AI
        // 3. Call Gemini AI
        console.log("Loading Prompt Template...");
        const promptTemplate = fs.readFileSync(path.join(__dirname, 'prompts', 'resume_gen.txt'), 'utf-8');

        const prompt = promptTemplate
            .replace('{{name}}', userData.name)
            .replace('{{email}}', userData.email)
            .replace('{{phone}}', userData.phone)
            .replace('{{linkedin}}', userData.linkedin || 'Not provided')
            .replace('{{github}}', userData.github || 'Not provided')
            .replace('{{targetRole}}', userData.targetRole)
            .replace('{{rawInfo}}', userData.rawInfo)
            .replace('{{latexTemplate}}', latexTemplate);

        console.log("Sending to Gemini...");
        const model = "gemini-2.5-flash";
        const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const aiResponse = await axios.post(aiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        let filledLatex = aiResponse.data.candidates[0].content.parts[0].text;

        // CLEANUP: Extract only the LaTeX code block if present
        const latexMatch = filledLatex.match(/\\documentclass[\s\S]*?\\end{document}/);
        if (latexMatch) {
            filledLatex = latexMatch[0];
        } else {
            // Fallback cleanup
            filledLatex = filledLatex.replace(/```latex/gi, '').replace(/```/g, '').trim();
        }

        console.log("Extracted LaTeX (First 100 chars):", filledLatex.substring(0, 100));

        // 4. Prepare Compiler Payload
        const resources = [
            {
                main: true,
                content: filledLatex
            }
        ];

        if (hasImage) {
            // Extract Base64 string (remove "data:image/jpeg;base64," prefix)
            const base64Data = userData.profileImage.split(',')[1];

            resources.push({
                path: "profile.jpg",
                file: base64Data // 'file' key tells API this is binary data
            });
        }

        // 5. Compile PDF
        console.log("Compiling PDF...");
        try {
            const compileResponse = await axios.post(
                'https://latex.ytotech.com/builds/sync',
                {
                    compiler: 'pdflatex',
                    resources: resources
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    responseType: 'arraybuffer'
                }
            );

            console.log("Compilation Success.");
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Length': compileResponse.data.length,
            });
            res.send(compileResponse.data);

        } catch (compilerError) {
            console.error("COMPILER ERROR:", compilerError.message);
            if (compilerError.response && compilerError.response.data) {
                // Try to parse arraybuffer to string to see the error text
                const errorText = Buffer.from(compilerError.response.data).toString('utf-8');
                console.error("Compiler Response:", errorText);
                return res.status(400).json({ error: "LaTeX Compilation Failed. Check server logs for details.", details: errorText });
            }
            throw compilerError;
        }

    } catch (error) {
        console.error("SERVER ERROR:", error.message);
        res.status(500).json({ error: "Processing failed: " + error.message });
    }
});

// --- ENDPOINT: ATS CHECKER ---
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const mammoth = require('mammoth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/ats-check', upload.single('resume'), async (req, res) => {
    console.log("------------------------------------------------");
    console.log("Incoming ATS Check Request...");

    try {
        const { jobDescription, apiKey } = req.body;
        const file = req.file;

        if (!apiKey) return res.status(400).json({ error: "API Key is missing." });
        if (!file) return res.status(400).json({ error: "No resume file uploaded." });

        // Initialize Gemini SDK
        const genAI = new GoogleGenerativeAI(apiKey);
        const fileManager = new GoogleAIFileManager(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let promptParts = [];
        let tempFilePath = null;

        // 1. Handle File Type
        if (file.mimetype === 'application/pdf') {
            console.log("Processing PDF with Gemini File API...");

            // Write buffer to temp file for upload
            tempFilePath = path.join(__dirname, `temp_${Date.now()}.pdf`);
            fs.writeFileSync(tempFilePath, file.buffer);

            // Upload to Gemini
            const uploadResult = await fileManager.uploadFile(tempFilePath, {
                mimeType: file.mimetype,
                displayName: "Candidate Resume",
            });

            console.log(`Uploaded file: ${uploadResult.file.uri}`);

            // Add file to prompt
            promptParts.push({
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            });

        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log("Processing DOCX with Mammoth...");
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            const resumeText = result.value;

            promptParts.push({ text: `RESUME TEXT:\n${resumeText}` });
        } else {
            return res.status(400).json({ error: "Unsupported file type. Please upload PDF or DOCX." });
        }

        // 2. Construct Prompt
        const atsPromptTemplate = fs.readFileSync(path.join(__dirname, 'prompts', 'ats_check.txt'), 'utf-8');
        const systemInstruction = atsPromptTemplate.replace('{{jobDescription}}', jobDescription || "General Industry Standards for this role");

        promptParts.push({ text: systemInstruction });

        // 3. Generate Content
        console.log("Sending to Gemini...");
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        let analysisText = response.text();

        // Clean up JSON
        analysisText = analysisText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const analysisJson = JSON.parse(analysisText);

        // Cleanup Temp File
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        res.json(analysisJson);

    } catch (error) {
        console.error("ATS CHECK ERROR:", error);
        res.status(500).json({ error: "ATS Analysis failed. Check backend console." });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 DOCUCV SERVER STARTED`);
    console.log(`👉 http://localhost:${PORT}\n`);
});