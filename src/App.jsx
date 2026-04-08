import React, { useState, useEffect, useMemo } from 'react';
import EmployeeVault from './components/EmployeeVault';
import TrainingLog from './components/TrainingLog';
import { dataService } from './services/dataService';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'vault', label: 'Employee Vault', icon: '👥' },
    { id: 'log', label: 'Training Log', icon: '➕' },
    { id: 'centers', label: 'Training Centers', icon: '🏢' },
    { id: 'calendar', label: 'Horizon Calendar', icon: '📅' },
  ];

  return (
    <div className="sidebar glass">
      <div className="logo-section" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
          Itero<span className="neon-text-secondary">TC</span>
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>v1.0.0 Precision H&S</p>
      </div>

      <nav style={{ flex: 1 }}>
        {links.map((link) => (
          <div
            key={link.id}
            className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
            onClick={() => setActiveTab(link.id)}
          >
            <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
            <span>{link.label}</span>
          </div>
        ))}
      </nav>

      <div className="footer-section" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
        <div className="nav-link" style={{ fontSize: '0.85rem' }}>
          <span>ℹ️</span> Project Manifesto
        </div>
      </div>
    </div>
  );
};

const YearPicker = ({ selectedYear, setSelectedYear }) => {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const logs = dataService.getLogs();
    const yearsInLogs = logs
      .map(log => log.expiryDate ? new Date(log.expiryDate).getFullYear() : null)
      .filter(y => y !== null);
    const baseYears = [currentYear - 1, currentYear, currentYear, currentYear + 1, currentYear + 2];
    const combined = [...baseYears, ...yearsInLogs];
    return Array.from(new Set(combined)).sort((a, b) => a - b);
  }, [currentYear]);

  return (
    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '10px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', maxWidth: '400px', justifyContent: 'flex-end' }}>
      {years.map(y => (
        <button key={y} onClick={() => setSelectedYear(y)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: selectedYear === y ? 'var(--primary)' : 'transparent', color: selectedYear === y ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' }}>
          {y}
        </button>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [stats, setStats] = useState(dataService.getDashboardStats(currentYear));

  useEffect(() => {
    setStats(dataService.getDashboardStats(selectedYear));
  }, [selectedYear]);

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Operational Overview</h2>
          <p style={{ color: 'var(--text-muted)' }}>Traceable training compliance {selectedYear > currentYear ? `(Future View: ${selectedYear})` : ''}</p>
        </div>
        <YearPicker selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card glass">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Total Compliance</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{stats.compliancePercentage}%</div>
          <div style={{ color: 'var(--status-green)', fontSize: '0.8rem', marginTop: '0.5rem' }}>General Readiness High</div>
        </div>
        <div className="card glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10px', right: '15px', fontSize: '0.65rem', background: 'var(--secondary)', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>FISCAL {selectedYear}</div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Annual Training Spend: {selectedYear}</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--secondary)' }}>£{stats.totalSpend.toLocaleString()}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Audited for active completion dates.</div>
        </div>
        <div className="card glass">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Renewal Horizon</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: stats.expiringCount > 0 ? 'var(--status-amber)' : 'white' }}>{stats.expiringCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Impending (30 Days)</div>
        </div>
      </div>
    </div>
  );
};

// UPDATED: Training Center Index with EDIT functionality
const CentersView = () => {
  const [centers, setCenters] = useState(dataService.getUniqueCenters());
  const [editingCenter, setEditingCenter] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', website: '' });

  const startEdit = (center) => {
    setEditingCenter(center.name);
    setEditFormData({ name: center.name, website: center.website });
  };

  const handleSave = () => {
    if (window.confirm(`Update center to "${editFormData.name}"? This will retroactively update all training records linked to this provider.`)) {
      dataService.updateCenterDetails(editingCenter, editFormData.name, editFormData.website);
      setEditingCenter(null);
      setCenters(dataService.getUniqueCenters());
    }
  };

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Training Center Index</h2>
        <p style={{ color: 'var(--text-muted)' }}>Centralized catalog of all providers. Edits propagate globally.</p>
      </header>

      <div className="card glass" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', width: '25%' }}>Provider Name</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', width: '40%' }}>Training Courses Offered</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', width: '35%', textAlign: 'right' }}>Official Portal / Actions</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((center) => (
              <tr key={center.name} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                <td style={{ padding: '1.2rem 1.5rem', verticalAlign: 'top' }}>
                  {editingCenter === center.name ? (
                    <input 
                      type="text" 
                      value={editFormData.name} 
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                      className="glass"
                      style={{ padding: '6px', border: '1px solid var(--primary)', borderRadius: '4px', width: '100%', color: 'white' }}
                    />
                  ) : (
                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{center.name}</div>
                  )}
                </td>
                <td style={{ padding: '1.2rem 1.5rem', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {center.courses.map(course => ( <span key={course} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{course}</span> ))}
                  </div>
                </td>
                <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right', verticalAlign: 'top' }}>
                  {editingCenter === center.name ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                       <input 
                        type="text" 
                        value={editFormData.website} 
                        onChange={e => setEditFormData({...editFormData, website: e.target.value})}
                        placeholder="Portal URL..."
                        className="glass"
                        style={{ padding: '6px', border: '1px solid var(--primary)', borderRadius: '4px', width: '200px', color: 'white', fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSave} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>SAVE</button>
                        <button onClick={() => setEditingCenter(null)} style={{ background: 'none', color: 'white', border: '1px solid var(--glass-border)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                       <button onClick={() => startEdit(center)} style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>Edit Provider</button>
                       {center.website && (
                         <a href={center.website} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--secondary)', color: 'black', fontSize: '0.75rem', fontWeight: '700', borderRadius: '6px', textDecoration: 'none' }}>VISIT ↗</a>
                       )}
                    </div>
                  )}
                </td>
              </tr>
            )) }
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HorizonCalendar = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const crises = dataService.getYearlyRenewals(selectedYear);
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(selectedYear, i, 1);
    months.push({ name: d.toLocaleString('default', { month: 'long' }), year: d.getFullYear(), monthIdx: i });
  }

  const formatDateLong = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Horizon Calendar</h2>
          <p style={{ color: 'var(--text-muted)' }}>January to December Strategic Renewal View ({selectedYear}).</p>
        </div>
        <YearPicker selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, auto)', gap: '1.2rem' }}>
        {months.map(m => {
          const monthCrises = crises.filter(c => {
             const d = new Date(c.expiryDate);
             return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
          });
          const isCurrentMonth = new Date().getMonth() === m.monthIdx && new Date().getFullYear() === m.year;
          return (
            <div key={`${m.name}-${m.year}`} className="card glass" style={{ padding: '1.2rem', background: isCurrentMonth ? 'rgba(157, 80, 187, 0.05)' : 'rgba(255,255,255,0.02)', minHeight: '180px', display: 'flex', flexDirection: 'column', border: isCurrentMonth ? '1px solid var(--primary)' : '1px solid var(--glass-border)' }}>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: '700' }}>{m.name}</div>
                {isCurrentMonth && <div style={{ fontSize: '0.6rem', background: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>NOW</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '120px' }}>
                {monthCrises.length === 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}><span style={{ fontSize: '0.8rem' }}>✅</span> Clear</div> : 
                  monthCrises.map(c => (
                    <div key={c.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', borderRadius: '8px', borderLeft: `3px solid ${c.daysLeft < 0 ? 'var(--status-red)' : 'var(--status-amber)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{c.courseName}</div>
                        <div style={{ fontSize: '0.65rem', color: c.daysLeft < 0 ? 'var(--status-red)' : 'var(--secondary)', fontWeight: '800' }}>{formatDateLong(c.expiryDate)}</div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}><span>{c.employeeName}</span><span style={{ fontSize: '0.55rem', opacity: 0.7 }}>RENEWAL DUE</span></div>
                    </div>
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'vault' && <EmployeeVault />}
        {activeTab === 'log' && <TrainingLog goToDashboard={() => setActiveTab('dashboard')} />}
        {activeTab === 'centers' && <CentersView />}
        {activeTab === 'calendar' && <HorizonCalendar />}
      </main>
    </div>
  );
}

export default App;
