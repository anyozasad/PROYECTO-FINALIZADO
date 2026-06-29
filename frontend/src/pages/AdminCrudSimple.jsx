import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../services/api';

const S = {
  page:  { fontFamily:"'Inter',sans-serif", color:'var(--text)' },
  card:  { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px' },
  input: { background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'8px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', width:'100%', outline:'none', fontFamily:"'Inter',sans-serif", transition:'border-color .2s' },
  label: { display:'block', fontSize:'12px', fontWeight:'600', color:'var(--muted2)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.05em' },
  btnPrimary: { background:'linear-gradient(135deg,#7c3aed,#9333ea)', color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:'0 3px 12px rgba(124,58,237,.4)', transition:'transform .15s,box-shadow .15s' },
  btnEdit:    { background:'rgba(245,158,11,.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' },
  btnDelete:  { background:'rgba(239,68,68,.15)',  color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' },
  th: { color:'var(--muted)', fontSize:'11px', fontWeight:'700', padding:'10px 14px', textAlign:'left', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' },
  td: { padding:'13px 14px', fontSize:'13px', color:'var(--text)', borderBottom:'1px solid var(--border)' },
};

export default function AdminCrudSimple({ titulo, recurso, campos }) {
  const empty = Object.fromEntries(campos.map(c => [c.name, c.default ?? '']));
  const [items, setItems]   = useState([]);
  const [form,  setForm]    = useState(empty);
  const [editId,setEditId]  = useState(null);
  const [modal, setModal]   = useState(false);
  const [loading,setLoading]= useState(false);

  const cargar = () => apiFetch(`/${recurso}`).then(d => setItems(Array.isArray(d)?d:[])).catch(()=>{});
  useEffect(() => { cargar(); }, [recurso]);

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const abrir = (item = null) => {
    setForm(item ? { ...empty, ...item } : empty);
    setEditId(item ? item.id : null);
    setModal(true);
  };

  const guardar = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(editId ? `/${recurso}/${editId}` : `/${recurso}`, {
        method: editId ? 'PUT' : 'POST', body: JSON.stringify(form),
      });
      Swal.fire({ icon:'success', title: editId ? 'Actualizado' : 'Creado', timer:1500, showConfirmButton:false, background:'#0e0e1a', color:'white' });
      setModal(false); cargar();
    } catch (err) { Swal.fire({ icon:'error', title:'Error', text:err.message, background:'#0e0e1a', color:'white' }); }
    finally { setLoading(false); }
  };

  const eliminar = async id => {
    const r = await Swal.fire({ title:'¿Eliminar registro?', icon:'warning', showCancelButton:true, confirmButtonText:'Eliminar', cancelButtonText:'Cancelar', confirmButtonColor:'#ef4444', background:'#0e0e1a', color:'white' });
    if (!r.isConfirmed) return;
    try { await apiFetch(`/${recurso}/${id}`, { method:'DELETE' }); cargar(); } catch {}
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:'800', letterSpacing:'-0.3px' }}>{titulo}</h1>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>{items.length} registros en total</p>
        </div>
        <button style={S.btnPrimary} onClick={() => abrir()}
          onMouseOver={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 18px rgba(124,58,237,.55)';}}
          onMouseOut={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 3px 12px rgba(124,58,237,.4)';}}>
          + Nuevo {titulo.split(' ')[0]}
        </button>
      </div>

      {/* Tabla */}
      <div style={S.card}>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px', opacity:.3 }}>📋</div>
            <p style={{ margin:0, fontWeight:'600' }}>Sin registros aún</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                {campos.slice(0,5).map(c => <th key={c.name} style={S.th}>{c.label}</th>)}
                <th style={{ ...S.th, textAlign:'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='var(--bg4)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ ...S.td, color:'var(--muted)', fontSize:'12px' }}>{i+1}</td>
                  {campos.slice(0,5).map(c => (
                    <td key={c.name} style={S.td}>
                      {c.name === 'estado'
                        ? <span style={{ background: Number(item[c.name])===1 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)', color: Number(item[c.name])===1 ? '#10b981' : '#ef4444', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700' }}>
                            {Number(item[c.name])===1 ? 'Activo' : 'Inactivo'}
                          </span>
                        : String(item[c.name] ?? '-')
                      }
                    </td>
                  ))}
                  <td style={{ ...S.td, textAlign:'right' }}>
                    <button style={S.btnEdit} onClick={() => abrir(item)}
                      onMouseOver={e=>e.currentTarget.style.background='rgba(245,158,11,.28)'}
                      onMouseOut={e=>e.currentTarget.style.background='rgba(245,158,11,.15)'}>
                      ✏️ Editar
                    </button>
                    {' '}
                    <button style={S.btnDelete} onClick={() => eliminar(item.id)}
                      onMouseOver={e=>e.currentTarget.style.background='rgba(239,68,68,.28)'}
                      onMouseOut={e=>e.currentTarget.style.background='rgba(239,68,68,.15)'}>
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'540px', maxHeight:'88vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'22px' }}>
              <h3 style={{ margin:0, fontSize:'18px', fontWeight:'700' }}>{editId ? `Editar ${titulo}` : `Nuevo ${titulo}`}</h3>
              <button onClick={() => setModal(false)} style={{ background:'var(--bg4)', border:'none', color:'var(--muted)', cursor:'pointer', borderRadius:'8px', padding:'6px 10px', fontSize:'16px' }}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'22px' }}>
                {campos.map(c => (
                  <div key={c.name} style={{ gridColumn: c.col === 'col-md-4' ? '1/-1' : 'auto' }}>
                    <label style={S.label}>{c.label}{c.required && <span style={{ color:'#ef4444' }}> *</span>}</label>
                    <input name={c.name} type={c.type||'text'} value={form[c.name]??''} onChange={change} required={c.required}
                      placeholder={c.label} style={S.input}
                      onFocus={e=>e.target.style.borderColor='#7c3aed'}
                      onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--muted2)', borderRadius:'8px', padding:'10px 20px', fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity:loading?.7:1 }}>
                  {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
