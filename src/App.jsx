import {useState,useEffect} from 'react'
import {supabase} from './supabase.js'
import Auth from './Auth.jsx'
import Groups from './Groups.jsx'
import Prode from './Prode.jsx'
import {runScoreUpdate} from './scoreUpdater.js'

export default function App(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [group,setGroup]=useState(null)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setUser(data.session?.user??null)
      setLoading(false)
    })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null)
      if(!session){setProfile(null);setGroup(null)}
    })
    return()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(!user) return
    supabase.from('profiles').select('*').eq('id',user.id).single()
      .then(({data})=>{if(data)setProfile(data)})
    // Actualizar puntos automáticamente al abrir la app
    runScoreUpdate()
    // Y cada 30 minutos mientras esté abierta
    const iv = setInterval(runScoreUpdate, 30 * 60 * 1000)
    return () => clearInterval(iv)
  },[user])

  if(loading) return(
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'#0a1628',color:'#F5C518',fontSize:22,fontWeight:800,letterSpacing:2,
      fontFamily:'Barlow Condensed,sans-serif'}}>
      🏆 Cargando...
    </div>
  )

  if(!user) return <Auth/>
  if(group) return <Prode user={user} profile={profile} group={group} onBack={()=>setGroup(null)}/>
  return <Groups user={user} profile={profile} onEnter={g=>setGroup(g)}/>
}
