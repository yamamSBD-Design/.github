import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Loader2, Flame, Share2, Sparkles, Thermometer, Key, Lock, Settings } from 'lucide-react';

const OmegaWriter = () => {
  // --- CONFIGURATION STATE ---
  // The environment provides the key at runtime in the preview.
  // If moving to GitHub/StackBlitz, this will be empty, triggering the UI input.
  const apiKey = "";
  const [userKey, setUserKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // --- OMEGA PROCESS STATE ---
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState('Medium (~800 words)');
  const [status, setStatus] = useState('idle');
  const [currentLayer, setCurrentLayer] = useState(0);
  const [logs, setLogs] = useState([]);

  // Layer Contents
  const [layer1, setLayer1] = useState(''); // Temp 0.2
  const [layer2, setLayer2] = useState(''); // Temp 0.5
  const [layer3, setLayer3] = useState(''); // Temp 0.8
  const [layer4, setLayer4] = useState(''); // Temp 1.2 (Viral)

  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('layer1');

  const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

  const lengthOptions = [
    "Short (~300 words)",
    "Medium (~800 words)",
    "Long (~1500 words)",
    "Detailed Report (~3000 words)"
  ];

  // --- INIT & AUTH LOGIC ---
  useEffect(() => {
    // 1. Check if environment injected a key (Canvas Preview)
    if (apiKey && apiKey.length > 5) {
      setIsConfigured(true);
    } else {
      // 2. Check if user saved a key locally (Deployed Version)
      const stored = localStorage.getItem('omega_gemini_key');
      if (stored) {
        setUserKey(stored);
        setIsConfigured(true);
      }
    }
  }, []);

  const handleSaveKey = (inputKey) => {
    if (!inputKey) return;
    localStorage.setItem('omega_gemini_key', inputKey);
    setUserKey(inputKey);
    setIsConfigured(true);
  };

  const handleClearKey = () => {
    localStorage.removeItem('omega_gemini_key');
    setUserKey('');
    setIsConfigured(false);
    // Reload to reset state cleanly
    window.location.reload();
  };

  const getEffectiveKey = () => {
    if (apiKey && apiKey.length > 5) return apiKey;
    return userKey;
  };

  // --- CORE LOGIC ---

  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const generateContent = async (prompt, temperature, retries = 5) => {
    const finalKey = getEffectiveKey();
    if (!finalKey) throw new Error("Missing API Key. Please configure settings.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${finalKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 8000,
      }
    };

    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
           if (response.status === 429) {
             throw new Error("Rate limit exceeded. Please wait a moment.");
           }
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";

      } catch (err) {
        attempt++;
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Attempt ${attempt} failed. Retrying in ${waitTime}ms...`, err);
        if (attempt >= retries) throw err;
        await delay(waitTime);
      }
    }
  };

  const runHeatingProtocol = async () => {
    if (!topic) return;

    setStatus('processing');
    setCurrentLayer(1);
    setLayer1('');
    setLayer2('');
    setLayer3('');
    setLayer4('');
    setLogs([]);
    setErrorMsg('');
    setActiveTab('layer1');

    try {
      // --- LAYER 1: THE FOUNDATION (Temp 0.2) ---
      addLog(`INITIATING LAYER 1: COLD LOGIC (TEMP 0.2)`);
      addLog(`Building structural foundation...`);

      const prompt1 = `
        ACT AS: A strict, logical technical writer.
        TOPIC: "${topic}"
        LENGTH: ${length}
        TEMP: 0.2 (Low Variance)

        DIRECTIVES:
        1. Write a structured, factual, and logically sound draft.
        2. Focus strictly on accuracy, clear arguments, and solid definitions.
        3. Do not use flowery language. Use plain, direct English.
        4. Establish the core paragraphs and ideas.

        OUTPUT: Pure text content only.
      `;

      const res1 = await generateContent(prompt1, 0.2);
      setLayer1(res1);
      addLog("LAYER 1 COMPLETE. Foundation set.");
      setActiveTab('layer1');

      // --- LAYER 2: THE FLOW (Temp 0.5) ---
      setCurrentLayer(2);
      setActiveTab('layer2');
      addLog(`INITIATING LAYER 2: WARMING UP (TEMP 0.5)`);
      addLog(`Smoothing transitions and cadence...`);

      const prompt2 = `
        ACT AS: An expert editor.
        INPUT TEXT:
        """
        ${res1}
        """

        GOAL: Refine the text for flow and readability.
        TEMP: 0.5 (Balanced)

        STRICT CONSTRAINTS:
        1. DO NOT add new headings.
        2. DO NOT add external paragraphs or new concepts.
        3. Keep the exact same structure as the input.
        4. Focus on smoothing the sentence variance and connecting ideas logically.
        5. Remove clunky phrasing.
      `;

      const res2 = await generateContent(prompt2, 0.5);
      setLayer2(res2);
      addLog("LAYER 2 COMPLETE. Flow optimized.");

      // --- LAYER 3: THE SOUL (Temp 0.8) ---
      setCurrentLayer(3);
      setActiveTab('layer3');
      addLog(`INITIATING LAYER 3: HIGH ENERGY (TEMP 0.8)`);
      addLog(`Injecting voice, metaphors, and insight...`);

      const prompt3 = `
        ACT AS: A visionary writer.
        INPUT TEXT:
        """
        ${res2}
        """

        GOAL: Elevate the prose to be insightful and compelling.
        TEMP: 0.8 (Creative)

        STRICT CONSTRAINTS:
        1. DO NOT add new headings or change the core structure.
        2. Replace generic descriptions with powerful metaphors.
        3. Make the tone authoritative and deep.
        4. Ensure every sentence justifies its existence.
      `;

      const res3 = await generateContent(prompt3, 0.8);
      setLayer3(res3);
      addLog("LAYER 3 COMPLETE. Voice injected.");

      // --- LAYER 4: THE VIRAL WIZARD (Temp 1.2) ---
      setCurrentLayer(4);
      setActiveTab('layer4');
      addLog(`INITIATING LAYER 4: PLASMA STATE (TEMP 1.2)`);
      addLog(`WIZARDING FOR SUBSTACK VIRALITY...`);

      const prompt4 = `
        ACT AS: A Viral Algorithmic Engineer for Substack.
        INPUT TEXT:
        """
        ${res3}
        """

        GOAL: Transform this text for maximum viral spread while keeping it simple.
        TEMP: 1.2 (High Entropy/Risk)

        VIRAL ALGORITHM REQUIREMENTS:
        1. SIMPLICITY: Use simple language that *everybody* understands. Grade 8 reading level.
        2. HOOKS: Ensure the first paragraph is physically impossible to stop reading.
        3. SUBSTACK STYLE: Personal, "insider" tone, slightly controversial or counter-narrative.
        4. FORMAT: Short paragraphs. Punchy sentences. Visual rhythm.
        5. MAGIC: Make the text feel "alive" and urgent.

        Ensure the core message remains, but the delivery is now highly infectious.
      `;

      const res4 = await generateContent(prompt4, 1.2);
      setLayer4(res4);
      addLog("LAYER 4 COMPLETE. Viral sequence finalized.");
      setStatus('complete');

    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "An unexpected error occurred during the Heating Protocol.");
      setStatus('error');
      addLog(`CRITICAL FAILURE: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  // --- RENDER: SETUP SCREEN ---
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Omega Security Check</h1>
          <p className="text-slate-400 text-center text-sm mb-6">
            This instance of Omega Writer requires a Gemini API Key to operate.
            Your key is stored locally in your browser and is never sent to our servers.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Google Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  onChange={(e) => setUserKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <Key className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Don't have one? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Get one here</a>.
              </p>
            </div>

            <button
              onClick={() => handleSaveKey(userKey)}
              disabled={!userKey}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                ${!userKey
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'}`}
            >
              <CheckCircle className="w-4 h-4" />
              Authenticate & Launch
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Thermometer className="text-orange-500 w-8 h-8" />
              OMEGA HEATING PROTOCOL
            </h1>
            <p className="text-slate-400 text-sm">Gradual Temperature Ascension Engine (0.2 → 1.2)</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
             {/* Key Reset Button for Deployed Versions */}
             {apiKey === "" && (
                <button
                  onClick={handleClearKey}
                  title="Reset API Key"
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
             )}

            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
              <div className={`w-2 h-2 rounded-full ${status === 'processing' ? 'bg-orange-500 animate-pulse' : status === 'complete' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              <span className="text-xs font-mono tracking-wider text-slate-400">
                {status === 'idle' ? 'SYSTEM COLD' : status === 'complete' ? 'MAX TEMP REACHED' : `HEATING... LAYER ${currentLayer}/4`}
              </span>
            </div>
          </div>
        </header>

        {/* Input Control Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Topic / Core Concept</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the subject to ignite..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none h-32"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Scope</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {lengthOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <button
                onClick={runHeatingProtocol}
                disabled={status === 'processing'}
                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                  ${status === 'processing'
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-orange-900/20 border border-orange-500/50'
                  }`}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    HEATING UP...
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5" />
                    IGNITE PROCESS
                  </>
                )}
              </button>

              {/* Status Log */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase">Thermal Log</span>
                </div>
                <div className="h-48 overflow-y-auto font-mono text-xs space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {logs.length === 0 && <span className="text-slate-600 italic">System Idle.</span>}
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-600">[{log.time}]</span>
                      <span className="text-orange-300">{log.message}</span>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">

             {/* Temperature Tabs */}
             <div className="grid grid-cols-4 border-b border-slate-800 mb-4 bg-slate-900/50 rounded-t-xl overflow-hidden">
              <button
                onClick={() => setActiveTab('layer1')}
                className={`py-3 text-xs md:text-sm font-medium border-b-2 transition-all flex flex-col md:flex-row items-center justify-center gap-2
                  ${activeTab === 'layer1' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <div className="flex items-center gap-1">
                    <span className="font-bold">0.2</span>
                    <span className="hidden md:inline">| Logic</span>
                </div>
                {status === 'processing' && currentLayer === 1 && <Loader2 className="w-3 h-3 animate-spin"/>}
                {layer1 && <CheckCircle className="w-3 h-3 text-blue-500/50"/>}
              </button>

              <button
                onClick={() => setActiveTab('layer2')}
                disabled={!layer2 && currentLayer < 2}
                className={`py-3 text-xs md:text-sm font-medium border-b-2 transition-all flex flex-col md:flex-row items-center justify-center gap-2
                  ${activeTab === 'layer2' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'}
                  ${!layer2 && currentLayer < 2 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
              >
                <div className="flex items-center gap-1">
                    <span className="font-bold">0.5</span>
                    <span className="hidden md:inline">| Flow</span>
                </div>
                {status === 'processing' && currentLayer === 2 && <Loader2 className="w-3 h-3 animate-spin"/>}
                {layer2 && <CheckCircle className="w-3 h-3 text-cyan-500/50"/>}
              </button>

              <button
                onClick={() => setActiveTab('layer3')}
                disabled={!layer3 && currentLayer < 3}
                className={`py-3 text-xs md:text-sm font-medium border-b-2 transition-all flex flex-col md:flex-row items-center justify-center gap-2
                  ${activeTab === 'layer3' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'}
                  ${!layer3 && currentLayer < 3 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
              >
                <div className="flex items-center gap-1">
                    <span className="font-bold">0.8</span>
                    <span className="hidden md:inline">| Soul</span>
                </div>
                {status === 'processing' && currentLayer === 3 && <Loader2 className="w-3 h-3 animate-spin"/>}
                {layer3 && <CheckCircle className="w-3 h-3 text-orange-500/50"/>}
              </button>

              <button
                onClick={() => setActiveTab('layer4')}
                disabled={!layer4 && currentLayer < 4}
                className={`py-3 text-xs md:text-sm font-medium border-b-2 transition-all flex flex-col md:flex-row items-center justify-center gap-2
                  ${activeTab === 'layer4' ? 'border-pink-500 text-pink-400 bg-pink-500/10' : 'border-transparent text-slate-500 hover:text-slate-300'}
                  ${!layer4 && currentLayer < 4 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
              >
                <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 hidden md:block" />
                    <span className="font-bold">1.2</span>
                    <span className="hidden md:inline">| VIRAL</span>
                </div>
                {status === 'processing' && currentLayer === 4 && <Loader2 className="w-3 h-3 animate-spin"/>}
                {layer4 && <CheckCircle className="w-3 h-3 text-pink-500/50"/>}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-b-xl p-6 relative overflow-hidden">

              {errorMsg && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                  <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400 mb-2">Thermal Failure</h3>
                    <p className="text-slate-300">{errorMsg}</p>
                    <button
                      onClick={() => setErrorMsg('')}
                      className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* View Output Logic */}
              <div className="h-full flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                       {activeTab === 'layer1' && <span className="text-xs font-bold text-blue-400">STRUCTURE & LOGIC</span>}
                       {activeTab === 'layer2' && <span className="text-xs font-bold text-cyan-400">FLOW & READABILITY</span>}
                       {activeTab === 'layer3' && <span className="text-xs font-bold text-orange-400">VOICE & INSIGHT</span>}
                       {activeTab === 'layer4' && <span className="text-xs font-bold text-pink-400 flex items-center gap-1"><Sparkles className="w-3 h-3"/> VIRAL WIZARD STATE</span>}
                    </div>
                    {(
                        (activeTab === 'layer1' && layer1) ||
                        (activeTab === 'layer2' && layer2) ||
                        (activeTab === 'layer3' && layer3) ||
                        (activeTab === 'layer4' && layer4)
                    ) && (
                        <button
                            onClick={() => {
                                if(activeTab === 'layer1') copyToClipboard(layer1);
                                if(activeTab === 'layer2') copyToClipboard(layer2);
                                if(activeTab === 'layer3') copyToClipboard(layer3);
                                if(activeTab === 'layer4') copyToClipboard(layer4);
                            }}
                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
                        >
                            <Share2 className="w-3 h-3" /> Copy
                        </button>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 prose prose-invert prose-sm max-w-none">
                    {activeTab === 'layer1' && (layer1 ? <div className="whitespace-pre-wrap">{layer1}</div> : <div className="h-full flex items-center justify-center text-slate-600 italic">Waiting to start...</div>)}
                    {activeTab === 'layer2' && (layer2 ? <div className="whitespace-pre-wrap">{layer2}</div> : <div className="h-full flex items-center justify-center text-slate-600 italic">Waiting for Layer 1...</div>)}
                    {activeTab === 'layer3' && (layer3 ? <div className="whitespace-pre-wrap">{layer3}</div> : <div className="h-full flex items-center justify-center text-slate-600 italic">Waiting for Layer 2...</div>)}
                    {activeTab === 'layer4' && (layer4 ? <div className="whitespace-pre-wrap font-medium text-slate-200">{layer4}</div> : <div className="h-full flex items-center justify-center text-slate-600 italic">Waiting for final wizardry...</div>)}
                 </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OmegaWriter;
