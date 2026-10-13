import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'doc2pdf' | 'styled2pdf' | 'pdf2doc'
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tab 1: Invoice States
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);

  // Tab 2: Doc File to PDF States
  const [docFile, setDocFile] = useState(null);

  // Tab 3: Styled Text to PDF States
  const [reportTitle, setReportTitle] = useState('');
  const [reportHeading, setReportHeading] = useState('');
  const [reportText, setReportText] = useState('');

  // Tab 4: PDF to Docs States
  const [pdfFile, setPdfFile] = useState(null);

  // Invoice Handlers
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
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);

  // API Submission Handlers
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (selectedPlan === 'free' && items.length > 2) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber, clientName, clientEmail, items, plan: selectedPlan })
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      downloadBlob(blob, `${invoiceNumber}.pdf`);
    } catch (err) {
      alert('Error generating invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDocToPdf = async (e) => {
    e.preventDefault();
    if (!docFile) return alert('Please select a file');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', docFile);

    try {
      const res = await fetch('/api/convert-doc-file', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      downloadBlob(blob, 'converted_document.pdf');
    } catch (err) {
      alert('Error converting document');
    } finally {
      setLoading(false);
    }
  };

  const handleStyledTextToPdf = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/convert-styled-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reportTitle, heading: reportHeading, bodyText: reportText })
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      downloadBlob(blob, 'styled_report.pdf');
    } catch (err) {
      alert('Error converting styled text');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfToDoc = async (e) => {
    e.preventDefault();
    if (!pdfFile) return alert('Please select a PDF file');
    setLoading(true);
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);

    try {
      const res = await fetch('/api/pdf-to-docs', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      downloadBlob(blob, 'extracted_text.txt');
    } catch (err) {
      alert('Error extracting text from PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleLemonSqueezyCheckout = () => {
    window.location.href = "https://your-store.lemonsqueezy.com/checkout/buy/your-product-id";
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '30px 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Ultimate PDF & Doc Suite</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Professional Micro-SaaS Toolset</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '20px' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase' }}>Plan:</span>
            <span style={{ color: selectedPlan === 'pro' ? '#4ade80' : '#38bdf8', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase' }}>{selectedPlan}</span>
            {selectedPlan === 'free' && (
              <button onClick={() => setShowModal(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '14px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                Upgrade Pro ($9)
              </button>
            )}
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', overflowX: 'auto' }}>
          {[
            { id: 'invoice', label: '📄 Invoice Generator' },
            { id: 'doc2pdf', label: '📁 Doc to PDF' },
            { id: 'styled2pdf', label: '✍️ Styled Text to PDF' },
            { id: 'pdf2doc', label: '🔄 PDF to Docs' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, minWidth: '160px', padding: '12px 10px', background: activeTab === tab.id ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #2563eb' : 'none', fontWeight: '600', color: activeTab === tab.id ? '#2563eb' : '#64748b', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '30px' }}>
          
          {/* TAB 1: INVOICE GENERATOR */}
          {activeTab === 'invoice' && (
            <form onSubmit={handleGenerateInvoice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Invoice Number</label>
                  <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Client Name</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="John Doe" required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Client Email</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>
                Items {selectedPlan === 'free' && <span style={{ fontSize: '11px', color: '#ef4444' }}>(Free plan max 2 items)</span>}
              </h3>

              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} required style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="number" min="1" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} required style={{ flex: 0.5, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="number" min="0" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} required style={{ flex: 0.8, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  {items.length > 1 && <button type="button" onClick={() => removeItemRow(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0 12px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>}
                </div>
              ))}

              <button type="button" onClick={addItemRow} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginBottom: '20px' }}>+ Add Item</button>

              <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                Grand Total: <span style={{ color: '#2563eb' }}>${(calculateTotal() * 1.05).toFixed(2)}</span>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Generating...' : 'Download Invoice PDF'}
              </button>
            </form>
          )}

          {/* TAB 2: DOC TO PDF CONVERTER */}
          {activeTab === 'doc2pdf' && (
            <form onSubmit={handleDocToPdf}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Upload Document File (.txt)</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Upload your text file and instantly convert it into a formatted PDF document.</p>
              
              <input type="file" accept=".txt" onChange={(e) => setDocFile(e.target.files[0])} required style={{ marginBottom: '20px', display: 'block' }} />

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Converting...' : 'Convert Doc to PDF'}
              </button>
            </form>
          )}

          {/* TAB 3: STYLED TEXT TO PDF CONVERTER */}
          {activeTab === 'styled2pdf' && (
            <form onSubmit={handleStyledTextToPdf}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}>Styled Text to PDF Generator</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Document Title (Main Heading)</label>
                <input type="text" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Annual Report 2026" required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Section Heading</label>
                <input type="text" value={reportHeading} onChange={(e) => setReportHeading(e.target.value)} placeholder="Executive Summary" required style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Body Text / Content</label>
                <textarea rows="6" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Enter your detailed requirements, text or paragraphs here..." required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Generating...' : 'Generate Styled PDF'}
              </button>
            </form>
          )}

          {/* TAB 4: PDF TO DOCS */}
          {activeTab === 'pdf2doc' && (
            <form onSubmit={handlePdfToDoc}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Extract Text from PDF (PDF to Docs)</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Upload any PDF file to extract all text content into an editable document (.txt format).</p>

              <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])} required style={{ marginBottom: '20px', display: 'block' }} />

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Extracting...' : 'Extract Text to Document'}
              </button>
            </form>
          )}

        </div>

        {/* Upgrade Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
              <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>Upgrade to Pro Plan</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Unlock unlimited invoice items and full suite access via Lemon Squeezy ($9/mo)!</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={handleLemonSqueezyCheckout} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', flex: 1 }}>Upgrade Now</button>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', color: '#333', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;