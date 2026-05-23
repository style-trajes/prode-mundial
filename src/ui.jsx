const COLORS=['#1565C0','#4CAF50','#FF6F00','#6A1B9A','#C62828','#00838F','#AD1457','#558B2F']
export const aColor=n=>COLORS[(n?.charCodeAt(0)||0)%COLORS.length]

export function Avatar({name='?',size=36}){
  return <div style={{width:size,height:size,borderRadius:'50%',background:aColor(name),flexShrink:0,
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:800,
    color:'#fff',border:'2px solid rgba(255,255,255,0.15)'}}>{name.slice(0,2).toUpperCase()}</div>
}

export function Card({children,gold=false,style={}}){
  return <div style={{background:gold?'rgba(245,197,24,0.08)':'rgba(255,255,255,0.04)',
    border:`1px solid ${gold?'rgba(245,197,24,0.35)':'rgba(255,255,255,0.09)'}`,
    borderRadius:14,padding:'16px 20px',animation:'fadeIn .2s ease',...style}}>{children}</div>
}

export function Btn({children,onClick,disabled,v='primary',style={}}){
  const V={primary:{background:'#F5C518',color:'#000',border:'none'},
    blue:{background:'#1565C0',color:'#fff',border:'none'},
    ghost:{background:'transparent',color:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.2)'},
    green:{background:'#2e7d32',color:'#fff',border:'none'},
    red:{background:'#c62828',color:'#fff',border:'none'}}
  return <button onClick={onClick} disabled={disabled}
    style={{...V[v]||V.primary,padding:'10px 18px',borderRadius:9,fontWeight:700,fontSize:14,
      cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',opacity:disabled?.45:1,...style}}>
    {children}</button>
}

export function Input({value,onChange,placeholder,type='text',style={}}){
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,0.07)',
      border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:'#fff',
      fontSize:15,fontFamily:'inherit',outline:'none',boxSizing:'border-box',...style}}/>
}

export function Badge({children,color='gray'}){
  const M={gold:{bg:'rgba(245,197,24,0.15)',bd:'rgba(245,197,24,0.5)',tx:'#F5C518'},
    green:{bg:'rgba(76,175,80,0.15)',bd:'rgba(76,175,80,0.5)',tx:'#4CAF50'},
    orange:{bg:'rgba(255,152,0,0.15)',bd:'rgba(255,152,0,0.5)',tx:'#FF9800'},
    red:{bg:'rgba(198,40,40,0.15)',bd:'rgba(198,40,40,0.6)',tx:'#ef5350'},
    gray:{bg:'rgba(255,255,255,0.08)',bd:'rgba(255,255,255,0.2)',tx:'rgba(255,255,255,0.6)'}}
  const s=M[color]||M.gray
  return <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:20,
    background:s.bg,border:`1px solid ${s.bd}`,color:s.tx,whiteSpace:'nowrap'}}>{children}</span>
}

export function Modal({children,onClose}){
  return <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
    style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',
      alignItems:'center',justifyContent:'center',zIndex:500,padding:20}}>
    <div style={{background:'#0d1f3c',border:'2px solid rgba(245,197,24,0.4)',borderRadius:18,
      padding:28,width:'100%',maxWidth:480,animation:'slideIn .2s ease',maxHeight:'90vh',overflowY:'auto'}}>
      {children}</div></div>
}

export function ScoreBox({value,onChange}){
  return <input type="number" min="0" max="30" value={value??''}
    onChange={e=>onChange(e.target.value===''?null:Math.min(30,parseInt(e.target.value)||0))}
    style={{width:54,height:52,textAlign:'center',fontSize:24,fontWeight:900,borderRadius:10,
      border:'2px solid #F5C518',background:'rgba(0,0,0,0.45)',color:'#fff',outline:'none',fontFamily:'inherit'}}/>
}

export function Title({children}){
  return <h2 style={{color:'#F5C518',fontSize:22,fontWeight:900,letterSpacing:1,
    borderBottom:'2px solid rgba(245,197,24,0.25)',paddingBottom:10,marginBottom:20}}>{children}</h2>
}
