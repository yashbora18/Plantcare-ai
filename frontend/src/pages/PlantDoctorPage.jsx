import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Droplets,
  Sun,
  Layers,
  Bug,
  Save,
  Clock,
  History,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAiStatus } from '../context/AiStatusContext';
import OfflineAiNotice from '../components/common/OfflineAiNotice';
import '../styles/doctor.css';

const SYMPTOM_OPTIONS = [
  'Yellowing leaves (chlorosis)',
  'Brown or crispy leaf tips',
  'Wilting / drooping stems',
  'White powdery mildew spots',
  'Black or dark leaf blotches',
  'Stunted or slow growth',
  'Holes in foliage / chewing marks',
  'Sticky residue or spider webs',
  'Foul smell from soil / root rot signs',
];

export default function PlantDoctorPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { aiStatus } = useAiStatus();

  const [userPlants, setUserPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('diagnose'); // 'diagnose' | 'history'

  useEffect(() => {
    async function loadData() {
      try {
        const [plants, history] = await Promise.all([
          api.getPlants(),
          api.getAssessmentHistory(),
        ]);
        setUserPlants(plants);
        setAssessmentHistory(history);
      } catch (err) {
        console.error('Failed to load doctor initial data', err);
      }
    }
    loadData();
  }, []);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitDiagnosis = async (e) => {
    e.preventDefault();
    if (!imageFile && selectedSymptoms.length === 0 && !customSymptom) {
      addToast('Please provide either a leaf photo or describe symptoms.', 'warning');
      return;
    }

    if (!aiStatus.available) {
      addToast('Local Ollama AI service is offline. Please start Ollama before diagnosing.', 'error');
      return;
    }

    setAnalyzing(true);
    setDiagnosis(null);

    const formData = new FormData();
    if (imageFile) {
      formData.append('file', imageFile);
    }

    const symptomsList = [...selectedSymptoms];
    if (customSymptom) symptomsList.push(customSymptom);
    formData.append('symptoms', symptomsList.join('; '));

    if (selectedPlantId) {
      formData.append('plant_id', selectedPlantId);
    }

    try {
      const result = await api.diagnosePlant(formData);
      setDiagnosis(result);
      addToast('AI analysis completed successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Diagnosis failed. Check your local AI connection.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!diagnosis) return;
    setSaving(true);
    try {
      const symptomsList = [...selectedSymptoms];
      if (customSymptom) symptomsList.push(customSymptom);

      await api.saveAssessment({
        plant_id: selectedPlantId ? parseInt(selectedPlantId, 10) : null,
        symptoms_input: symptomsList.join('; '),
        analysis: diagnosis,
      });

      addToast('Diagnosis saved to plant history!', 'success');
      // Refresh history
      const updated = await api.getAssessmentHistory();
      setAssessmentHistory(updated);
    } catch (err) {
      addToast(err.message || 'Failed to save assessment', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <span>AI Plant Doctor</span>
            <Stethoscope size={28} color="var(--status-danger)" />
          </h1>
          <p className="page-subtitle">
            Local open-weight botanical diagnostics. Identify diseases, root issues, and pests safely on-device.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('diagnose')}
            className={`btn ${activeTab === 'diagnose' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <Stethoscope size={15} /> New Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            <History size={15} /> Assessment History ({assessmentHistory.length})
          </button>
        </div>
      </div>

      {/* Offline Alert if Ollama not running */}
      {!aiStatus.available && (
        <OfflineAiNotice title="Start Ollama to Run AI Plant Doctor" />
      )}

      {activeTab === 'diagnose' ? (
        <div className="doctor-layout">
          {/* Left: Input Form */}
          <div className="botanical-card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem' }}>
              1. Provide Plant Photo & Observed Symptoms
            </h3>

            <form onSubmit={handleSubmitDiagnosis}>
              {/* Linked Plant Selector */}
              <div className="form-group">
                <label className="form-label">Affected Plant in Your Collection</label>
                <select
                  className="select-control"
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                >
                  <option value="">-- General Assessment (Not in Collection) --</option>
                  {userPlants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.common_name} ({p.category}, {p.location_type})
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Selecting a plant helps the AI consider its specific watering frequency and location.
                </span>
              </div>

              {/* Photo Upload Dropzone */}
              <div className="form-group">
                <label className="form-label">Leaf or Stem Photo (Upload or Drag & Drop)</label>
                <div
                  className="leaf-dropzone"
                  onClick={() => document.getElementById('doctor-leaf-file').click()}
                >
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Leaf preview"
                        className="dropzone-preview"
                      />
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-fresh)' }}>
                        Click to change photo
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--badge-bg)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-fresh)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Upload size={24} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        Upload leaf or damaged plant photo
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Supports JPG, PNG, WEBP (Max 10MB)
                      </div>
                    </div>
                  )}

                  <input
                    id="doctor-leaf-file"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Symptom Tag Selector */}
              <div className="form-group">
                <label className="form-label">Observed Symptoms (Select all that apply)</label>
                <div className="symptom-tag-grid">
                  {SYMPTOM_OPTIONS.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <div
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`symptom-checkbox-tag ${isSelected ? 'selected' : ''}`}
                      >
                        <span style={{ fontSize: '0.9rem' }}>{isSelected ? '✓' : '+'}</span>
                        <span>{sym}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Symptom Input */}
              <div className="form-group">
                <label className="form-label">Additional Symptoms or Notes</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Started 4 days ago after heavy rain, potting mix smells sour..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', marginTop: '1rem' }}
              >
                {analyzing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Running Local Open-Weight Inference...</span>
                  </div>
                ) : (
                  <>
                    <Stethoscope size={18} />
                    <span>Analyze Plant Health</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Diagnosis Result Display */}
          <div>
            {analyzing && (
              <div className="botanical-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-medium)', borderTopColor: 'var(--accent-fresh)', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
                <h3>Analyzing Botanical Symptoms...</h3>
                <p style={{ maxWidth: '420px', margin: '0.5rem auto 0', fontSize: '0.9rem' }}>
                  Your locally hosted model ({aiStatus.configured_model}) is evaluating leaf tissue distress and environmental stressors.
                </p>
              </div>
            )}

            {!analyzing && !diagnosis && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Stethoscope size={36} />
                </div>
                <h3>Doctor is Ready</h3>
                <p>
                  Upload a photo or select symptoms on the left to receive an AI botanical diagnosis.
                </p>
              </div>
            )}

            {!analyzing && diagnosis && (
              <div className="diagnosis-card">
                <div className="diagnosis-header-row">
                  <div>
                    <span
                      className={`badge ${
                        diagnosis.severity === 'healthy'
                          ? 'badge-healthy'
                          : diagnosis.severity === 'mild'
                          ? 'badge-leaf'
                          : diagnosis.severity === 'moderate'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                      style={{ textTransform: 'capitalize', marginBottom: '0.5rem' }}
                    >
                      Severity: {diagnosis.severity}
                    </span>
                    <h2 className="diagnosis-primary-issue">{diagnosis.primary_issue}</h2>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Confidence Score: {Math.round(diagnosis.confidence_score * 100)}%
                    </div>
                  </div>

                  <button
                    onClick={handleSaveToHistory}
                    disabled={saving}
                    className="btn btn-outline btn-sm"
                  >
                    <Save size={15} />
                    {saving ? 'Saving...' : 'Save to History'}
                  </button>
                </div>

                {/* Visible Symptoms */}
                {diagnosis.visible_symptoms?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="diagnosis-section-title">
                      <AlertTriangle size={16} /> Visible Symptoms Identified:
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {diagnosis.visible_symptoms.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Possible Causes */}
                {diagnosis.possible_causes?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="diagnosis-section-title">
                      <Layers size={16} /> Possible Root Causes:
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {diagnosis.possible_causes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Steps */}
                {diagnosis.recommended_steps?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="diagnosis-section-title">
                      <CheckCircle2 size={16} /> Recommended Action Plan:
                    </div>
                    <div className="diagnosis-steps-list">
                      {diagnosis.recommended_steps.map((step, idx) => (
                        <div key={idx} className="diagnosis-step-item">
                          <span className="step-num-badge">{idx + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Care Adjustments */}
                {diagnosis.care_adjustments && (
                  <div>
                    <div className="diagnosis-section-title">
                      <Droplets size={16} /> Care Adjustments:
                    </div>
                    <div className="adjustments-grid">
                      <div className="adjustment-box">
                        <h5><Droplets size={14} /> Watering</h5>
                        <p>{diagnosis.care_adjustments.watering || 'Maintain standard schedule'}</p>
                      </div>
                      <div className="adjustment-box">
                        <h5><Sun size={14} /> Sunlight</h5>
                        <p>{diagnosis.care_adjustments.sunlight || 'Maintain current light'}</p>
                      </div>
                      <div className="adjustment-box">
                        <h5><Layers size={14} /> Soil & Roots</h5>
                        <p>{diagnosis.care_adjustments.soil || 'Ensure good pot drainage'}</p>
                      </div>
                      <div className="adjustment-box">
                        <h5><Bug size={14} /> Pest Treatment</h5>
                        <p>{diagnosis.care_adjustments.pest_management || 'No pests detected'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expert Alert if Severe */}
                {diagnosis.expert_consultation_needed && (
                  <div className="expert-alert-box">
                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Consultation Recommended:</strong> This issue exhibits characteristics of aggressive bacterial blight or severe viral pathogen. If symptoms spread, bring a sample to your local agricultural extension service.
                    </div>
                  </div>
                )}

                <div className="disclaimer-banner">
                  {diagnosis.disclaimer ||
                    'Notice: AI plant assessments are estimates based on observed symptoms and should not replace professional horticultural diagnosis.'}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div>
          {assessmentHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <History size={36} />
              </div>
              <h3>No Past Assessments</h3>
              <p>You haven't saved any plant health assessments yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assessmentHistory.map((item) => (
                <div key={item.id} className="botanical-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                      <span className={`badge ${item.severity === 'healthy' ? 'badge-healthy' : item.severity === 'mild' ? 'badge-leaf' : 'badge-warning'}`}>
                        {item.severity}
                      </span>
                      <strong style={{ fontSize: '1.15rem' }}>{item.primary_issue}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {item.plant_name ? `Plant: ${item.plant_name} • ` : ''}
                      Assessed on {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDiagnosis({
                        primary_issue: item.primary_issue,
                        severity: item.severity,
                        confidence_score: item.confidence_score,
                        visible_symptoms: item.visible_symptoms,
                        possible_causes: item.possible_causes,
                        recommended_steps: item.recommended_steps,
                        care_adjustments: item.care_adjustments,
                        preventive_measures: item.preventive_measures,
                        expert_consultation_needed: item.expert_consultation_needed,
                      });
                      setActiveTab('diagnose');
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    View Diagnosis
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
