import React, { useMemo, useState } from "react";
import "../style/WorkflowImage.css";
import { analyzeImage, generateImage } from "../utils/apiHelpers";
import ImageCard from "./ImageCard";
import {
  IMAGE_ANALYSIS_MODELS,
  IMAGE_GENERATION_MODELS,
  STYLE_PRESETS,
} from "../utils/constant";
import usePersistentState from "../hooks/usePersistentState";

const buildFriendlyError = (error) => {
  const message = error?.message || "Image generation failed";

  if (error?.status === 401 || error?.code === "HF_AUTH_INVALID") {
    return {
      message,
      title: "Image generation needs Hugging Face setup",
      steps: [
        "Create or refresh a Hugging Face User Access Token with inference access.",
        "Save it as HF_TOKEN in my-app/.env and restart the dev server.",
        "Check your Hugging Face inference provider settings if auto-routing keeps selecting a provider you cannot use.",
      ],
    };
  }

  return {
    message,
    title: "",
    steps: [],
  };
};

function WorkflowImage({ appTheme, setAppTheme }) {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = usePersistentState("pear-image-analysis", "");
  const [images, setImages] = useState([]);
  const [history, setHistory] = usePersistentState("pear-image-history", []);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [setupHint, setSetupHint] = useState(null);
  const [style, setStyle] = usePersistentState(
    "pear-image-style",
    STYLE_PRESETS[0].id,
  );
  const [analysisModel, setAnalysisModel] = usePersistentState(
    "pear-image-analysis-model",
    IMAGE_ANALYSIS_MODELS[0].id,
  );
  const [generationModel, setGenerationModel] = usePersistentState(
    "pear-image-generation-model",
    IMAGE_GENERATION_MODELS[0].id,
  );
  const [variationCount, setVariationCount] = usePersistentState(
    "pear-image-variation-count",
    3,
  );
  const [detailLevel, setDetailLevel] = usePersistentState(
    "pear-image-detail-level",
    "balanced",
  );
  const [lastPrompt, setLastPrompt] = usePersistentState("pear-image-prompt", "");
  const [historyQuery, setHistoryQuery] = useState("");
  const isLoading = loadingAction !== "";

  const styles = STYLE_PRESETS;
  const filteredHistory = useMemo(() => {
    if (!historyQuery.trim()) {
      return history;
    }

    const query = historyQuery.toLowerCase();

    return history.filter((item) =>
      [item.type, item.model, item.content]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [history, historyQuery]);
  const stats = [
    { label: "Saved Runs", value: history.length },
    { label: "Ready Variations", value: images.length || variationCount },
    { label: "Analysis Words", value: analysis.split(/\s+/).filter(Boolean).length || 0 },
  ];

  // Upload Image
  const handleUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFile(reader.result);
      setImages([]);
      setAnalysis("");
      setLastPrompt("");
      setError("");
      setSetupHint(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Analyze Image
  const handleAnalyze = async () => {
    if (!file) {
      setError("Upload an image first");
      return;
    }

    try {
      setLoadingAction("Analyzing image...");
      setError("");
      setSetupHint(null);

      const result = await analyzeImage(file, {
        model: analysisModel,
        detail: detailLevel,
      });

      setAnalysis(result);
      setHistory((prev) => [
        {
          id: Date.now(),
          type: "analysis",
          model:
            IMAGE_ANALYSIS_MODELS.find((item) => item.id === analysisModel)
              ?.label || analysisModel,
          content: result,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err.message || "Failed to analyze image");
      setSetupHint(null);
    } finally {
      setLoadingAction("");
    }
  };

  // Generate Images
  const handleGenerate = async () => {
    if (!analysis) {
      setError("Analyze image first");
      return;
    }

    try {
      setLoadingAction("Generating variations...");
      setError("");
      setSetupHint(null);

      const finalPrompt = `${analysis}\nCreate a polished variation in ${
        styles.find((item) => item.id === style)?.label || style
      } style.`;
      setLastPrompt(finalPrompt);

      const results = [];

      for (let index = 0; index < variationCount; index += 1) {
        setLoadingAction(
          `Generating variation ${index + 1} of ${variationCount}...`,
        );
        const result = await generateImage(finalPrompt, {
          style,
          model: generationModel,
        });
        results.push(result);
      }

      setImages(results);
      setHistory((prev) => [
        {
          id: Date.now() + 1,
          type: "generation",
          model:
            IMAGE_GENERATION_MODELS.find((item) => item.id === generationModel)
              ?.label || generationModel,
          content: finalPrompt,
        },
        ...prev,
      ]);
    } catch (err) {
      const friendlyError = buildFriendlyError(err);
      setError(friendlyError.message || "Image generation failed");
      setSetupHint(friendlyError.steps.length > 0 ? friendlyError : null);
    } finally {
      setLoadingAction("");
    }
  };

  // Download Image
  const downloadImage = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-image.png";
    link.click();
  };

  // Copy Prompt
  const copyPrompt = () => {
    navigator.clipboard.writeText(lastPrompt || analysis);
  };

  const restoreHistoryItem = (item) => {
    if (item.type === "analysis") {
      setAnalysis(item.content);
      setImages([]);
      setLastPrompt("");
    } else {
      setLastPrompt(item.content);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const resetWorkspace = () => {
    setFile(null);
    setAnalysis("");
    setImages([]);
    setLastPrompt("");
    setError("");
    setSetupHint(null);
    setHistoryQuery("");
  };

  const activeStep = images.length > 0 ? 3 : analysis ? 2 : file ? 1 : 0;

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "style-lab-history.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`image-app ${appTheme}`}>
      <header className="image-header">
        <div>
          <h2>Image To Variations Workflow</h2>
          <p className="subhead">Image → Analysis → Variation Generation</p>
        </div>
        <button
          className="btn secondary"
          onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
        >
          {appTheme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      <div className="stats-grid">
        {stats.map((item) => (
          <div key={item.label} className="stat-card">
            <span className="stat-card__label">{item.label}</span>
            <strong className="stat-card__value">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="page-sections">
        <a href="#image-workflow" className="page-section page-section--active">
          Upload Page
        </a>
        <a href="#image-results" className="page-section">
          Results Page
        </a>
        <a href="#image-history" className="page-section">
          History Page
        </a>
      </div>

      <div className="steps">
        <span className={activeStep >= 1 ? "active" : ""}>1. Upload</span>
        <span className={activeStep >= 2 ? "active" : ""}>2. Analyze</span>
        <span className={activeStep >= 3 ? "active" : ""}>3. Variations</span>
      </div>

      <div id="image-workflow" className="workflow-layout">
        <div className="workflow-panel">
          <h3>Controls</h3>
          <div className="controls">
            <input type="file" accept="image/*" onChange={handleUpload} />

            <select
              value={analysisModel}
              onChange={(e) => setAnalysisModel(e.target.value)}
              className="select"
            >
              {IMAGE_ANALYSIS_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  Analyze: {model.label}
                </option>
              ))}
            </select>

            <select
              value={generationModel}
              onChange={(e) => setGenerationModel(e.target.value)}
              className="select"
            >
              {IMAGE_GENERATION_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  Generate: {model.label}
                </option>
              ))}
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="select"
            >
              {styles.map((item) => (
                <option key={item.id} value={item.id}>
                  Style: {item.label}
                </option>
              ))}
            </select>

            <select
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value)}
              className="select"
            >
              <option value="balanced">Analysis: Balanced</option>
              <option value="brief">Analysis: Brief</option>
              <option value="high">Analysis: Detailed</option>
            </select>

            <select
              value={variationCount}
              onChange={(e) => setVariationCount(Number(e.target.value))}
              className="select"
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count} variation{count > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="action-row">
            <button
              className="btn primary"
              onClick={handleAnalyze}
              disabled={isLoading || !file}
            >
              Analyze Image
            </button>
            <button
              className="btn primary"
              onClick={handleGenerate}
              disabled={isLoading || !analysis}
            >
              Generate Variations
            </button>
            <button className="btn secondary" onClick={resetWorkspace}>
              Reset Workspace
            </button>
          </div>

          {file ? (
            <div className="upload-preview">
              <p className="label">Uploaded Image</p>
              <img src={file} alt="Uploaded preview" className="preview-image" />
            </div>
          ) : (
            <p className="placeholder">
              Upload an image to begin the analysis workflow.
            </p>
          )}
        </div>

        <div className="workflow-panel">
          <h3>Results Section</h3>
          {analysis ? (
            <>
              <div className="analysis-box">
                <h4>Image Analysis</h4>
                <p>{analysis}</p>
                <p className="analysis-meta">
                  Vision model:{" "}
                  {
                    IMAGE_ANALYSIS_MODELS.find(
                      (item) => item.id === analysisModel,
                    )?.label
                  }
                </p>
              </div>

              <div className="analysis-box">
                <h4>Variation Prompt</h4>
                <p>{lastPrompt || "Generate variations to build the final prompt."}</p>
                <button className="btn secondary" onClick={copyPrompt}>
                  Copy Prompt
                </button>
              </div>
            </>
          ) : (
            <p className="placeholder">
              Your image analysis and variation prompt will appear here.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="error-panel">
          <p className="error">{error}</p>
          {setupHint && (
            <div className="setup-hint">
              <h4>{setupHint.title}</h4>
              {setupHint.steps.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div id="image-results" className="results-panel">
          <div className="results-header">
            <div>
              <h3>Generated Variations</h3>
              <p className="subhead">
                Displaying {images.length} result
                {images.length > 1 ? "s" : ""} based on the uploaded image
              </p>
            </div>
          </div>

          <div className="results-grid">
            {images.map((img, index) => (
              <div key={index} className="result-card">
                <ImageCard
                  image={img.imageUrl}
                  loading={isLoading}
                  enhancedPrompt={img.finalPrompt}
                  originalPrompt={lastPrompt}
                />
                <button
                  className="btn secondary"
                  onClick={() => downloadImage(img.imageUrl)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="image-history" className="history">
        <div className="history-header">
          <h3>Workflow History</h3>
          <div className="history-toolbar">
            <input
              type="text"
              className="input history-search"
              placeholder="Search history..."
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
            />
            <button className="btn secondary" onClick={exportHistory}>
              Export
            </button>
            <button className="btn secondary" onClick={clearHistory}>
              Clear
            </button>
          </div>
        </div>

        {filteredHistory.map((item) => (
          <div key={item.id} className="history-item">
            <p className="history-kind">
              {item.type === "analysis" ? "Analysis" : "Generation"} ·{" "}
              {item.model}
            </p>
            <p>{item.content}</p>
            <div className="history-actions">
              <button
                className="btn secondary"
                onClick={() => restoreHistoryItem(item)}
              >
                Open In Workspace
              </button>
              <button
                className="btn secondary"
                onClick={() => navigator.clipboard.writeText(item.content || "")}
              >
                Copy Entry
              </button>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="page-loader">
          <div className="page-loader__orb"></div>
          <div className="page-loader__orb page-loader__orb--delay"></div>
          <div className="page-loader__panel">
            <div className="page-loader__spinner"></div>
            <h3>Working On Your Media</h3>
            <p>{loadingAction}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowImage;
