import {useState,useEffect} from 'react'
import {supabase} from './supabase.js'
import {Avatar,Card,Btn,Input,Modal,Badge} from './ui.jsx'
import {genCode} from './data.js'

export default function Groups({user,profile,onEnter}){
  const [groups,setGroups]=useState([])
  const [loading,setLoading]=useState(true)
  const [showCreate,setShowCreate]=useState(false)
  const [showJoin,setShowJoin]=useState(false)
  const [newName,setNewName]=useState('')
  const [joinCode,setJoinCode]=useState('')
  const [err,setErr]=useState('')
  const [copied,setCopied]=useState(null)

  useEffect(()=>{load()},[])

  async function load(){
    setLoading(true)
    const {data}=await supabase.from('group_members')
      .select('role,prode_groups(id,name,code,owner_id)')
      .eq('user_id',user.id)
    if(data){
      const gs=data.map(d=>({...d.prode_groups,myRole:d.role}))
      const ids=gs.map(g=>g.id)
      if(ids.length>0){
        const {data:counts}=await supabase.from('group_members').select('group_id').in('group_id',ids)
        const cm={}
        counts?.forEach(c=>{cm[c.group_id]=(cm[c.group_id]||0)+1})
        setGroups(gs.map(g=>({...g,members:cm[g.id]||1})))
      } else setGroups([])
    }
    setLoading(false)
  }

  async function create(){
    if(!newName.trim()){setErr('Poné un nombre');return}
    setErr('')
    const code=genCode()
    const {data:grp,error}=await supabase.from('prode_groups')
      .insert({name:newName.trim(),code,owner_id:user.id}).select().single()
    if(error){setErr('Error al crear');return}
    await supabase.from('group_members').insert({group_id:grp.id,user_id:user.id,role:'admin'})
    setShowCreate(false);setNewName('');load()
  }

  async function join(){
    const code=joinCode.trim().toUpperCase()
    if(!code){setErr('Ingresá el código');return}
    setErr('')
    const {data:grp}=await supabase.from('prode_groups').select('*').eq('code',code).single()
    if(!grp){setErr('Código inválido');return}
    const {data:ex}=await supabase.from('group_members').select('id')
      .eq('group_id',grp.id).eq('user_id',user.id).maybeSingle()
    if(ex){setErr('Ya sos parte de ese prode');return}
    await supabase.from('group_members').insert({group_id:grp.id,user_id:user.id,role:'member'})
    setShowJoin(false);setJoinCode('');load()
  }

  function copy(code,id){
    navigator.clipboard.writeText(code)
    setCopied(id);setTimeout(()=>setCopied(null),2000)
  }

  return(
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#003a7a,#0a1628 65%)'}}>
      <header style={{background:'rgba(0,0,0,0.4)',borderBottom:'3px solid #F5C518',
        padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:28}}>🏆</span>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:'#F5C518',letterSpacing:1}}>PRODE MUNDIAL 2026</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:2}}>USA · MEXICO · CANADA</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Avatar name={profile?.username||'?'} size={32}/>
          <span style={{fontSize:14,color:'rgba(255,255,255,0.7)',fontWeight:700}}>{profile?.username}</span>
          <button onClick={()=>supabase.auth.signOut()}
            style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',
              color:'rgba(255,255,255,0.6)',borderRadius:8,padding:'5px 12px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
            Salir
          </button>
        </div>
      </header>

      <main style={{maxWidth:680,margin:'0 auto',padding:'32px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:900,color:'#fff',margin:0}}>Mis Prodes</h2>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,marginTop:4}}>Cada prode es un grupo independiente</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <Btn v="ghost" onClick={()=>{setShowJoin(true);setErr('')}}>🔑 Unirme</Btn>
            <Btn v="primary" onClick={()=>{setShowCreate(true);setErr('')}}>+ Crear prode</Btn>
          </div>
        </div>

        {loading?<p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',padding:60}}>Cargando...</p>
        :groups.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:64,marginBottom:16}}>🎯</div>
            <h3 style={{color:'#fff',fontSize:22,marginBottom:8}}>No tenés prodes todavía</h3>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,marginBottom:28}}>Creá uno o unite con un código</p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <Btn v="ghost" onClick={()=>{setShowJoin(true);setErr('')}}>🔑 Tengo un código</Btn>
              <Btn v="primary" onClick={()=>{setShowCreate(true);setErr('')}}>+ Crear mi primer prode</Btn>
            </div>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {groups.map(g=>(
              <Card key={g.id} gold={g.myRole==='admin'}>
                <div style={{display:'flex',alignItems:'center',gap:16,cursor:'pointer'}} onClick={()=>onEnter(g)}>
                  <div style={{fontSize:40}}>⚽</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:4}}>{g.name}</div>
                    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>👥 {g.members} participante{g.members!==1?'s':''}</span>
                      {g.myRole==='admin'&&<Badge color="gold">👑 Admin</Badge>}
                    </div>
                  </div>
                  <div style={{fontSize:22,color:'rgba(255,255,255,0.3)'}}>›</div>
                </div>
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.08)',
                  display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <span style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>Código para invitar amigos:</span>
                  <button onClick={()=>copy(g.code,g.id)}
                    style={{background:'rgba(245,197,24,0.12)',border:'1px solid rgba(245,197,24,0.3)',
                      color:'#F5C518',borderRadius:8,padding:'6px 14px',fontSize:15,fontWeight:900,
                      cursor:'pointer',fontFamily:'inherit',letterSpacing:3}}>
                    {copied===g.id?'¡Copiado!':g.code+' 📋'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showCreate&&(
        <Modal onClose={()=>setShowCreate(false)}>
          <h3 style={{color:'#F5C518',fontSize:22,fontWeight:900,marginBottom:20}}>🏆 Crear nuevo prode</h3>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,marginBottom:20,lineHeight:1.6}}>
            Se genera un código que compartís con tus amigos para que se unan.
          </p>
          <Input value={newName} onChange={setNewName} placeholder="Nombre del prode (ej: Los pibes del fútbol)"/>
          {err&&<p style={{color:'#ff6b6b',fontSize:13,marginTop:8}}>{err}</p>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <Btn v="ghost" onClick={()=>setShowCreate(false)} style={{flex:1}}>Cancelar</Btn>
            <Btn v="primary" onClick={create} style={{flex:2,padding:'13px',fontSize:16}}>Crear 🚀</Btn>
          </div>
        </Modal>
      )}

      {showJoin&&(
        <Modal onClose={()=>setShowJoin(false)}>
          <h3 style={{color:'#F5C518',fontSize:22,fontWeight:900,marginBottom:20}}>🔑 Unirme a un prode</h3>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,marginBottom:20,lineHeight:1.6}}>
            Pedile el código de 6 letras al creador del prode.
          </p>
          <Input value={joinCode} onChange={v=>setJoinCode(v.toUpperCase())} placeholder="CÓDIGO"
            style={{fontSize:22,fontWeight:900,letterSpacing:4,textAlign:'center'}}/>
          {err&&<p style={{color:'#ff6b6b',fontSize:13,marginTop:8}}>{err}</p>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <Btn v="ghost" onClick={()=>setShowJoin(false)} style={{flex:1}}>Cancelar</Btn>
            <Btn v="primary" onClick={join} style={{flex:2,padding:'13px',fontSize:16}}>Unirme 🤝</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
