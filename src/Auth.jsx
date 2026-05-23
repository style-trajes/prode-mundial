import {useState} from 'react'
import {supabase} from './supabase.js'
import {Input,Btn} from './ui.jsx'

export default function Auth(){
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [nick,setNick]=useState('')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)

  async function submit(e){
    e.preventDefault();setErr('');setLoading(true)
    try{
      if(mode==='register'){
        if(!nick.trim()){setErr('Necesitás un apodo');setLoading(false);return}
        const {data,error}=await supabase.auth.signUp({email,password:pass})
        if(error){setErr(error.message);setLoading(false);return}
        if(data.user) await supabase.from('profiles').insert({id:data.user.id,username:nick.trim()})
      } else {
        const {error}=await supabase.auth.signInWithPassword({email,password:pass})
        if(error){setErr('Email o contraseña incorrectos');setLoading(false);return}
      }
    }catch{setErr('Error de conexión')}
    setLoading(false)
  }

  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'radial-gradient(ellipse at 50% 0%,#003a7a,#0a1628 65%)',padding:20}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:64,marginBottom:8}}>🏆</div>
          <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:10}}>
            {['🇦🇷','🇺🇸','🇲🇽','🇨🇦'].map(fl=><span key={fl} style={{fontSize:30}}>{fl}</span>)}
          </div>
          <h1 style={{color:'#F5C518',fontSize:38,fontWeight:900,letterSpacing:2,margin:'0 0 4px'}}>PRODE MUNDIAL</h1>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,letterSpacing:3}}>2026 · USA · MEXICO · CANADA</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(245,197,24,0.25)',borderRadius:18,padding:32}}>
          <h2 style={{color:'#fff',fontSize:22,fontWeight:800,marginBottom:24,textAlign:'center'}}>
            {mode==='login'?'👋 Bienvenido':'🎯 Crear cuenta'}
          </h2>
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {mode==='register'&&<Input value={nick} onChange={setNick} placeholder="Tu apodo (ej: ElDiez10)"/>}
            <Input type="email" value={email} onChange={setEmail} placeholder="Email"/>
            <Input type="password" value={pass} onChange={setPass} placeholder="Contraseña (mín. 6 caracteres)"/>
            {err&&<p style={{color:'#ff6b6b',fontSize:13,textAlign:'center',margin:0}}>⚠️ {err}</p>}
            <button type="submit" disabled={loading}
              style={{padding:'15px',background:'linear-gradient(135deg,#F5C518,#d4a800)',border:'none',
                borderRadius:10,color:'#000',fontWeight:900,fontSize:18,cursor:'pointer',
                fontFamily:'inherit',opacity:loading?.7:1,letterSpacing:1}}>
              {loading?'Cargando...':mode==='login'?'ENTRAR 🚀':'REGISTRARME 🎯'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:20,color:'rgba(255,255,255,0.45)',fontSize:14}}>
            {mode==='login'?'¿Nuevo acá? ':'¿Ya tenés cuenta? '}
            <button onClick={()=>{setMode(mode==='login'?'register':'login');setErr('')}}
              style={{background:'none',border:'none',color:'#F5C518',cursor:'pointer',fontSize:14,fontFamily:'inherit',textDecoration:'underline'}}>
              {mode==='login'?'Registrate':'Ingresá'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
