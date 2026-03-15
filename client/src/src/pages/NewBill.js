import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import InvoicePrint from '../components/Billing/InvoicePrint';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function NewBill() {
  const navigate = useNavigate();
  const printRef = useRef();

  const [step, setStep] = useState(1); // 1=customer, 2=items, 3=payment
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState([]);
  const [saleType, setSaleType] = useState('intrastate');
  const [invoiceType, setInvoiceType] = useState('GST');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name:'', phone:'', email:'', type:'Retail', gstin:'', address:{ city:'', state:'', pincode:'' } });

  const printInvoice = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    if (customerSearch.length >= 2) {
      API.get('/customers', { params: { search: customerSearch, limit: 8 } })
        .then(r => setCustomers(r.data.customers));
    } else setCustomers([]);
  }, [customerSearch]);

  useEffect(() => {
    if (productSearch.length >= 2) {
      API.get('/products', { params: { search: productSearch, limit: 10 } })
        .then(r => setProducts(r.data.products));
    } else setProducts([]);
  }, [productSearch]);

  // Compute totals
  const calcItem = (item) => {
    const gross = item.unitPrice * item.quantity;
    const discAmt = item.discountType === 'percent' ? (gross * item.discount) / 100 : (item.discount || 0);
    const taxable = gross - discAmt;
    const gstAmt = (taxable * item.gstRate) / 100;
    let cgst=0,sgst=0,igst=0;
    if(saleType==='intrastate'){cgst=gstAmt/2;sgst=gstAmt/2;}else igst=gstAmt;
    return { ...item, taxableAmount:taxable, cgst, sgst, igst, total:taxable+gstAmt };
  };

  const calcedItems = items.map(calcItem);
  const subtotal = calcedItems.reduce((s,i)=>s+(i.unitPrice*i.quantity),0);
  const totalDiscount = calcedItems.reduce((s,i)=>s+(i.discountType==='percent'?(i.unitPrice*i.quantity*i.discount/100):i.discount),0);
  const totalTaxable = calcedItems.reduce((s,i)=>s+i.taxableAmount,0);
  const totalCGST = calcedItems.reduce((s,i)=>s+i.cgst,0);
  const totalSGST = calcedItems.reduce((s,i)=>s+i.sgst,0);
  const totalIGST = calcedItems.reduce((s,i)=>s+i.igst,0);
  const totalGST = totalCGST+totalSGST+totalIGST;
  const grandRaw = totalTaxable + totalGST;
  const grandTotal = Math.round(grandRaw);
  const roundOff = +(grandTotal-grandRaw).toFixed(2);
  const dueAmount = grandTotal - Number(paidAmount||0);

  const addProduct = (product, size) => {
    const existing = items.findIndex(i=>i.productId===product._id && i.size===size);
    if(existing>=0){
      const updated=[...items];
      updated[existing].quantity++;
      setItems(updated);
    } else {
      setItems(prev=>[...prev, {
        productId:product._id, sku:product.sku, name:product.name,
        size, quantity:1, unitPrice:product.sellingPrice,
        discount:0, discountType:'percent', gstRate:product.gstRate,
      }]);
    }
    setProductSearch(''); setProducts([]);
  };

  const updateItem = (idx, field, val) => {
    setItems(prev=>{const a=[...prev];a[idx]={...a[idx],[field]:field==='quantity'||field==='discount'?Number(val):val};return a;});
  };
  const removeItem = (idx) => setItems(prev=>prev.filter((_,i)=>i!==idx));

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/customers', newCust);
      setSelectedCustomer(res.data);
      setCustomerSearch(res.data.name);
      setShowNewCustomer(false);
      toast.success('Customer created!');
      setStep(2);
    } catch(err){ toast.error(err.response?.data?.error||'Failed'); }
  };

  const handleSubmit = async () => {
    if(!selectedCustomer){toast.error('Please select a customer');return;}
    if(items.length===0){toast.error('Add at least one item');return;}
    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        items: items.map(i=>({
          product:i.productId, sku:i.sku, name:i.name, size:i.size,
          quantity:i.quantity, unitPrice:i.unitPrice, discount:i.discount,
          discountType:i.discountType, gstRate:i.gstRate,
        })),
        saleType, invoiceType, paidAmount:Number(paidAmount||0), paymentMethod, notes,
        subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST, totalGST, grandTotal, roundOff,
      };
      const res = await API.post('/invoices', payload);
      setSavedInvoice(res.data);
      toast.success(`Invoice ${res.data.invoiceNumber} created!`);
    } catch(err){toast.error(err.response?.data?.error||'Failed to create invoice');}
    finally{setSubmitting(false);}
  };

  if(savedInvoice) return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{color:'var(--green)'}}>✅ Invoice Created!</h1>
          <p className="page-subtitle" style={{fontFamily:'var(--font-mono)',color:'var(--gold)'}}>{savedInvoice.invoiceNumber}</p>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button className="btn btn-secondary" onClick={printInvoice}>🖨️ Print</button>
          <button className="btn btn-ghost" onClick={()=>navigate('/billing')}>View All Invoices</button>
          <button className="btn btn-primary" onClick={()=>{setSavedInvoice(null);setStep(1);setSelectedCustomer(null);setItems([]);setPaidAmount('');}}>+ New Bill</button>
        </div>
      </div>
      <div style={{display:'none'}}><div ref={printRef}><InvoicePrint invoice={savedInvoice}/></div></div>
      <InvoicePrint invoice={savedInvoice}/>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Invoice</h1>
          <p className="page-subtitle">Step {step} of 3: {['','Select Customer','Add Products','Payment'][step]}</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          {[1,2,3].map(s=>(
            <div key={s} style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'13px',
              background:step>=s?'var(--gold)':'var(--surface2)',color:step>=s?'var(--bg)':'var(--muted)',border:'2px solid',borderColor:step>=s?'var(--gold)':'var(--border)'}}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'20px',alignItems:'start'}}>
        {/* Left Panel */}
        <div>
          {/* Step 1: Customer */}
          <div className="card" style={{marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
              <div style={{fontWeight:700,fontSize:'15px'}}>👤 Customer</div>
              {!selectedCustomer && <button className="btn btn-ghost btn-sm" onClick={()=>setShowNewCustomer(true)}>+ New Customer</button>}
              {selectedCustomer && <button className="btn btn-ghost btn-sm" onClick={()=>{setSelectedCustomer(null);setCustomerSearch('');}}>Change</button>}
            </div>
            {selectedCustomer ? (
              <div style={{background:'var(--surface2)',borderRadius:'var(--radius-sm)',padding:'12px',display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:'15px'}}>{selectedCustomer.name}</div>
                  <div style={{color:'var(--muted)',fontSize:'12px',fontFamily:'var(--font-mono)'}}>{selectedCustomer.phone} · {selectedCustomer.type}</div>
                  {selectedCustomer.gstin&&<div style={{fontSize:'11px',color:'var(--gold)',fontFamily:'var(--font-mono)'}}>GSTIN: {selectedCustomer.gstin}</div>}
                </div>
                <span className="badge badge-green">{selectedCustomer.type}</span>
              </div>
            ) : (
              <div style={{position:'relative'}}>
                <input className="input" placeholder="Search by name or phone..." value={customerSearch}
                  onChange={e=>setCustomerSearch(e.target.value)} autoFocus/>
                {customers.length>0&&(
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',zIndex:100,maxHeight:'200px',overflowY:'auto'}}>
                    {customers.map(c=>(
                      <div key={c._id} onClick={()=>{setSelectedCustomer(c);setCustomerSearch(c.name);setCustomers([]);setStep(2);}}
                        style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--surface3)'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <div style={{fontWeight:600}}>{c.name}</div>
                        <div style={{fontSize:'11px',color:'var(--muted)'}}>{c.phone} · {c.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showNewCustomer && (
              <form onSubmit={handleCreateCustomer} style={{marginTop:'16px',padding:'16px',background:'var(--surface2)',borderRadius:'var(--radius-sm)'}}>
                <div style={{fontWeight:600,marginBottom:'12px'}}>New Customer</div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Name *</label><input className="input" value={newCust.name} onChange={e=>setNewCust(p=>({...p,name:e.target.value}))} required/></div>
                  <div className="input-group"><label className="input-label">Phone *</label><input className="input" value={newCust.phone} onChange={e=>setNewCust(p=>({...p,phone:e.target.value}))} required/></div>
                </div>
                <div className="input-row cols-2">
                  <div className="input-group"><label className="input-label">Email</label><input className="input" value={newCust.email} onChange={e=>setNewCust(p=>({...p,email:e.target.value}))}/></div>
                  <div className="input-group"><label className="input-label">Type</label>
                    <select className="input" value={newCust.type} onChange={e=>setNewCust(p=>({...p,type:e.target.value}))}>
                      <option>Retail</option><option>Wholesale</option><option>Dealer</option>
                    </select>
                  </div>
                </div>
                <div className="input-group"><label className="input-label">GSTIN</label><input className="input" value={newCust.gstin} onChange={e=>setNewCust(p=>({...p,gstin:e.target.value}))} placeholder="22XXXXX..."/></div>
                <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNewCustomer(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Create Customer</button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Products */}
          {selectedCustomer && (
            <div className="card" style={{marginBottom:'16px'}}>
              <div style={{fontWeight:700,fontSize:'15px',marginBottom:'12px'}}>👟 Products</div>
              <div style={{position:'relative',marginBottom:'16px'}}>
                <input className="input" placeholder="Search products by name, SKU..." value={productSearch}
                  onChange={e=>setProductSearch(e.target.value)}/>
                {products.length>0&&(
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',zIndex:100,maxHeight:'300px',overflowY:'auto'}}>
                    {products.map(p=>(
                      <div key={p._id} style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                          <div>
                            <span style={{fontWeight:600}}>{p.name}</span>
                            <span style={{fontSize:'11px',color:'var(--muted)',marginLeft:'8px',fontFamily:'var(--font-mono)'}}>{p.sku}</span>
                          </div>
                          <span style={{fontWeight:700,color:'var(--green)',fontFamily:'var(--font-mono)'}}>₹{p.sellingPrice}</span>
                        </div>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          {p.sizeStock?.filter(s=>s.stock>0).map(s=>(
                            <button key={s.size} onClick={()=>addProduct(p,s.size)}
                              style={{padding:'4px 10px',background:'var(--surface3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text)',cursor:'pointer',fontSize:'12px',fontFamily:'var(--font-mono)'}}>
                              {s.size} <span style={{color:'var(--muted)'}}>({s.stock})</span>
                            </button>
                          ))}
                          {p.sizeStock?.filter(s=>s.stock>0).length===0&&<span style={{fontSize:'12px',color:'var(--red)'}}>Out of stock</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Table */}
              {items.length>0 ? (
                <div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:'left',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>PRODUCT</th>
                        <th style={{textAlign:'center',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>SIZE</th>
                        <th style={{textAlign:'center',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>QTY</th>
                        <th style={{textAlign:'right',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>PRICE</th>
                        <th style={{textAlign:'center',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>DISC%</th>
                        <th style={{textAlign:'right',fontSize:'11px',color:'var(--muted)',padding:'6px 8px',fontFamily:'var(--font-mono)',letterSpacing:'1px'}}>TOTAL</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcedItems.map((item,i)=>(
                        <tr key={i} style={{borderTop:'1px solid var(--border)'}}>
                          <td style={{padding:'8px 8px'}}>
                            <div style={{fontWeight:600,fontSize:'13px'}}>{item.name}</div>
                            <div style={{fontSize:'11px',color:'var(--muted)',fontFamily:'var(--font-mono)'}}>{item.sku}</div>
                          </td>
                          <td style={{padding:'8px',textAlign:'center',fontFamily:'var(--font-mono)',fontSize:'12px'}}>{item.size}</td>
                          <td style={{padding:'8px',textAlign:'center'}}>
                            <input type="number" min="1" value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)}
                              style={{width:'55px',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'4px',borderRadius:'4px',textAlign:'center',fontFamily:'var(--font-mono)'}}/>
                          </td>
                          <td style={{padding:'8px',textAlign:'right',fontFamily:'var(--font-mono)'}}>
                            <input type="number" min="0" value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',Number(e.target.value))}
                              style={{width:'80px',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'4px',borderRadius:'4px',textAlign:'right',fontFamily:'var(--font-mono)'}}/>
                          </td>
                          <td style={{padding:'8px',textAlign:'center'}}>
                            <input type="number" min="0" max="100" value={item.discount} onChange={e=>updateItem(i,'discount',e.target.value)}
                              style={{width:'55px',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'4px',borderRadius:'4px',textAlign:'center',fontFamily:'var(--font-mono)'}}/>
                          </td>
                          <td style={{padding:'8px',textAlign:'right',fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--green)'}}>{fmt(item.total)}</td>
                          <td><button onClick={()=>removeItem(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:'16px',padding:'4px'}}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{padding:'30px'}}><div className="empty-state-icon">🔍</div><p>Search and add products above</p></div>
              )}
            </div>
          )}

          {/* Step 3: Invoice Settings */}
          {selectedCustomer && items.length>0 && (
            <div className="card">
              <div style={{fontWeight:700,fontSize:'15px',marginBottom:'16px'}}>⚙️ Invoice Settings</div>
              <div className="input-row cols-3">
                <div className="input-group">
                  <label className="input-label">Invoice Type</label>
                  <select className="input" value={invoiceType} onChange={e=>setInvoiceType(e.target.value)}>
                    <option value="GST">GST Invoice</option>
                    <option value="Non-GST">Non-GST</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Sale Type</label>
                  <select className="input" value={saleType} onChange={e=>setSaleType(e.target.value)}>
                    <option value="intrastate">Intrastate (CGST+SGST)</option>
                    <option value="interstate">Interstate (IGST)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Payment Method</label>
                  <select className="input" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                    {['Cash','UPI','Card','Bank Transfer','Credit','Mixed'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <textarea className="input" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any notes for this invoice..."/>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div style={{position:'sticky',top:'0'}}>
          <div className="card">
            <div style={{fontWeight:700,fontSize:'15px',marginBottom:'16px',borderBottom:'1px solid var(--border)',paddingBottom:'12px'}}>
              💳 Invoice Summary
            </div>

            {items.length===0 ? (
              <div style={{color:'var(--muted)',fontSize:'13px',textAlign:'center',padding:'20px'}}>Add items to see summary</div>
            ) : (
              <>
                <div style={{fontSize:'13px',display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Subtotal</span><span style={{fontFamily:'var(--font-mono)'}}>{fmt(subtotal)}</span></div>
                  {totalDiscount>0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Discount</span><span style={{fontFamily:'var(--font-mono)',color:'var(--red)'}}>-{fmt(totalDiscount)}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Taxable Amount</span><span style={{fontFamily:'var(--font-mono)'}}>{fmt(totalTaxable)}</span></div>
                  {invoiceType==='GST'&&saleType==='intrastate'&&<>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>CGST</span><span style={{fontFamily:'var(--font-mono)'}}>{fmt(totalCGST)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>SGST</span><span style={{fontFamily:'var(--font-mono)'}}>{fmt(totalSGST)}</span></div>
                  </>}
                  {invoiceType==='GST'&&saleType==='interstate'&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>IGST</span><span style={{fontFamily:'var(--font-mono)'}}>{fmt(totalIGST)}</span></div>}
                  {roundOff!==0&&<div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Round Off</span><span style={{fontFamily:'var(--font-mono)'}}>{roundOff>0?'+':''}{roundOff}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:'8px',fontWeight:800,fontSize:'18px'}}>
                    <span style={{color:'var(--cream)'}}>Grand Total</span>
                    <span style={{fontFamily:'var(--font-mono)',color:'var(--gold)'}}>{fmt(grandTotal)}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Amount Paid (₹)</label>
                  <input className="input" type="number" value={paidAmount} onChange={e=>setPaidAmount(e.target.value)}
                    placeholder={grandTotal} min="0" max={grandTotal}/>
                </div>

                {paidAmount!==''&&(
                  <div style={{padding:'10px',background:dueAmount<=0?'rgba(76,175,130,0.1)':'rgba(224,80,80,0.1)',borderRadius:'var(--radius-sm)',marginBottom:'16px',border:`1px solid ${dueAmount<=0?'rgba(76,175,130,0.3)':'rgba(224,80,80,0.3)'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'14px',fontWeight:700}}>
                      <span style={{color:dueAmount<=0?'var(--green)':'var(--red)'}}>{dueAmount<=0?'✅ Fully Paid':'⚠️ Due Amount'}</span>
                      <span style={{fontFamily:'var(--font-mono)',color:dueAmount<=0?'var(--green)':'var(--red)'}}>{fmt(Math.abs(dueAmount))}</span>
                    </div>
                  </div>
                )}

                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting||!selectedCustomer||items.length===0}
                    style={{justifyContent:'center',padding:'12px'}}>
                    {submitting?'Creating...':'🧾 Create Invoice'}
                  </button>
                  <div style={{fontSize:'11px',color:'var(--muted)',textAlign:'center'}}>
                    {items.length} item{items.length!==1?'s':''} · {calcedItems.reduce((s,i)=>s+i.quantity,0)} pairs
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
