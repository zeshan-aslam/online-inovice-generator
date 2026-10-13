import { useState } from 'react';

function App() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [showModal, setShowModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    if (selectedPlan === 'free' && items.length >= 2) {
      setShowModal(true);
      return;
    }
    setItems([...items, { name: '', qty: 1, price: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  };

  const handleDownloadPDF = async (e) => {
    e.preventDefault();
    
    if (selectedPlan === 'free' && items.length > 2) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    const invoiceData = { invoiceNumber, clientName, clientEmail, items, plan: selectedPlan };

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('PDF Generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLemonSqueezyCheckout = () => {
    const lemonSqueezyCheckoutUrl = "https://your-store.lemonsqueezy.com/checkout/buy/your-product-id";
    window.location.href = lemonSqueezyCheckoutUrl;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        
        {/* Top Header Banner */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>Invoice Generator</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Professional Micro-SaaS Billing Suite</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '20px', backdropFilter: 'blur(5px)' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cbd5e1' }}>Plan:</span>
            <span style={{ color: selectedPlan === 'pro' ? '#4ade80' : '#38bdf8', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase' }}>
              {selectedPlan}
            </span>
            {selectedPlan === 'free' && (
              <button 
                onClick={() => setShowModal(true)} 
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)' }}
                onMouseOver={(e) => e.target.style.background = '#6d28d9'}
                onMouseOut={(e) => e.target.style.background = '#7c3aed'}
              >
                Upgrade Pro ($9/mo)
              </button>
            )}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleDownloadPDF} style={{ padding: '30px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Invoice Number</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Client Name</label>
              <input 
                type="text" 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)} 
                placeholder="e.g. John Doe" 
                required 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Client Email</label>
            <input 
              type="email" 
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              placeholder="client@company.com" 
              required 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }} />

          {/* Items Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              Invoice Items 
              {selectedPlan === 'free' && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#ef4444', marginLeft: '8px' }}>(Free plan max 2 items)</span>}
            </h3>
          </div>
          
          {/* Items Header Labels */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#64748b', paddingRight: '40px' }}>
            <span style={{ flex: 2 }}>Description</span>
            <span style={{ flex: 0.6 }}>Qty</span>
            <span style={{ flex: 0.8 }}>Price ($)</span>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Item or Service Name" 
                value={item.name} 
                onChange={(e) => handleItemChange(index, 'name', e.target.value)} 
                required 
                style={{ flex: 2, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
              />
              <input 
                type="number" 
                min="1" 
                placeholder="1" 
                value={item.qty} 
                onChange={(e) => handleItemChange(index, 'qty', e.target.value)} 
                required 
                style={{ flex: 0.6, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
              />
              <input 
                type="number" 
                min="0" 
                placeholder="0.00" 
                value={item.price} 
                onChange={(e) => handleItemChange(index, 'price', e.target.value)} 
                required 
                style={{ flex: 0.8, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
              />
              {items.length > 1 ? (
                <button 
                  type="button" 
                  onClick={() => removeItemRow(index)} 
                  style={{ width: '38px', height: '38px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  title="Remove item"
                >
                  ✕
                </button>
              ) : (
                <div style={{ width: '38px' }} />
              )}
            </div>
          ))}

          <div style={{ marginTop: '12px', marginBottom: '24px' }}>
            <button 
              type="button" 
              onClick={addItemRow} 
              style={{ padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s' }}
            >
              + Add Line Item
            </button>
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0' }} />

          {/* Totals Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Subtotal: <span style={{ fontWeight: '600', color: '#1e293b', marginLeft: '10px' }}>${calculateTotal().toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Tax (5%): <span style={{ fontWeight: '600', color: '#1e293b', marginLeft: '10px' }}>${(calculateTotal() * 0.05).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Grand Total: <span style={{ color: '#2563eb', marginLeft: '10px' }}>${(calculateTotal() * 1.05).toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)', transition: 'background 0.2s' }}
          >
            {loading ? 'Generating PDF Document...' : 'Download Invoice PDF'}
          </button>
        </form>

        {/* Upgrade Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '35px', borderRadius: '16px', width: '420px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '50px', height: '50px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px auto', fontWeight: 'bold' }}>⚡</div>
              <h3 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700' }}>Unlock Pro Features</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px 0' }}>
                Free plan allows up to 2 items per invoice. Upgrade to Pro via Lemon Squeezy ($9/month) for unlimited line items, custom branding, and seamless Payoneer payouts!
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={handleLemonSqueezyCheckout} 
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', flex: 1, boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)' }}
                >
                  Upgrade via Lemon Squeezy
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;