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
    // Yahan aap apna Lemon Squeezy Checkout URL dalenge (jo aap ki Lemon Squeezy product/store setting se milega)
    // Payoneer aap ka Lemon Squeezy account ke sath payout ke liye attached hota hai.
    const lemonSqueezyCheckoutUrl = "https://your-store.lemonsqueezy.com/checkout/buy/your-product-id";
    window.location.href = lemonSqueezyCheckoutUrl;
  };

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto', fontFamily: 'Arial', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* Subscription & Billing Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div>
          <strong>Account Plan: </strong> 
          <span style={{ color: selectedPlan === 'pro' ? '#52c41a' : '#0070f3', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {selectedPlan} Plan
          </span>
        </div>
        {selectedPlan === 'free' && (
          <button onClick={() => setShowModal(true)} style={{ background: '#722ed1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Upgrade to Pro ($9/mo)
          </button>
        )}
      </div>

      <h2 style={{ textAlign: 'center', color: '#333' }}>Invoice Generator Micro-SaaS</h2>
      
      <form onSubmit={handleDownloadPDF} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ flex: 1 }}>Invoice Number:
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
          <label style={{ flex: 1 }}>Client Name:
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </label>
        </div>

        <label>Client Email:
          <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </label>

        <hr style={{ border: '0.5px solid #eee' }} />

        <h3>Invoice Items {selectedPlan === 'free' && <span style={{ fontSize: '12px', color: '#ff4d4f' }}>(Free plan max 2 items)</span>}</h3>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <input type="text" placeholder="Item / Service Name" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} required style={{ flex: 2, padding: '8px' }} />
            <input type="number" min="1" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} required style={{ flex: 0.5, padding: '8px' }} />
            <input type="number" min="0" placeholder="Price" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} required style={{ flex: 0.8, padding: '8px' }} />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItemRow(index)} style={{ padding: '8px 12px', background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>X</button>
            )}
          </div>
        ))}

        {(selectedPlan === 'pro' || items.length < 2) && (
          <button type="button" onClick={addItemRow} style={{ padding: '8px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Item</button>
        )}

        <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold',marginTop: '10px' }}>
          Subtotal: ${calculateTotal()} <br />
          Grand Total (Inc. Tax): ${(calculateTotal() * 1.05).toFixed(2)}
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>
          {loading ? 'Generating PDF...' : 'Download Invoice PDF'}
        </button>
      </form>

      {/* Lemon Squeezy Upgrade Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '400px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#722ed1', marginBottom: '10px' }}>Upgrade to Pro Plan</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Free plan allows up to 2 items per invoice. Upgrade via Lemon Squeezy ($9/month) for unlimited items and custom branding. Payouts go directly to your Payoneer account!
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleLemonSqueezyCheckout} style={{ background: '#722ed1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Pay with Lemon Squeezy
              </button>
              <button onClick={() => setShowModal(false)} style={{ background: '#ccc', color: '#333', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;