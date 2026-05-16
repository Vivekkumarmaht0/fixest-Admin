import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Sidebar from './components/Sidebar';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (uid) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      
      if (data) setRole(data.role);
    } catch (err) {
      console.error('Role fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading Fixest Admin...</div>;
  }

  const isAdmin = session && (role === 'admin' || role === 'staff');

  return (
    <Router>
      <div className="admin-layout">
        {isAdmin && <Sidebar />}
        <main className={isAdmin ? 'admin-content' : 'auth-content'}>
          <Routes>
            <Route 
              path="/login" 
              element={!isAdmin ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={isAdmin ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/bookings" 
              element={isAdmin ? <Bookings /> : <Navigate to="/login" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
