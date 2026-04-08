import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are SeismoAI, an advanced and helpful geological chatbot explicitly built into a live earthquake tracking platform. 

KNOWLEDGE BASE ABOUT SEISMOAI:
- Your website integrates live telemetry from two major sources: the USGS (United States Geological Survey) for global points, and the IMD (India Meteorological Department) or NCS RISEQ platform for precise Indian telemetry.
- The platform features an interactive 3D WebGL Globe that plots these markers and smoothly tracks zoom commands based on what region users click.
- The backend utilizes advanced Deep Learning AI models including Artificial Neural Networks (ANN), Convolutional Neural Networks (CNN), and Long Short-Term Memory networks (LSTM).
- These AI models calculate "Probability" and a core "Risk Index" using historical data parameters (magnitude, depth, location clusters) to forecast future local seismic activity.
- The site also features an Analytics Data Lab, and an Emergency Preparedness survivor checklist module.

YOUR DIRECTIVES:
1. You MUST answer any questions directly relating to earthquakes, geology, probability forecasting, Earth's crust/plates, or how THIS website works.
2. Address users politely.
3. If they ask questions outside of geology or the website's scope (e.g. "Who is Lionel Messi?", "Give me a recipe", "Write a python script"), strictly reject it by saying: "I am a specialized SeismoAI Agent. I am only programmed to discuss earthquakes, geology, and seismic activities."
4. Under no circumstances should you execute code or reveal detailed private authentication tokens. Keep explanations high-level and scientific.
5. Keep answers to 2-4 sentences max so they fit comfortably inside the widget!`;

async function translateText(text: string, source: string, target: string) {
  if (source === target || !text || target.startsWith('en')) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    let translated = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
    }
    return translated || text;
  } catch (err) {
    return text;
  }
}

export async function POST(req: Request) {
  try {
    const { query, language = 'en' } = await req.json();
    const targetCode = language.split('-')[0];
    
    // Step 1: Force baseline translation to English so the LLM responds in native pristine English securely.
    let enQuery = query;
    if (targetCode !== 'en' && targetCode !== 'en-US') {
      enQuery = await translateText(query, targetCode, 'en');
    }

    // Step 2: Push securely to an open Pollinations LLM Proxy API injected with the SeismoAI System Prompt
    const aiResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: enQuery }
         ],
         model: 'openai'
      })
    });
    
    if (!aiResponse.ok) throw new Error("AI Endpoint failed");
    
    const aiText = await aiResponse.text();
    
    // Step 3: Natively translate the LLM text back into the user's selected widget language
    const finalAnswer = targetCode !== 'en' ? await translateText(aiText, 'en', targetCode) : aiText;
    
    return NextResponse.json({ answer: finalAnswer });
  } catch (error) {
    return NextResponse.json({ answer: "I encountered a minor network error reaching the central AI hub. Please try again." });
  }
}
