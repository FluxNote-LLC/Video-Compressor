'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ChevronRight, Code2, FileVideo, Minimize2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formats = ['MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'FLV', 'MPEG', 'MPG', 'TS', 'VOB', 'WMV'];
const size = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const pick = useCallback(() => input.current?.click(), []);
  const accept = useCallback((candidate?: File) => {
    if (!candidate) return;
    if (!formats.includes(candidate.name.split('.').pop()?.toUpperCase() || '')) { setError('Please choose a supported video format.'); return; }
    if (!candidate.size || candidate.size > 800 * 1024 * 1024) { setError('Choose a non-empty video up to 800 MB.'); return; }
    setError(''); setFile(candidate);
  }, []);
  const change = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { accept(event.target.files?.[0]); event.target.value = ''; }, [accept]);
  const drag = useCallback((event: React.DragEvent) => { event.preventDefault(); setDragging(true); }, []);
  const leave = useCallback((event: React.DragEvent) => { event.preventDefault(); setDragging(false); }, []);
  const drop = useCallback((event: React.DragEvent) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length > 1) { setError('Please select one video at a time.'); return; } accept(event.dataTransfer.files[0]); }, [accept]);
  const reset = useCallback(() => { setFile(null); setError(''); }, []);
  return <>
    <header className="site-header"><a className="brand" href="/" aria-label="Frame home"><span className="brand-icon"><Minimize2 size={21}/></span>frame<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><a className="active" href="#compress">Video compressor</a><a href="#how-it-works">How it works</a></nav><a className="source-link" href="#open-source"><Code2 size={17}/> Open source <ChevronRight size={15}/></a></header>
    <main><section className="workspace" id="compress"><div className="eyebrow"><span/> LESS SIZE. SAME STORY.</div><h1>Small file. <span>Big possibilities.</span></h1><p className="intro">Compress your videos for easier sharing, faster uploads,<br className="desktop-break"/> and a little more room for what’s next.</p>
    <input ref={input} type="file" accept={formats.map(f => `.${f.toLowerCase()}`).join(',')} onChange={change} className="sr-only" aria-label="Choose a video"/>
    {file ? <CompressionPanel file={file} onReset={reset}/> : <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={drag} onDragLeave={leave} onDrop={drop}><div className="upload-symbol"><FileVideo size={37} strokeWidth={1.4}/><span><ArrowUpFromLine size={15}/></span></div><h2>Your video, a little lighter.</h2><p>Drag and drop your video here</p><Button className="upload-button" onClick={pick}><ArrowUpFromLine size={18}/> Choose video</Button><span className="file-limit">or browse files · up to 800 MB</span></div>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="privacy"><ShieldCheck size={16}/> Your files stay on your device. Always.</div>
    <div className="formats"><span>WORKS WITH YOUR FAVORITE FORMATS</span><div>{formats.map(f => <span key={f}>{f}</span>)}</div></div>
    </section><section className="benefits" aria-label="Benefits"><div><ShieldCheck/><span><strong>Private by design</strong><p>No uploads. No servers storing your files.</p></span></div><div><Sparkles/><span><strong>Made to look good</strong><p>Find your balance of quality and file size.</p></span></div><div><Code2/><span><strong>Free. Open. Yours.</strong><p>No sign-ups, watermarks, or hidden fees.</p></span></div></section>
    <section id="how-it-works" className="details"><div><span className="section-label">THREE SIMPLE STEPS</span><h2>A lighter video in a few clicks.</h2></div><ol><li><b>01</b><span><strong>Choose your video</strong><p>Drop in a file from your device.</p></span></li><li><b>02</b><span><strong>Make it your size</strong><p>Choose your quality and resolution.</p></span></li><li><b>03</b><span><strong>Save and share</strong><p>Download your compressed MP4.</p></span></li></ol></section>
    <section id="open-source" className="open-source"><Code2/><h2>Small footprint. Open source.</h2><p>Frame’s application code is MIT licensed. The compression engine is powered by FFmpeg.wasm, with its own open-source licenses.</p><a href="/source.zip" download>Download source <ArrowDownToLine size={16}/></a><a href="https://ffmpegwasm.netlify.app/" target="_blank" rel="noreferrer">About the engine ↗</a></section>
    </main><footer><a className="brand" href="/">frame.</a><span>A little smaller. A lot more shareable.</span><span>Built for your browser.</span></footer>
  </>;
}

function CompressionPanel({ file, onReset }: { file: File; onReset: () => void }) {
  const [quality, setQuality] = useState('28');
  const [resolution, setResolution] = useState('original');
  const [status, setStatus] = useState<'idle' | 'loading' | 'working' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; bytes: number } | null>(null);
  const engine = useRef<import('@ffmpeg/ffmpeg').FFmpeg | null>(null);
  const generation = useRef(0);
  const busy = status === 'loading' || status === 'working';
  useEffect(() => () => { generation.current++; engine.current?.terminate(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  const changeQuality = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setQuality(e.target.value), []);
  const changeResolution = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setResolution(e.target.value), []);
  const cancel = useCallback(() => { generation.current++; engine.current?.terminate(); engine.current = null; setStatus('idle'); setProgress(0); }, []);
  const compress = useCallback(async () => {
    if (engine.current) return;
    const run = ++generation.current;
    setError(''); setResult(null); setProgress(0); setStatus('loading');
    let ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null;
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      if (run !== generation.current) return;
      ffmpeg = new FFmpeg(); engine.current = ffmpeg;
      ffmpeg.on('progress', ({ progress: value }) => { if (generation.current === run && Number.isFinite(value)) setProgress(Math.max(0, Math.min(99, Math.round(value * 100)))); });
      await ffmpeg.load({ classWorkerURL: '/ffmpeg/worker/worker.js', coreURL: '/ffmpeg/ffmpeg-core.js', wasmURL: '/ffmpeg/ffmpeg-core.wasm' });
      if (run !== generation.current) return;
      setStatus('working');
      const inputName = `input.${file.name.split('.').pop()?.toLowerCase()}`;
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
      const scale = resolution === 'original' ? 'scale=trunc(iw/2)*2:trunc(ih/2)*2' : `scale=w='min(iw,${resolution})':h='min(ih,${resolution})':force_original_aspect_ratio=decrease:force_divisible_by=2`;
      const code = await ffmpeg.exec(['-i', inputName, '-map', '0:v:0', '-map', '0:a:0?', '-vf', scale, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', quality, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', 'output.mp4']);
      if (code !== 0) throw new Error('encoding failed');
      const data = await ffmpeg.readFile('output.mp4');
      if (typeof data === 'string') throw new Error('invalid output');
      if (run !== generation.current) return;
      const blob = new Blob([new Uint8Array(data)], { type: 'video/mp4' });
      if (!blob.size) throw new Error('empty output');
      setResult({ url: URL.createObjectURL(blob), bytes: blob.size }); setProgress(100); setStatus('done');
    } catch {
      if (run === generation.current) { setError('We couldn’t compress this video. Try a smaller file or another format, and check that your browser has enough free memory.'); setStatus('idle'); }
    } finally {
      ffmpeg?.terminate();
      if (run === generation.current) engine.current = null;
    }
  }, [file, quality, resolution]);
  return <div className="compression-panel">
    <div className="file-row"><FileVideo/><div><strong>{file.name}</strong><span>{size(file.size)} · MP4 output</span></div><Button variant="ghost" size="icon" onClick={onReset} disabled={busy} aria-label="Remove video"><X/></Button></div>
    <div className="controls"><label>Compression<select value={quality} onChange={changeQuality} disabled={busy}><option value="23">Light · best quality</option><option value="28">Balanced · recommended</option><option value="34">Strong · smaller file</option></select></label><label>Resolution<select value={resolution} onChange={changeResolution} disabled={busy}><option value="original">Keep original</option><option value="1920">Fit within 1920 × 1920</option><option value="1280">Fit within 1280 × 1280</option><option value="854">Fit within 854 × 854</option></select></label></div>
    <p className="hint">Videos keep their aspect ratio and are never upscaled. Large files may exceed your browser’s memory. Compression can take several minutes.</p>
    {busy && <div aria-live="polite"><div className="progress-row"><span>{status === 'loading' ? 'Preparing compression engine…' : 'Compressing your video…'}</span><span>{status === 'working' ? `${progress}%` : ''}</span></div><progress max="100" value={status === 'working' ? progress : undefined} aria-label="Compression progress"/><p className="hint">Keep this tab open. The first run loads a ~32 MB engine.</p></div>}
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className="result" role="status"><strong><Check size={18}/>{result.bytes < file.size ? `${Math.round((1 - result.bytes / file.size) * 100)}% smaller. Ready to share.` : 'Done. This video didn’t get smaller.'}</strong><p>{size(file.size)} → {size(result.bytes)}</p>{result.bytes >= file.size && <p>Try stronger compression or a lower resolution.</p>}</div>}
    <div className="actions">{busy ? <Button variant="outline" onClick={cancel}>Cancel compression</Button> : <Button className="upload-button" onClick={compress}><Minimize2 size={17}/>{result ? 'Compress again' : 'Compress video'}</Button>}{result && <a className="download" href={result.url} download={`${file.name.replace(/\.[^.]+$/, '')}-compressed.mp4`}><ArrowDownToLine size={16}/> Download MP4</a>}</div>
  </div>;
}
