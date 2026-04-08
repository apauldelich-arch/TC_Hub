import React, { useState } from 'react';
import { dataService } from '../services/dataService';

const TrainingLog = ({ goToDashboard }) => {
  const [employees] = useState(dataService.getEmployees());
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [formData, setFormData] = useState({
    courseName: '',
    provider: '',
    website: '',
    cost: '',
    enrolmentDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    renewalType: '+ 730 Days (2 Years)',
    isBatch: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee.");
      return;
    }
    setIsSubmitting(true);
    
    setTimeout(() => {
      dataService.createTrainingRecords(formData, selectedEmployees);
      setIsSubmitting(false);
      goToDashboard();
    }, 800);
  };

  const isEnrolledOnly = !formData.completionDate;

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Log Training Record</h2>
        <p style={{ color: 'var(--text-muted)' }}>{isEnrolledOnly ? 'Registering a future enrolment (Living Record).' : 'Recording a completed certification.'}</p>
      </header>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Course / Certificate Name</label>
            <input 
              type="text" 
              name="courseName"
              className="glass" 
              placeholder="e.g. Health & Safety Level 3" 
              required 
              value={formData.courseName}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Training Provider</label>
              <input 
                type="text" 
                name="provider"
                className="glass" 
                placeholder="e.g. City Lab Training"
                required
                value={formData.provider}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Portal / Website</label>
              <input 
                type="url" 
                name="website"
                className="glass" 
                placeholder="https://..."
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Cost (£)</label>
              <input 
                type="number" 
                name="cost"
                className="glass" 
                placeholder="0.00"
                value={formData.cost}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Renewal Cycle</label>
              <select 
                name="renewalType"
                className="glass" 
                style={{ color: 'white' }}
                value={formData.renewalType}
                onChange={handleInputChange}
              >
                <option value="+ 730 Days (2 Years)">+ 730 Days (2 Years)</option>
                <option value="+ 365 Days (1 Year)">+ 365 Days (1 Year)</option>
                <option value="+ 90 Days (Quarterly)">+ 90 Days (Quarterly)</option>
                {/* NEW OPTION */}
                <option value="No expiration (Lifetime)">No expiration (Lifetime)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Enrolment Date</label>
              <input 
                type="date" 
                name="enrolmentDate"
                className="glass" 
                required
                value={formData.enrolmentDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Completion Date (Optional)</label>
              <input 
                type="date" 
                name="completionDate"
                className="glass"
                value={formData.completionDate}
                onChange={handleInputChange}
              />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                Leave blank to track this as a pending/in-progress enrolment.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="neon-border-secondary" 
            style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', cursor: 'pointer', background: isEnrolledOnly ? 'var(--primary)' : 'var(--secondary)', color: isEnrolledOnly ? 'white' : 'black', fontWeight: '700', fontSize: '1rem', border: 'none' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'PROCESSING...' : (isEnrolledOnly ? 'REGISTER ENROLMENT' : 'FINALIZE CERTIFICATION')}
          </button>
        </form>

        <div className="card glass">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Select Employees</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {employees.map(emp => (
              <div 
                key={emp.id}
                className={`nav-link ${selectedEmployees.includes(emp.id) ? 'active' : ''}`}
                style={{ border: '1px solid var(--glass-border)', padding: '0.8rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}
                onClick={() => toggleEmployee(emp.id)}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.role}</div>
                </div>
                {selectedEmployees.includes(emp.id) && <span style={{ color: 'var(--secondary)' }}>✓ Selected</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingLog;
