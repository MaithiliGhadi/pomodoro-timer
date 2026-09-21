import { useState, useEffect, useRef } from 'react';
import './App.css';

// --- LIVELY ANIMATED BACKGROUND THEMES ---
const themes = {
  "Live Galaxy": "https://i.pinimg.com/originals/09/a3/52/09a3521d09e59ed1e8a8b1399e82c5f1.gif",
  "Lofi Study Girl": "https://i.pinimg.com/originals/a4/f2/cb/a4f2cb80ff2ae2772e80bf30e9d78d4c.gif",
  "Pixel Art Rain": "https://i.pinimg.com/originals/32/30/b7/3230b77626359fdd77cbaeb9cb712792.gif",
  "Neon Cyberpunk": "https://i.pinimg.com/originals/82/bf/45/82bf450098f98c8c2059a43a859c7820.gif"
};

export default function App() {
  // --- THEME STATE ---
  const [currentTheme, setCurrentTheme] = useState(themes["Live Galaxy"]);

  // --- TIMER STATE ---
  const [sessionType, setSessionType] = useState('Work');
  const [remainingTime, setRemainingTime] = useState(25 * 60 * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [workSessions, setWorkSessions] = useState(0);

  // --- SETTINGS STATE ---
  const [workInput, setWorkInput] = useState(25);
  const [shortInput, setShortInput] = useState(5);
  const [longInput, setLongInput] = useState(15);
  const [btnText, setBtnText] = useState("Set Custom Timer");
  const [btnStyle, setBtnStyle] = useState({});

  // --- REFS (Timer & Canvas) ---
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff7675');
  const [brushSize, setBrushSize] = useState(5);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1000);
      }, 1000);
    } else if (isRunning && remainingTime <= 0) {
      clearInterval(interval);
      handleSessionSwitch();
    }
    return () => clearInterval(interval);
  }, [isRunning, remainingTime]);

  const handleSessionSwitch = () => {
    const audio = new Audio("https://www.soundjay.com/button/beep-07.wav");
    audio.play();

    if (sessionType === 'Work') {
      const newSessions = workSessions + 1;
      setWorkSessions(newSessions);
      if (newSessions % 4 === 0) {
        setSessionType('Long Break');
        setRemainingTime(longInput * 60 * 1000);
      } else {
        setSessionType('Short Break');
        setRemainingTime(shortInput * 60 * 1000);
      }
    } else {
      setSessionType('Work');
      setRemainingTime(workInput * 60 * 1000);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSessionType('Work');
    setRemainingTime(workInput * 60 * 1000);
    setWorkSessions(0);
  };

  const applySettings = () => {
    setIsRunning(false);
    if (sessionType === 'Work') setRemainingTime(workInput * 60 * 1000);
    else if (sessionType === 'Short Break') setRemainingTime(shortInput * 60 * 1000);
    else setRemainingTime(longInput * 60 * 1000);

    setBtnText("Timer Updated! ✅");
    setBtnStyle({ 
      background: "rgba(85, 239, 196, 0.2)", 
      color: "#55efc4", 
      borderColor: "#55efc4", 
      boxShadow: "0 0 15px rgba(85, 239, 196, 0.3)" 
    });
    
    setTimeout(() => {
      setBtnText("Set Custom Timer");
      setBtnStyle({});
    }, 2000);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // --- CANVAS LOGIC ---
  useEffect(() => {
    if (sessionType === 'Long Break' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 600;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctxRef.current = ctx;
    }
  }, [sessionType]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (ctxRef.current) ctxRef.current.beginPath();
  };

  const draw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.lineWidth = brushSize;
    ctxRef.current.lineCap = "round";
    ctxRef.current.strokeStyle = brushColor;

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.fillStyle = "white";
      ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <>
      {/* Animated Wallpaper Layer */}
      <div 
        className="stars" 
        style={{ 
          backgroundImage: `url(${currentTheme})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="twinkling"></div>
      
      <main className="dashboard">
        <section className="panel timer-panel">
          <h1>Focus Timer</h1>
          <div className="timer">
            <span id="session-type">{sessionType}</span>
            <div id="time">{formatTime(remainingTime)}</div>
          </div>
          <div className="controls">
            <button onClick={toggleTimer}>{isRunning ? 'Stop' : 'Start'}</button>
            <button onClick={resetTimer}>Reset</button>
          </div>

          <div className="settings">
            <div className="input-group">
              <label>Work</label>
              <input type="number" value={workInput} onChange={(e) => setWorkInput(e.target.value)} min="1" />
            </div>
            <div className="input-group">
              <label>Short</label>
              <input type="number" value={shortInput} onChange={(e) => setShortInput(e.target.value)} min="1" />
            </div>
            <div className="input-group">
              <label>Long</label>
              <input type="number" value={longInput} onChange={(e) => setLongInput(e.target.value)} min="1" />
            </div>
          </div>

          {/* THEME SELECTION DROPDOWN */}
          <div className="theme-row">
            <label htmlFor="theme-select">Theme Background</label>
            <select 
              id="theme-select"
              value={currentTheme} 
              onChange={(e) => setCurrentTheme(e.target.value)}
            >
              {Object.keys(themes).map((themeName) => (
                <option key={themeName} value={themes[themeName]}>
                  {themeName}
                </option>
              ))}
            </select>
          </div> 


      {/* THEME SELECTION DROPDOWN */}
          <div className="theme-row">
            <label htmlFor="theme-select">Theme Background</label>
            <select 
              id="theme-select"
              value={currentTheme} 
              onChange={(e) => setCurrentTheme(e.target.value)}
            >
              {Object.keys(themes).map((themeName) => (
                <option key={themeName} value={themes[themeName]}>
                  {themeName}
                </option>
              ))}
            </select>
          </div> 

          <button className="apply-btn" style={btnStyle} onClick={applySettings}>{btnText}</button> 
          <div className="statistics">
            <p>Sessions: <span className="highlight">{workSessions}</span></p>
          </div>
        </section>

        <section className="panel spotify-panel">
          <h2>Study Playlist</h2>
          <div className="spotify-container">
            <iframe 
              style={{ borderRadius: '12px' }} 
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0" 
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowFullScreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            ></iframe>
          </div>
        </section>

        <section className="panel game-panel">
          {sessionType !== 'Long Break' ? (
            <div id="focus-message">
              <h2>Stay Focused! 🚀</h2>
              <p>Your doodle space will unlock during your 15-minute Long Break.</p>
            </div>
          ) : (
            <div id="drawing-workspace">
              <h2>Long Break: Doodle Space 🎨</h2>
              <div className="canvas-container">
                <canvas 
                  ref={canvasRef} 
                  onMouseDown={startDrawing} 
                  onMouseUp={stopDrawing} 
                  onMouseMove={draw} 
                  onMouseOut={stopDrawing} 
                />
              </div>
              <div className="drawing-controls">
                <label>Color:</label>
                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                <label>Brush Size:</label>
                <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(e.target.value)} />
                <button id="clear-canvas" onClick={clearCanvas}>Clear Board</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}