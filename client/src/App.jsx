import { useState, useEffect, useRef } from 'react';
import './App.css';

/* ---------- Settings ---------- */
// Apna Lemon Squeezy checkout link yahan daalein
const LEMON_SQUEEZY_CHECKOUT_URL =
  'https://your-store.lemonsqueezy.com/checkout/buy/your-product-id';
const FREE_ITEM_LIMIT = 2;
const TAX_RATE = 0.05; // backend (api/index.js) me bhi 5% hai

/* ---------- Helpers ---------- */
const money = (n) =>
  '$' +
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// Backend jaisa hi hisab, taake preview aur PDF ka total same ho
const lineTotal = (item) =>
  Math.max(0, Number(item.qty) || 1) * Math.max(0, Number(item.price) || 0);

/* ---------- Icons ---------- */
const Icon = ({ children, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconDoc = () => (
  <Icon size={20}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Icon>
);
const IconPlus = () => (
  <Icon size={16}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
const IconTrash = () => (
  <Icon size={17}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V4h6v3" />
  </Icon>
);
const IconDownload = () => (
  <Icon>
    <path d="M12 4v11M7 11l5 5 5-5" />
    <path d="M5 20h14" />
  </Icon>
);
const IconCheck = () => (
  <Icon size={16}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

/* ---------- Live preview (PDF jaisa) ---------- */
function InvoicePreview({ invoiceNumber, businessName, clientName, clientEmail, items }) {
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
  const tax = subtotal * TAX_RATE;
  const grand = subtotal + tax;

  return (
    <div className="paper" aria-label="Invoice preview">
      <div className="paper-head">
        <span className="paper-brand">{businessName || 'Invoice Generator'}</span>
        <span className="paper-title">
          Invoice
          <strong>{invoiceNumber || '—'}</strong>
        </span>
      </div>

      <div className="paper-meta">
        <div>
          <span className="paper-label">Billed to</span>
          <div className={clientName ? 'paper-client' : 'paper-client is-empty'}>
            {clientName || 'Client name'}
          </div>
          <div className="paper-email">{clientEmail || 'client@example.com'}</div>
        </div>
        <div className="paper-date">
          <span className="paper-label">Date</span>
          <div>{formatDate()}</div>
        </div>
      </div>

      <ul className="paper-lines">
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <div className={item.name ? 'line-name' : 'line-name is-empty'}>
                {item.name || 'Untitled item'}
              </div>
              <div className="line-sub">
                {Math.max(0, Number(item.qty) || 1)} × {money(item.price)}
              </div>
            </div>
            <div className="line-amount">{money(lineTotal(item))}</div>
          </li>
        ))}
      </ul>

      <dl className="paper-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Tax ({TAX_RATE * 100}%)</dt>
          <dd>{money(tax)}</dd>
        </div>
      </dl>

      <div className="paper-grand">
        <span>Grand total</span>
        <strong>{money(grand)}</strong>
      </div>
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  // TODO: ye value baad me apne user/subscription data se set karein
  const [selectedPlan] = useState('free');
  const isPro = selectedPlan === 'pro';

  const [showModal, setShowModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [businessName, setBusinessName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const nextId = useRef(2);
  const [items, setItems] = useState([{ id: 1, name: '', qty: 1, price: 0 }]);
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [error, setError] = useState('');

  const atFreeLimit = !isPro && items.length >= FREE_ITEM_LIMIT;

  // Escape se modal band ho
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === 'Escape' && setShowModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  // "Downloaded" message thori der baad hat jaye
  useEffect(() => {
    if (status !== 'done') return;
    const t = setTimeout(() => setStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [status]);

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const addItemRow = () => {
    if (atFreeLimit) {
      setShowModal(true);
      return;
    }
    setItems((prev) => [...prev, { id: nextId.current++, name: '', qty: 1, price: 0 }]);
  };

  const removeItemRow = (id) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDownloadPDF = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPro && items.length > FREE_ITEM_LIMIT) {
      setShowModal(true);
      return;
    }

    setStatus('loading');

    const invoiceData = {
      invoiceNumber,
      clientName,
      clientEmail,
      plan: selectedPlan,
      items: items.map(({ name, qty, price }) => ({
        name,
        qty: Number(qty),
        price: Number(price),
      })),
    };
    if (isPro && businessName.trim()) invoiceData.businessName = businessName.trim();

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) throw new Error('The PDF could not be generated.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('done');
    } catch (err) {
      setError(`${err.message} Check your connection and try again.`);
      setStatus('idle');
    }
  };

  const handleLemonSqueezyCheckout = () => {
    window.location.href = LEMON_SQUEEZY_CHECKOUT_URL;
  };

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">
              <IconDoc />
            </span>
            <span className="brand-name">Invoice Generator</span>
          </div>

          <div className="topbar-actions">
            <span className={isPro ? 'plan-chip is-pro' : 'plan-chip'}>
              {isPro ? 'Pro plan' : 'Free plan'}
            </span>
            {!isPro && (
              <button type="button" className="btn btn-accent btn-sm" onClick={() => setShowModal(true)}>
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <h1>Create an invoice</h1>
          <p>Fill in the details, check the preview, and download a PDF.</p>
        </div>

        <form className="layout" onSubmit={handleDownloadPDF}>
          {/* Left: form */}
          <div className="sheet">
            <section className="section">
              <h2>Invoice details</h2>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="invoiceNumber">Invoice number</label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="businessName">
                    Business name {!isPro && <span className="badge-pro">Pro</span>}
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={isPro ? 'Your business name' : 'Available on Pro'}
                    disabled={!isPro}
                  />
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Client</h2>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="clientName">Client name</label>
                  <input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Acme Studio"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="clientEmail">Client email</label>
                  <input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Items</h2>

              <div className="items-head" aria-hidden="true">
                <span>Description</span>
                <span className="num">Qty</span>
                <span className="num">Price</span>
                <span className="num">Amount</span>
                <span />
              </div>

              {items.map((item, index) => (
                <div className="item-row" key={item.id}>
                  <div className="cell cell-name" data-label="Description">
                    <input
                      type="text"
                      placeholder="Service or product"
                      aria-label={`Item ${index + 1} description`}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="cell cell-qty" data-label="Qty">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      aria-label={`Item ${index + 1} quantity`}
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      required
                    />
                  </div>
                  <div className="cell cell-price" data-label="Price">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      aria-label={`Item ${index + 1} price`}
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <div className="cell cell-amount" data-label="Amount">
                    <span className="amount">{money(lineTotal(item))}</span>
                  </div>
                  <div className="cell cell-remove">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeItemRow(item.id)}
                      disabled={items.length === 1}
                      aria-label={`Remove item ${index + 1}`}
                      title="Remove item"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}

              <div className="items-foot">
                <button type="button" className="btn btn-outline" onClick={addItemRow}>
                  <IconPlus /> Add item
                </button>

                {!isPro && (
                  <p className={atFreeLimit ? 'limit is-full' : 'limit'}>
                    {items.length} of {FREE_ITEM_LIMIT} items used on the Free plan.
                    {atFreeLimit && (
                      <>
                        {' '}
                        <button type="button" className="link-btn" onClick={() => setShowModal(true)}>
                          Upgrade for unlimited items
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Right: live preview + download */}
          <aside className="summary">
            <InvoicePreview
              invoiceNumber={invoiceNumber}
              businessName={isPro ? businessName.trim() : ''}
              clientName={clientName}
              clientEmail={clientEmail}
              items={items}
            />

            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Generating PDF…
                </>
              ) : status === 'done' ? (
                <>
                  <IconCheck /> PDF downloaded
                </>
              ) : (
                <>
                  <IconDownload /> Download PDF
                </>
              )}
            </button>
          </aside>
        </form>
      </main>

      {/* Upgrade modal */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upgrade-title">Upgrade to Pro</h2>
            <p className="modal-price">
              <strong>$9</strong> per month
            </p>
            <p className="modal-text">
              The Free plan includes up to {FREE_ITEM_LIMIT} items per invoice. Pro removes that
              limit and adds your own branding.
            </p>
            <ul className="modal-list">
              <li>
                <IconCheck /> Unlimited items on every invoice
              </li>
              <li>
                <IconCheck /> Your business name on the PDF
              </li>
            </ul>
            <button
              type="button"
              className="btn btn-accent btn-block"
              onClick={handleLemonSqueezyCheckout}
              autoFocus
            >
              Upgrade with Lemon Squeezy
            </button>
            <button type="button" className="btn btn-text btn-block" onClick={() => setShowModal(false)}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;