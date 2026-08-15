import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5002/api/script/generate';

function App() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('casual');
  const [duration, setDuration] = useState(5);
  const [script, setScript] = useState('');
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setScript('');
    setUsage(null);
    setLoading(true);

    try {
      const res = await axios.post(API_URL, { topic, tone, duration });
      setScript(res.data.script);
      setUsage(res.data.usage);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <header>
        <h1>ScriptAI</h1>
        <p className="sub">AI-powered YouTube script generator</p>
      </header>

      <form onSubmit={handleGenerate} className="card">
        <label>Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. how to brew better coffee at home"
          maxLength={200}
          required
        />

        <div className="row">
          <div className="field">
            <label>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="casual">Casual</option>
              <option value="professional">Professional</option>
              <option value="energetic">Energetic</option>
              <option value="educational">Educational</option>
            </select>
          </div>

          <div className="field">
            <label>Length (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              max={30}
            />
          </div>
        </div>

        <button type="submit" disabled={loading || !topic.trim()}>
          {loading ? 'Generating...' : 'Generate Script'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {script && (
        <div className="card">
          <div className="result-head">
            <h2>Your Script</h2>
            <button className="copy" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="script">{script}</pre>
          {usage && (
            <p className="usage">
              {usage.promptTokens} prompt + {usage.completionTokens} completion ={' '}
              {usage.totalTokens} tokens
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;