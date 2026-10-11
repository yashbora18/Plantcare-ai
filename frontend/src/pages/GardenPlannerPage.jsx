import React, { useState, useEffect } from 'react';

import {

  Compass,

  Sprout,

  Sun,

  Layers,

  DollarSign,

  Save,

  CheckCircle2,

  Calendar,

  Sparkles,

  ArrowRight,

  ArrowLeft,

  Trash2,

  History,

} from 'lucide-react';

import { api } from '../services/api';

import { useToast } from '../context/ToastContext';

import { useAiStatus } from '../context/AiStatusContext';

import OfflineAiNotice from '../components/common/OfflineAiNotice';

import '../styles/planner.css';



export default function GardenPlannerPage() {

  const { addToast } = useToast();

  const { aiStatus } = useAiStatus();



  const [activeTab, setActiveTab] = useState('wizard'); // 'wizard' | 'saved'

  const [currentStep, setCurrentStep] = useState(1);

  const [generating, setGenerating] = useState(false);

  const [saving, setSaving] = useState(false);

  const [generatedPlan, setGeneratedPlan] = useState(null);

  const [savedPlans, setSavedPlans] = useState([]);



  // Form State

  const [formData, setFormData] = useState({

    location_zone: 'Zone 7b (Subtropical / Moderate Frost)',

    space_type: 'balcony',

    sunlight_level: 'Full Sun (6+ hrs direct)',

    soil_type: 'Potting Mix with Organic Compost & Perlite',

    budget_level: 'moderate',

    preferences: 'Culinary cooking herbs, salad greens, and pollinator-friendly blooms',

  });



  const loadSavedPlans = async () => {

    try {

      const plans = await api.getGardenPlans();

      setSavedPlans(plans);

    } catch (err) {

      console.error('Could not load saved plans', err);

    }

  };



  useEffect(() => {

    loadSavedPlans();

  }, []);



  const handleGeneratePlan = async () => {

  if (!formData.location_zone.trim()) {

    addToast('Please enter your growing zone or climate.', 'error');

    return;

  }



  if (!formData.preferences.trim()) {

    addToast('Please enter your planting preferences.', 'error');

    return;

  }



  setGenerating(true);

  setGeneratedPlan(null);



  try {

    const plan = await api.generateGardenPlan(formData);



    if (

      !plan ||

      !plan.title ||

      !Array.isArray(plan.recommended_plants)

    ) {

      throw new Error(

        'The API returned an invalid garden plan. Check the backend response.'

      );

    }



    setGeneratedPlan(plan);

    addToast('Personalized garden plan generated!', 'success');

  } catch (err) {

    console.error('Garden plan generation failed:', err);



    addToast(

      err.message || 'Failed to generate your garden plan.',

      'error'

    );

  } finally {

    setGenerating(false);

  }

};





  const handleSavePlan = async () => {
    if (!generatedPlan) {
      addToast('Generate a garden plan before saving it.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        ...generatedPlan,
        title: generatedPlan.title || 'My Garden Plan',
      };
      const savedPlan = await api.saveGardenPlan(payload);
      setSavedPlans((prev) => [savedPlan, ...prev]);
      addToast('Garden plan saved to your collection.', 'success');
      setActiveTab('saved');
    } catch (err) {
      console.error('Garden plan save failed:', err);
      addToast(err.message || 'Failed to save garden plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (e, planId) => {

    e.stopPropagation();

    if (window.confirm('Delete this saved garden plan?')) {

      try {

        await api.deleteGardenPlan(planId);

        setSavedPlans((prev) => prev.filter((p) => p.id !== planId));

        addToast('Garden plan deleted', 'info');

      } catch (err) {

        addToast(err.message || 'Failed to delete plan', 'error');

      }

    }

  };



  return (

    <div>

      <div className="page-header">

        <div>

          <h1>

            <span>Smart Garden Planner</span>

            <Compass size={28} color="var(--accent-fresh)" />

          </h1>

          <p className="page-subtitle">

            AI permaculture layouts tailored to your exact microclimate, sunlight, and available space.

          </p>

        </div>



        <div style={{ display: 'flex', gap: '0.5rem' }}>

          <button

            onClick={() => setActiveTab('wizard')}

            className={`btn ${activeTab === 'wizard' ? 'btn-primary' : 'btn-outline'} btn-sm`}

          >

            <Compass size={15} /> Plan Generator

          </button>

          <button

            onClick={() => setActiveTab('saved')}

            className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-outline'} btn-sm`}

          >

            <History size={15} /> Saved Plans ({savedPlans.length})

          </button>

        </div>

      </div>



      {!aiStatus.available && (

        <OfflineAiNotice title="Start Ollama to Run Smart Garden Planner" />

      )}



      {activeTab === 'wizard' ? (

        <div>

          {/* Multi-step Planning Wizard */}

          <div className="planner-wizard-wrap">

            <div className="wizard-steps-indicator">

              <div className={`wizard-step-node ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>

                <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>

                <span className="step-label">Space & Zone</span>

              </div>



              <div className={`wizard-step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>

                <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>

                <span className="step-label">Sun & Soil</span>

              </div>



              <div className={`wizard-step-node ${currentStep === 3 ? 'active' : ''}`}>

                <div className="step-circle">3</div>

                <span className="step-label">Preferences</span>

              </div>

            </div>



            {/* Step 1: Space & Zone */}

            {currentStep === 1 && (

              <div>

                <h3 style={{ marginBottom: '1rem' }}>Step 1: Where are you growing?</h3>



                <div className="form-group">

                  <label className="form-label">Growing Zone or Climate Description</label>

                  <input

                    type="text"

                    className="input-control"

                    placeholder="e.g. Zone 7b, Mediterranean, Tropical, Cool Temperate"

                    value={formData.location_zone}

                    onChange={(e) => setFormData({ ...formData, location_zone: e.target.value })}

                  />

                  <span className="form-hint">

                    If unsure, describe your winter temperature (e.g., mild winters, heavy snow, frost-free).

                  </span>

                </div>



                <div className="form-group" style={{ marginTop: '1.25rem' }}>

                  <label className="form-label">Growing Space Type</label>

                  <div className="option-cards-grid">

                    {[

                      { id: 'balcony', title: 'Balcony', desc: 'Railing pots & small planters' },

                      { id: 'container', title: 'Containers', desc: 'Pots on patio or porch' },

                      { id: 'raised_bed', title: 'Raised Bed', desc: '4x4 or 4x8 garden boxes' },

                      { id: 'outdoor_garden', title: 'Yard Garden', desc: 'Direct in-ground garden beds' },

                      { id: 'indoor', title: 'Indoor / Windowsill', desc: 'Herb boxes in sunny room' },

                    ].map((opt) => (

                      <div

                        key={opt.id}

                        onClick={() => setFormData({ ...formData, space_type: opt.id })}

                        className={`option-card-radio ${formData.space_type === opt.id ? 'selected' : ''}`}

                      >

                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{opt.title}</strong>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{opt.desc}</span>

                      </div>

                    ))}

                  </div>

                </div>



                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>

                  <button onClick={() => setCurrentStep(2)} className="btn btn-primary">

                    <span>Next: Sunlight & Soil</span>

                    <ArrowRight size={16} />

                  </button>

                </div>

              </div>

            )}



            {/* Step 2: Sun & Soil */}

            {currentStep === 2 && (

              <div>

                <h3 style={{ marginBottom: '1rem' }}>Step 2: Sunlight & Soil Conditions</h3>



                <div className="form-group">

                  <label className="form-label">Direct Daily Sunlight</label>

                  <select

                    className="select-control"

                    value={formData.sunlight_level}

                    onChange={(e) => setFormData({ ...formData, sunlight_level: e.target.value })}

                  >

                    <option value="Full Sun (6+ hrs direct)">Full Sun (6+ hours of uninterrupted light)</option>

                    <option value="Partial Shade (3-6 hrs)">Partial Shade (3 to 6 hours of morning/afternoon sun)</option>

                    <option value="Bright Indirect Light">Bright Indirect Light (Filtered or bright ambient)</option>

                    <option value="Dappled / Low Light">Dappled / Low Light (Under trees or north-facing)</option>

                  </select>

                </div>



                <div className="form-group" style={{ marginTop: '1.25rem' }}>

                  <label className="form-label">Soil Mixture or Type</label>

                  <select

                    className="select-control"

                    value={formData.soil_type}

                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}

                  >

                    <option value="Potting Mix with Organic Compost & Perlite">Potting Mix with Organic Compost & Perlite (Standard)</option>

                    <option value="Loamy Garden Soil (Rich and fertile)">Loamy Garden Soil (Rich and fertile)</option>

                    <option value="Sandy / Well Draining Soil">Sandy / Well Draining Soil</option>

                    <option value="Dense Clay Soil">Dense Clay Soil (Needs aeration & organic matter)</option>

                    <option value="Raised Bed Blend (1/3 Compost, 1/3 Peat/Coco, 1/3 Vermiculite)">Raised Bed Mel's Mix Blend</option>

                  </select>

                </div>



                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>

                  <button onClick={() => setCurrentStep(1)} className="btn btn-outline">

                    <ArrowLeft size={16} />

                    <span>Back</span>

                  </button>

                  <button onClick={() => setCurrentStep(3)} className="btn btn-primary">

                    <span>Next: Goals & Preferences</span>

                    <ArrowRight size={16} />

                  </button>

                </div>

              </div>

            )}



            {/* Step 3: Goals & Budget */}

            {currentStep === 3 && (

              <div>

                <h3 style={{ marginBottom: '1rem' }}>Step 3: Goals, Budget & Preferred Plants</h3>



                <div className="form-group">

                  <label className="form-label">Planting Preferences & Goals</label>

                  <textarea

                    className="textarea-control"

                    rows="3"

                    placeholder="e.g. Fresh cooking herbs (basil, thyme), small cherry tomatoes, flowers that attract bees, easy maintenance..."

                    value={formData.preferences}

                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}

                  />

                </div>



                <div className="form-group" style={{ marginTop: '1.25rem' }}>

                  <label className="form-label">Budget Level</label>

                  <div className="option-cards-grid">

                    {[

                      { id: 'budget', title: 'Budget Friendly', desc: 'Seeds, recycled pots, homemade compost' },

                      { id: 'moderate', title: 'Moderate', desc: 'Standard nursery starts, fabric pots, organic fertilizer' },

                      { id: 'premium', title: 'Premium', desc: 'Self-watering planters, drip irrigation, heirloom starts' },

                    ].map((b) => (

                      <div

                        key={b.id}

                        onClick={() => setFormData({ ...formData, budget_level: b.id })}

                        className={`option-card-radio ${formData.budget_level === b.id ? 'selected' : ''}`}

                      >

                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{b.title}</strong>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.desc}</span>

                      </div>

                    ))}

                  </div>

                </div>



                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>

                  <button onClick={() => setCurrentStep(2)} className="btn btn-outline">

                    <ArrowLeft size={16} />

                    <span>Back</span>

                  </button>



                  <button

                    onClick={handleGeneratePlan}

                    disabled={generating}

                    className="btn btn-primary btn-lg"

                  >

                    {generating ? (

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />

                        <span>Generating Custom Garden Plan...</span>

                      </div>

                    ) : (

                      <>

                        <Sparkles size={18} />

                        <span>Generate Garden Plan with AI</span>

                      </>

                    )}

                  </button>

                </div>

              </div>

            )}

          </div>



          {/* Generated Plan Display */}

          {generatedPlan && (

            <div className="plan-container animate-fade-in">

              <div className="plan-header">

                <div>

                  <span className="badge badge-leaf" style={{ marginBottom: '0.5rem' }}>

                    Personalized Permaculture Plan

                  </span>

                  <h2 style={{ fontSize: '1.85rem' }}>{generatedPlan.title}</h2>

                  <p style={{ marginTop: '0.45rem', fontSize: '1rem', maxWidth: '680px' }}>

                    {generatedPlan.summary}

                  </p>

                </div>



                <button

                  onClick={handleSavePlan}

                  disabled={saving}

                  className="btn btn-primary"

                >

                  <Save size={16} />

                  <span>{saving ? 'Saving...' : 'Save Plan to My Collection'}</span>

                </button>

              </div>



              {/* Recommended Plants Grid */}

              <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                <Sprout size={20} color="var(--accent-fresh)" /> Recommended Plants & Companion Pairings:

              </h3>

              <div className="recommended-plants-grid">

                {generatedPlan.recommended_plants?.map((plant, idx) => (

                  <div key={idx} className="recommended-plant-item">

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>

                      <strong style={{ fontSize: '1.1rem' }}>{plant.name}</strong>

                      <span className="badge badge-healthy">{plant.difficulty}</span>

                    </div>



                    <div style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>

                      {plant.scientific_name}

                    </div>



                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>

                      {plant.why_recommended}

                    </div>



                    <div style={{ marginTop: 'auto', fontSize: '0.82rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>

                      <div><strong>Sun:</strong> {plant.sunlight}</div>

                      <div><strong>Water:</strong> {plant.watering}</div>

                      {plant.companion_plants?.length > 0 && (

                        <div style={{ marginTop: '0.35rem' }}>

                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Companions: </span>

                          <div className="companions-tag-row">

                            {plant.companion_plants.map((comp, cIdx) => (

                              <span key={cIdx} className="companion-tag">{comp}</span>

                            ))}

                          </div>

                        </div>

                      )}

                    </div>

                  </div>

                ))}

              </div>



              {/* Preparation Steps */}

              {generatedPlan.preparation_steps?.length > 0 && (

                <div style={{ marginTop: '2.5rem' }}>

                  <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                    <Layers size={20} color="var(--color-earth-brown)" /> Soil & Space Preparation Steps:

                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

                    {generatedPlan.preparation_steps.map((step, idx) => (

                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.92rem' }}>

                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--badge-bg)', color: 'var(--accent-fresh)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>

                          {idx + 1}

                        </span>

                        <span>{step}</span>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {/* Seasonal Planting Windows */}

              {generatedPlan.planting_windows && Object.keys(generatedPlan.planting_windows).length > 0 && (

                <div style={{ marginTop: '2.5rem' }}>

                  <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

                    <Calendar size={20} color="var(--accent-fresh)" /> Seasonal Planting Windows:

                  </h3>

                  <div className="seasonal-windows-grid">

                    {Object.entries(generatedPlan.planting_windows).map(([season, action], idx) => (

                      <div key={idx} className="season-box">

                        <h5>{season}</h5>

                        <p>{action}</p>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {/* Maintenance Schedule */}

              {generatedPlan.maintenance_schedule?.length > 0 && (

                <div style={{ marginTop: '2.5rem' }}>

                  <h3 style={{ marginBottom: '0.75rem' }}>Ongoing Maintenance Tasks:</h3>

                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>

                    {generatedPlan.maintenance_schedule.map((item, idx) => (

                      <li key={idx} style={{ marginBottom: '0.35rem' }}>{item}</li>

                    ))}

                  </ul>

                </div>

              )}

            </div>

          )}

        </div>

      ) : (

        /* Saved Plans Tab */

        <div>

          {savedPlans.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">

                <Compass size={36} />

              </div>

              <h3>No Saved Garden Plans Yet</h3>

              <p>Use the Plan Generator wizard to generate and save your first personalized plan.</p>

              <button onClick={() => setActiveTab('wizard')} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>

                Create Garden Plan

              </button>

            </div>

          ) : (

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>

              {savedPlans.map((plan) => (

                <div key={plan.id} className="botanical-card" style={{ display: 'flex', flexDirection: 'column' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>

                    <span className="badge badge-leaf" style={{ textTransform: 'capitalize' }}>

                      {plan.space_type}

                    </span>

                    <button

                      onClick={(e) => handleDeletePlan(e, plan.id)}

                      style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}

                      title="Delete Plan"

                    >

                      <Trash2 size={16} />

                    </button>

                  </div>



                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{plan.title}</h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>

                    {plan.summary}

                  </p>



                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>

                    <div>Zone: {plan.location_zone || 'Not specified'}</div>

                    <div>Saved on {new Date(plan.created_at).toLocaleDateString()}</div>

                  </div>



                  <button

                    onClick={() => {

                      setGeneratedPlan({

                        title: plan.title,

                        summary: plan.summary,

                        recommended_plants: plan.recommended_plants,

                        preparation_steps: plan.preparation_steps,

                        planting_windows: plan.planting_windows,

                        maintenance_schedule: plan.maintenance_schedule,

                      });

                      setActiveTab('wizard');

                    }}

                    className="btn btn-outline btn-sm"

                    style={{ marginTop: '1rem' }}

                  >

                    View Full Plan

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
