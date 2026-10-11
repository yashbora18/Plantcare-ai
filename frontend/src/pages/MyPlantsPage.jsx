import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Droplets,
  Sun,
  MapPin,
  Trash2,
  Edit,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../styles/plants.css';

const CATEGORIES = ['All', 'Foliage', 'Succulent', 'Herb', 'Vegetable', 'Flower', 'Fern', 'Tree'];

export default function MyPlantsPage() {
  const { addToast } = useToast();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    category: 'Foliage',
    location_type: 'indoor',
    sunlight_requirement: 'Bright indirect light',
    watering_frequency_days: 7,
    soil_type: 'Well-draining potting soil with perlite',
    care_notes: '',
    status: 'healthy',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation !== 'all') params.location = selectedLocation;
      const data = await api.getPlants(params);
      setPlants(data);
    } catch (err) {
      addToast(err.message || 'Could not load plants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, [search, selectedCategory, selectedLocation]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.common_name) {
      addToast('Please enter a common name for your plant.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create plant record
      const created = await api.createPlant({
        ...formData,
        watering_frequency_days: parseInt(formData.watering_frequency_days, 10),
      });

      // 2. Upload image if selected
      if (photoFile) {
        await api.uploadPlantImage(created.id, photoFile);
      }

      addToast(`Added ${created.common_name} to your garden!`, 'success');
      setAddModalOpen(false);
      resetForm();
      loadPlants();
    } catch (err) {
      addToast(err.message || 'Failed to create plant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e, plantId, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${name}" from your garden?`)) {
      try {
        await api.deletePlant(plantId);
        addToast(`Removed ${name}`, 'info');
        if (detailModalOpen && selectedPlant?.id === plantId) {
          setDetailModalOpen(false);
        }
        loadPlants();
      } catch (err) {
        addToast(err.message || 'Failed to delete plant', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      common_name: '',
      scientific_name: '',
      category: 'Foliage',
      location_type: 'indoor',
      sunlight_requirement: 'Bright indirect light',
      watering_frequency_days: 7,
      soil_type: 'Well-draining potting soil with perlite',
      care_notes: '',
      status: 'healthy',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const openDetail = (plant) => {
    setSelectedPlant(plant);
    setDetailModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            <span>My Plants Collection</span>
            <Sprout size={28} color="var(--accent-fresh)" />
          </h1>
          <p className="page-subtitle">
            Manage your garden plants, review watering cycles, and track botanical health.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setAddModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} /> Add Plant
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="plants-filter-bar">
        <div className="search-box-wrap">
          <Search size={18} />
          <input
            type="text"
            className="search-box-input"
            placeholder="Search plants by common or scientific name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="select-control"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="balcony">Balcony</option>
            <option value="greenhouse">Greenhouse</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="filter-pills-row" style={{ marginBottom: '2rem' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plants Grid */}
      {loading ? (
        <div className="plants-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '340px' }} />
          ))}
        </div>
      ) : plants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Sprout size={36} />
          </div>
          <h3>No Plants Found</h3>
          <p>
            {search || selectedCategory !== 'All'
              ? 'Try clearing your search query or filters.'
              : 'Your garden is ready to grow! Add your first houseplant, vegetable, or herb.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setAddModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
          >
            <Plus size={18} /> Add Your First Plant
          </button>
        </div>
      ) : (
        <div className="plants-grid">
          {plants.map((plant) => {
            const daysWater = plant.days_until_next_water;
            let waterBadgeClass = 'badge-leaf';
            let waterText = `Water in ${daysWater}d`;
            if (daysWater <= 0) {
              waterBadgeClass = 'badge-danger';
              waterText = 'Water Today!';
            } else if (daysWater <= 2) {
              waterBadgeClass = 'badge-warning';
              waterText = `Water in ${daysWater}d`;
            }

            return (
              <div
                key={plant.id}
                className="plant-card"
                onClick={() => openDetail(plant)}
                style={{ cursor: 'pointer' }}
              >
                <div className="plant-image-container">
                  {plant.image_url ? (
                    <img
                      src={plant.image_url}
                      alt={plant.common_name}
                      className="plant-card-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Sprout size={48} className="plant-img-fallback" />
                  )}

                  <div className="plant-status-floating">
                    <span
                      className={`badge ${
                        plant.status === 'healthy'
                          ? 'badge-healthy'
                          : plant.status === 'needs_attention'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {plant.status}
                    </span>
                  </div>
                </div>

                <div className="plant-card-body">
                  <h3 className="plant-common-name">{plant.common_name}</h3>
                  <div className="plant-botanical-name">
                    {plant.scientific_name || plant.category}
                  </div>

                  <div className="plant-meta-row">
                    <span className="plant-meta-item">
                      <Sun size={14} color="var(--accent-fresh)" />
                      <span>{plant.sunlight_requirement?.split(' ')[0] || 'Sun'}</span>
                    </span>
                    <span className="plant-meta-item">
                      <MapPin size={14} color="var(--accent-earth)" />
                      <span style={{ textTransform: 'capitalize' }}>{plant.location_type}</span>
                    </span>
                  </div>

                  <div className="plant-watering-status">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Every {plant.watering_frequency_days} days
                    </span>
                    <span className={`badge ${waterBadgeClass}`}>
                      <Droplets size={12} />
                      <span>{waterText}</span>
                    </span>
                  </div>

                  <div className="plant-card-actions">
                    <button
                      onClick={(e) => handleDelete(e, plant.id, plant.common_name)}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--status-danger)', padding: '0.35rem 0.65rem' }}
                      title="Delete Plant"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(plant);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Plant Modal */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sprout size={22} color="var(--accent-fresh)" />
                <span>Add Plant to Garden</span>
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {/* Photo Upload Dropzone */}
                <div className="form-group">
                  <label className="form-label">Plant Photo (Optional)</label>
                  <div
                    style={{
                      border: '2px dashed var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      textAlign: 'center',
                      background: 'var(--bg-surface-alt)',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('plant-photo-input').click()}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{ maxHeight: '140px', borderRadius: 'var(--radius-sm)', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                        <Upload size={24} color="var(--accent-fresh)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Click to select a photo from your device
                        </span>
                      </div>
                    )}
                    <input
                      id="plant-photo-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoSelect}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Common Name *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Monstera Deliciosa, Sweet Basil"
                    value={formData.common_name}
                    onChange={(e) => setFormData({ ...formData, common_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Scientific Name (Optional)</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Ocimum basilicum"
                      value={formData.scientific_name}
                      onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="select-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <select
                      className="select-control"
                      value={formData.location_type}
                      onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    >
                      <option value="indoor">Indoor (Living room/windowsill)</option>
                      <option value="outdoor">Outdoor (Garden bed/yard)</option>
                      <option value="balcony">Balcony Container</option>
                      <option value="greenhouse">Greenhouse</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Watering Cycle (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      className="input-control"
                      value={formData.watering_frequency_days}
                      onChange={(e) => setFormData({ ...formData, watering_frequency_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sunlight Requirements</label>
                  <select
                    className="select-control"
                    value={formData.sunlight_requirement}
                    onChange={(e) => setFormData({ ...formData, sunlight_requirement: e.target.value })}
                  >
                    <option value="Full Sun (6+ hrs direct)">Full Sun (6+ hrs direct)</option>
                    <option value="Bright indirect light">Bright indirect light</option>
                    <option value="Partial shade (3-5 hrs)">Partial shade (3-5 hrs)</option>
                    <option value="Low light tolerant">Low light tolerant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Soil & Pot Mix Notes</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Chunky aroid mix, Cactus soil, Rich compost"
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Personal Care Notes</label>
                  <textarea
                    className="textarea-control"
                    placeholder="Special pruning instructions, propagation date, or feeding quirks..."
                    value={formData.care_notes}
                    onChange={(e) => setFormData({ ...formData, care_notes: e.target.value })}
                  />
                </div>

                <div style={{ background: 'var(--badge-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--accent-fresh)' }}>
                  <Info size={16} />
                  <span>Adding a plant automatically initializes its recurring watering schedule and health check task.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving Plant...' : 'Save to Garden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plant Detail View Modal */}
      {detailModalOpen && selectedPlant && (
        <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Sprout size={22} color="var(--accent-fresh)" />
                <span>{selectedPlant.common_name}</span>
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="plant-detail-header-row">
                {selectedPlant.image_url ? (
                  <img
                    src={selectedPlant.image_url}
                    alt={selectedPlant.common_name}
                    className="detail-img-thumb"
                  />
                ) : (
                  <div
                    className="detail-img-thumb"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Sprout size={36} color="var(--accent-fresh)" />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {selectedPlant.common_name}
                  </div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {selectedPlant.scientific_name || 'Botanical name unlisted'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-leaf">{selectedPlant.category}</span>
                    <span className="badge badge-earth">{selectedPlant.location_type}</span>
                    <span className="badge badge-healthy">{selectedPlant.status}</span>
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Care Profile</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Sunlight:</span>
                  <div>{selectedPlant.sunlight_requirement}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Watering Frequency:</span>
                  <div>Every {selectedPlant.watering_frequency_days} days</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Soil Type:</span>
                  <div>{selectedPlant.soil_type || 'Standard potting mix'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Added On:</span>
                  <div>{new Date(selectedPlant.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {selectedPlant.care_notes && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>Notes:</h4>
                  <div style={{ background: 'var(--bg-surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                    {selectedPlant.care_notes}
                  </div>
                </div>
              )}

              {/* Active Care Schedules */}
              <div style={{ marginTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem' }}>Active Care Schedules:</h4>
                <div className="detail-schedule-list">
                  {selectedPlant.schedules?.map((sched) => (
                    <div key={sched.id} className="schedule-list-item">
                      <div>
                        <strong>{sched.task_type.toUpperCase()}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Every {sched.frequency_days} days
                        </div>
                      </div>
                      <span className="badge badge-leaf">
                        Next: {new Date(sched.next_due_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={(e) => handleDelete(e, selectedPlant.id, selectedPlant.common_name)}
                className="btn btn-danger btn-sm"
              >
                <Trash2 size={14} /> Remove Plant
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
