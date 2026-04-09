import React, { useState, useMemo } from 'react';
import { dataService } from '../services/dataService';

const EmployeeVault = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [completionDateInput, setCompletionDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmpData, setNewEmpData] = useState({ name: '', role: '' });
  
  const [employees, setEmployees] = useState(dataService.getEmployees());

  // Credential Management State
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [editingPortalKey, setEditingPortalKey] = useState(null);
  const [tempCred, setTempCred] = useState({ portal: '', user: '', pass: '' });

  const refreshList = () => {
    setEmployees(dataService.getEmployees());
    if (selectedEmployee) {
      const updated = dataService.getEmployees(true).find(e => e.id === selectedEmployee.id);
      setSelectedEmployee(updated);
    }
  };

  const history = useMemo(() => {
    return selectedEmployee ? dataService.getEmployeeHistory(selectedEmployee.id) : [];
  }, [selectedEmployee]);

  const handleComplete = (e) => {
    e.preventDefault();
    if (showCompleteModal && completionDateInput) {
      const log = history.find(l => l.id === showCompleteModal);
      if (log && log.status === 'Completed') {
        dataService.updateTrainingRecord(showCompleteModal, { 
          completionDate: completionDateInput, 
          expiryDate: expiryDateInput 
        });
      } else {
        dataService.completeRecord(showCompleteModal, completionDateInput, expiryDateInput);
      }
      setShowCompleteModal(null);
      setExpiryDateInput('');
      refreshList();
    }
  };

  const startEditLog = (log) => {
    setShowCompleteModal(log.id);
    setCompletionDateInput(log.completionDate || new Date().toISOString().split('T')[0]);
    setExpiryDateInput(log.expiryDate || '');
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (newEmpData.name) {
      dataService.addEmployee(newEmpData.name, newEmpData.role);
      setNewEmpData({ name: '', role: '' });
      setIsAddingEmployee(false);
      refreshList();
    }
  };

  const handleArchive = (id) => {
    if (window.confirm("Archive this employee? They will be hidden from all active views, but history is preserved for audit.")) {
      dataService.archiveEmployee(id);
      setSelectedEmployee(null);
      refreshList();
    }
  };

  const handleSaveCreds = (e) => {
    e.preventDefault();
    if (tempCred.portal && tempCred.user) {
      dataService.updateEmployeeCredentials(selectedEmployee.id, tempCred.portal, tempCred.user, tempCred.pass);
      setIsEditingCreds(false);
      setEditingPortalKey(null);
      setTempCred({ portal: '', user: '', pass: '' });
      refreshList();
    }
  };

  const startEditCred = (portal, creds) => {
    setEditingPortalKey(portal);
    setTempCred({ portal: portal, user: creds.user, pass: creds.pass });
    setIsEditingCreds(true);
  };

  const handleDeleteCred = (portal) => {
    if (window.confirm(`Delete credentials for ${portal}?`)) {
      dataService.deleteEmployeeCredential(selectedEmployee.id, portal);
      refreshList();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="view-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Employee Vault</h2>
          <p style={{ color: 'var(--text-muted)' }}>Secure credential management and live training status.</p>
        </div>
        <button 
          onClick={() => setIsAddingEmployee(true)}
          className="neon-border-primary"
          style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: 'var(--primary)', color: 'white', fontWeight: '700' }}
        >
          + Add Staff
        </button>
      </header>

      {isAddingEmployee && (
        <div className="card glass" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Full Name</label>
              <input type="text" value={newEmpData.name} onChange={e => setNewEmpData({...newEmpData, name: e.target.value})} placeholder="e.g. John Doe" className="glass" style={{ width: '100%', padding: '10px', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Role / Department</label>
              <input type="text" value={newEmpData.role} onChange={e => setNewEmpData({...newEmpData, role: e.target.value})} placeholder="e.g. Mechanical Op" className="glass" style={{ width: '100%', padding: '10px', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} />
            </div>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px', background: 'var(--secondary)', color: 'black', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Create Profile</button>
            <button type="button" onClick={() => setIsAddingEmployee(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px' }}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card glass" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Employee</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tracking</th>
              <th style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const empHistory = dataService.getEmployeeHistory(emp.id);
              const inProgressCount = empHistory.filter(l => l.status === 'Enrolled').length;
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => { setSelectedEmployee(emp); setIsEditingCreds(false); }} className="table-row-hover">
                  <td style={{ padding: '1.2rem 1.5rem', fontWeight: '500' }}>{emp.name}</td>
                  <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>{emp.role || 'Staff Member'}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span title="Credentials Saved" style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>🔑 {Object.keys(emp.credentials || {}).length}</span>
                      <span title="Completed Training" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>📜 {empHistory.filter(l => l.status === 'Completed').length}</span>
                      {inProgressCount > 0 && <span title="Pending Training" style={{ fontSize: '0.75rem', color: 'var(--status-amber)' }}>⏳ {inProgressCount}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleArchive(emp.id); }} style={{ background: 'none', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Archive</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', height: '100%', zIndex: 1000, boxShadow: '-15px 0 45px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', background: 'rgba(15, 15, 18, 0.98)', borderLeft: '1px solid var(--glass-border)' }}>
          <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Employee Profile</h3>
              <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{selectedEmployee.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedEmployee.role || 'Staff Member'}</div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1.2rem', letterSpacing: '1px' }}>Current & Historical Training</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No training records found.</p> : 
                  history.map(log => (
                    <div key={log.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: log.status === 'Enrolled' ? '1px solid var(--status-amber)' : '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div><div style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>{log.courseName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.provider}</div></div>
                        <div style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', background: log.status === 'Completed' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 179, 71, 0.1)', color: log.status === 'Completed' ? 'var(--secondary)' : 'var(--status-amber)', border: `1px solid ${log.status === 'Completed' ? 'var(--secondary)' : 'var(--status-amber)'}`, height: 'fit-content', textTransform: 'uppercase', fontWeight: '700' }}>{log.status === 'Enrolled' ? 'In Progress' : 'Completed'}</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrolled</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{formatDate(log.enrolmentDate)}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
                          {log.status === 'Completed' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{formatDate(log.completionDate)}</div>
                              <button onClick={() => startEditLog(log)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.6rem', cursor: 'pointer', textDecoration: 'underline' }}>EDIT LOG</button>
                            </div>
                          ) : (
                            <button onClick={() => setShowCompleteModal(log.id)} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700' }}>FINALIZE</button>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Renewal</div>
                          {log.status === 'Completed' ? (
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: log.expiryDate ? 'var(--secondary)' : 'var(--status-amber)' }}>
                              {log.expiryDate ? formatDate(log.expiryDate) : 'LIFETIME'}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</div>
                          )}
                        </div>
                      </div>

                      {showCompleteModal === log.id && (
                        <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                            {log.status === 'Completed' ? 'Modify Training Record' : 'Finalize Training Record'}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Completion Date:</label>
                              <input type="date" value={completionDateInput} onChange={(e) => setCompletionDateInput(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>Renewal Date:</label>
                              <input type="date" value={expiryDateInput} onChange={(e) => setExpiryDateInput(e.target.value)} placeholder="Auto-calculate..." style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '6px' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleComplete} style={{ flex: 1, background: 'var(--secondary)', color: 'black', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                              {log.status === 'Completed' ? 'Save Changes' : 'Save and Finalize'}
                            </button>
                            <button onClick={() => setShowCompleteModal(null)} style={{ background: 'none', color: 'white', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
            
            <div style={{ marginTop: '3rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--secondary)', letterSpacing: '1px' }}>Portal Credentials</h4>
                <button 
                  onClick={() => { setIsEditingCreds(true); setEditingPortalKey(null); setTempCred({ portal: '', user: '', pass: '' }); }}
                  style={{ background: 'none', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  + Add Access
                </button>
              </div>

              {isEditingCreds && (
                <div className="card glass" style={{ marginBottom: '1.5rem', border: '1px solid var(--secondary)', padding: '1.2rem' }}>
                  <form onSubmit={handleSaveCreds} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Portal / System Name</label>
                      <input type="text" value={tempCred.portal} onChange={e => setTempCred({...tempCred, portal: e.target.value})} placeholder="e.g. Itero Portal" className="glass" style={{ width: '100%', padding: '8px', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }} required disabled={!!editingPortalKey} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Username</label>
                        <input type="text" value={tempCred.user} onChange={e => setTempCred({...tempCred, user: e.target.value})} placeholder="User" className="glass" style={{ width: '100%', padding: '8px', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Password</label>
                        <input type="text" value={tempCred.pass} onChange={e => setTempCred({...tempCred, pass: e.target.value})} placeholder="Pass" className="glass" style={{ width: '100%', padding: '8px', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <button type="submit" style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'var(--secondary)', color: 'black', fontWeight: '700', border: 'none', cursor: 'pointer' }}>{editingPortalKey ? 'Update' : 'Save Credentials'}</button>
                      <button type="button" onClick={() => setIsEditingCreds(false)} style={{ padding: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.keys(selectedEmployee.credentials || {}).length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No portal access stored.</p> : 
                  Object.entries(selectedEmployee.credentials).map(([center, creds]) => (
                    <div key={center} className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{center}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => startEditCred(center, creds)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}>Edit</button>
                          <button onClick={() => handleDeleteCred(center)} style={{ background: 'none', border: 'none', color: '#ff6666', cursor: 'pointer', fontSize: '0.7rem' }}>Delete</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>User</label>
                          <code style={{ fontSize: '0.8rem', color: 'var(--secondary)', wordBreak: 'break-all', display: 'block' }}>{creds.user}</code>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Pass</label>
                          <code style={{ fontSize: '0.8rem', color: 'white', wordBreak: 'break-all', display: 'block' }}>{creds.pass}</code>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeVault;
