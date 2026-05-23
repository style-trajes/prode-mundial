import {useState,useEffect,useRef} from 'react'
import {supabase} from './supabase.js'
import {MATCHES,FERNET_BETS,KNOCKOUT_PREDS,f,FLAG} from './data.js'
import {Avatar,Card,ScoreBox,Btn,Badge,Modal,Input,Title} from './ui.jsx'

const TABS=[{id:'prode',label:'⚽ Prode'},{id:'tabla',label:'📊 Tabla'},
  {id:'duelos',label:'⚔️ Duelos'},{id:'final',label:'🏆 Final'},{id:'chat',label:'💬 Chat'}]

export default function Prode({user,profile,group,onBack}){
  const [tab,setTab]=useState('prode')
  const [preds,setPreds]=useState({})
  const [allPreds,setAllPreds]=useState([])
  const [koPreds,setKoPreds]=useState({})
  const [board,setBoard]=useState([])
  const [bets,setBets]=useState([])
  const [msgs,setMsgs]=useState([])
  const [profiles,setProfiles]=useState([])
  const [live,setLive]=useState({})
  const [chatMsg,setChatMsg]=useState('')
  const [toast,setToast]=useState('')
  const [betModal,setBetModal]=useState(false)
  const [betMatch,setBetMatch]=useState(null)
  const [saving,setSaving]=useState({})
  const bottomRef=useRef(null)

  useEffect(()=>{
    fetchAll()
    fetchLive()
    const iv=setInterval(fetchLive,60000)
    const ch=supabase.channel(`chat-${group.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`group_id=eq.${group.id}`},
        async p=>{
          const {data:wp}=await supabase.from('messages').select('*,profiles(username)').eq('id',p.new.id).single()
          setMsgs(prev=>[...prev,wp||p.new])
        }).subscribe()
    return()=>{clearInterval(iv);supabase.removeChannel(ch)}
  },[group.id])

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[msgs])

  async function fetchAll(){
    const [{data:members},{data:mine},{data:all},{data:lb},{data:b},{data:m}]=await Promise.all([
      supabase.from('group_members').select('user_id').eq('group_id',group.id),
      supabase.from('predictions').select('*').eq('user_id',user.id).eq('group_id',group.id),
      supabase.from('predictions').select('*').eq('group_id',group.id),
      supabase.from('leaderboard').select('*,profiles(username)').eq('group_id',group.id).order('points',{ascending:false}),
      supabase.from('bets').select('*,challenger:profiles!bets_challenger_id_fkey(username),challenged:profiles!bets_challenged_id_fkey(username)')
        .eq('group_id',group.id).or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`).order('created_at',{ascending:false}),
      supabase.from('messages').select('*,profiles(username)').eq('group_id',group.id).order('created_at',{ascending:true}).limit(100)
    ])
    if(members){
      const ids=members.map(x=>x.user_id)
      const {data:profs}=await supabase.from('profiles').select('id,username').in('id',ids)
      if(profs) setProfiles(profs)
    }
    if(mine){
      const pm={},km={}
      mine.forEach(p=>{if(p.match_id<900)pm[p.match_id]={home:p.home_score,away:p.away_score};else km[p.match_id]=p.winner})
      setPreds(pm);setKoPreds(km)
    }
    if(all) setAllPreds(all)
    if(lb) setBoard(lb)
    if(b) setBets(b)
    if(m) setMsgs(m)
  }

  async function fetchLive(){
    const key=import.meta.env.VITE_FOOTBALL_API_KEY
    if(!key) return
    try{
      const res=await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026',
        {headers:{'x-apisports-key':key}})
      const data=await res.json()
      const sc={}
      ;(data.response||[]).forEach(fx=>{
        const h=fx.teams.home.name,a=fx.teams.away.name
        sc[`${h}_${a}`]={home:fx.goals.home,away:fx.goals.away,
          status:fx.fixture.status.short,minute:fx.fixture.status.elapsed}
      })
      setLive(sc)
    }catch{}
  }

  async function savePred(matchId,home,away){
    setSaving(s=>({...s,[matchId]:true}))
    const payload={user_id:user.id,group_id:group.id,match_id:matchId,home_score:home,away_score:away}
    const {data:ex}=await supabase.from('predictions').select('id').eq('user_id',user.id).eq('group_id',group.id).eq('match_id',matchId).maybeSingle()
    if(ex) await supabase.from('predictions').update(payload).eq('id',ex.id)
    else await supabase.from('predictions').insert(payload)
    setSaving(s=>({...s,[matchId]:false}))
    showToast('Guardado ✓')
    const {data:all}=await supabase.from('predictions').select('*').eq('group_id',group.id)
    if(all) setAllPreds(all)
  }

  async function saveKo(matchId,winner){
    const payload={user_id:user.id,group_id:group.id,match_id:matchId,winner}
    const {data:ex}=await supabase.from('predictions').select('id').eq('user_id',user.id).eq('group_id',group.id).eq('match_id',matchId).maybeSingle()
    if(ex) await supabase.from('predictions').update(payload).eq('id',ex.id)
    else await supabase.from('predictions').insert(payload)
    setKoPreds(prev=>({...prev,[matchId]:winner}))
    showToast('Pronóstico final guardado ✓')
  }

  async function createBet({challenged_id,match_id,stake}){
    await supabase.from('bets').insert({group_id:group.id,challenger_id:user.id,challenged_id,match_id,stake,status:'pending'})
    showToast('Desafío enviado 🤝')
    const {data:b}=await supabase.from('bets').select('*,challenger:profiles!bets_challenger_id_fkey(username),challenged:profiles!bets_challenged_id_fkey(username)')
      .eq('group_id',group.id).or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`).order('created_at',{ascending:false})
    if(b) setBets(b)
  }

  async function acceptBet(id){
    await supabase.from('bets').update({status:'accepted'}).eq('id',id)
    showToast('Desafío aceptado ✅')
    const {data:b}=await supabase.from('bets').select('*,challenger:profiles!bets_challenger_id_fkey(username),challenged:profiles!bets_challenged_id_fkey(username)')
      .eq('group_id',group.id).or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`).order('created_at',{ascending:false})
    if(b) setBets(b)
  }

  async function sendMsg(e){
    e.preventDefault();if(!chatMsg.trim())return
    await supabase.from('messages').insert({user_id:user.id,group_id:group.id,content:chatMsg.trim()})
    setChatMsg('')
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2500)}

  const groups=[...new Set(MATCHES.map(m=>m.group))].sort()

  return(
    <div style={{minHeight:'100vh',background:'#0a1628'}}>
      <header style={{background:'linear-gradient(135deg,#003a7a,#0a1628)',borderBottom:'3px solid #F5C518',
        padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:200}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onBack}
            style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',
              color:'#fff',borderRadius:8,padding:'6px 12px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            ‹ Mis Prodes
          </button>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:'#F5C518',lineHeight:1}}>{group.name}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:2}}>
              Código: <strong style={{letterSpacing:3}}>{group.code}</strong>
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Avatar name={profile?.username||'?'} size={32}/>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.7)',fontWeight:700}}>{profile?.username}</span>
        </div>
      </header>

      <nav style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid rgba(255,255,255,0.08)',
        display:'flex',overflowX:'auto',position:'sticky',top:63,zIndex:199}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'12px 20px',background:'transparent',border:'none',
              borderBottom:tab===t.id?'3px solid #F5C518':'3px solid transparent',
              color:tab===t.id?'#F5C518':'rgba(255,255,255,0.5)',fontWeight:tab===t.id?800:400,
              fontSize:14,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{maxWidth:860,margin:'0 auto',padding:'24px 16px 80px'}}>

        {/* ── PRODE TAB ── */}
        {tab==='prode'&&(
          <div>
            <div style={{marginBottom:20,padding:'12px 16px',background:'rgba(245,197,24,0.08)',
              border:'1px solid rgba(245,197,24,0.2)',borderRadius:10,fontSize:13,color:'rgba(255,255,255,0.6)',
              display:'flex',flexWrap:'wrap',gap:16}}>
              <span>🟡 Exacto = <strong style={{color:'#F5C518'}}>3 pts</strong></span>
              <span>⚪ Resultado = <strong style={{color:'#fff'}}>1 pt</strong></span>
              <span>🏆 Final = <strong style={{color:'#F5C518'}}>5 pts</strong></span>
            </div>
            {groups.map(gr=>(
              <section key={gr} style={{marginBottom:36}}>
                <h3 style={{color:'#F5C518',fontSize:18,fontWeight:900,letterSpacing:2,
                  paddingBottom:8,marginBottom:14,borderBottom:'2px solid rgba(245,197,24,0.2)'}}>
                  GRUPO {gr}
                </h3>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {MATCHES.filter(m=>m.group===gr).map(match=>{
                    const pred=preds[match.id]||{}
                    const liveKey=`${match.apiHome}_${match.apiAway}`
                    const lv=live[liveKey]
                    const isLive=['1H','2H','HT','ET','PEN'].includes(lv?.status)
                    const isDone=['FT','AET','PEN'].includes(lv?.status)
                    const others=allPreds.filter(p=>p.match_id===match.id&&p.user_id!==user.id)
                    const canSave=pred.home!=null&&pred.away!=null
                    return(
                      <Card key={match.id} gold={isLive}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:6}}>
                          <span style={{fontSize:12,color:'rgba(255,255,255,0.35)'}}>📅 {match.date} {match.time}</span>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            {isLive&&<Badge color="red">🔴 EN VIVO</Badge>}
                            {isDone&&<Badge color="gray">✓ Finalizado</Badge>}
                            <button onClick={()=>{setBetMatch(match.id);setBetModal(true)}}
                              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',
                                color:'rgba(255,255,255,0.6)',borderRadius:8,padding:'4px 10px',fontSize:12,
                                cursor:'pointer',fontFamily:'inherit'}}>⚔️ Duelo</button>
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center',marginBottom:12}}>
                          <div style={{flex:1,textAlign:'right'}}>
                            <div style={{fontSize:26}}>{f(match.home)}</div>
                            <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{match.home}</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <ScoreBox value={pred.home} onChange={v=>setPreds(p=>({...p,[match.id]:{...p[match.id],home:v}}))}/>
                            <span style={{color:'rgba(255,255,255,0.3)',fontSize:20}}>–</span>
                            <ScoreBox value={pred.away} onChange={v=>setPreds(p=>({...p,[match.id]:{...p[match.id],away:v}}))}/>
                          </div>
                          <div style={{flex:1,textAlign:'left'}}>
                            <div style={{fontSize:26}}>{f(match.away)}</div>
                            <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{match.away}</div>
                          </div>
                        </div>
                        {lv&&(
                          <div style={{textAlign:'center',marginBottom:10,fontSize:14,
                            color:isLive?'#4CAF50':'rgba(255,255,255,0.5)',fontWeight:700}}>
                            {isLive?'⚽ EN VIVO':'📊 RESULTADO FINAL'}: {lv.home} – {lv.away}
                            {isLive&&lv.minute&&<span style={{marginLeft:6,fontSize:12,opacity:.7}}>min {lv.minute}</span>}
                          </div>
                        )}
                        {others.length>0&&(
                          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
                            {others.slice(0,5).map((o,i)=>{
                              const name=profiles.find(p=>p.id===o.user_id)?.username||'?'
                              return <span key={i} style={{fontSize:11,background:'rgba(255,255,255,0.07)',
                                border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'3px 9px',
                                color:'rgba(255,255,255,0.5)'}}>{name}: {o.home_score}–{o.away_score}</span>
                            })}
                          </div>
                        )}
                        <Btn v="blue" onClick={()=>savePred(match.id,pred.home,pred.away)}
                          disabled={!canSave||saving[match.id]} style={{width:'100%',padding:'11px',fontSize:14}}>
                          {saving[match.id]?'Guardando...':canSave?'💾 Guardar pronóstico':'Ingresá los goles para guardar'}
                        </Btn>
                      </Card>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── TABLA TAB ── */}
        {tab==='tabla'&&(
          <div>
            <Title>📊 TABLA DE POSICIONES</Title>
            {board.length===0?(
              <p style={{color:'rgba(255,255,255,0.35)',textAlign:'center',padding:'60px 0'}}>
                Aún no hay puntos. ¡Empezá a pronosticar!
              </p>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {board.map((row,i)=>{
                  const medals=['🥇','🥈','🥉']
                  const isMe=row.user_id===user.id
                  return(
                    <Card key={row.user_id} gold={isMe}>
                      <div style={{display:'flex',alignItems:'center',gap:14}}>
                        <span style={{fontSize:26,minWidth:36,textAlign:'center'}}>{medals[i]||`#${i+1}`}</span>
                        <Avatar name={row.profiles?.username||'?'} size={44}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:19,fontWeight:700}}>
                            {row.profiles?.username||'Jugador'}
                            {isMe&&<span style={{fontSize:12,color:'#F5C518',marginLeft:8}}>(vos)</span>}
                          </div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>
                            {row.exact_hits||0} exactos · {row.result_hits||0} correctos
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:34,fontWeight:900,color:'#F5C518',lineHeight:1}}>{row.points||0}</div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>pts</div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DUELOS TAB ── */}
        {tab==='duelos'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <Title>⚔️ DUELOS</Title>
              <Btn v="primary" onClick={()=>{setBetMatch(null);setBetModal(true)}}>+ Nuevo duelo</Btn>
            </div>
            <div style={{marginBottom:20,padding:'12px 16px',background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>
              🤝 El que quede más cerca del resultado real gana la apuesta. 🍾
            </div>
            {bets.length===0?(
              <p style={{color:'rgba(255,255,255,0.35)',textAlign:'center',padding:'60px 0'}}>
                No hay duelos. ¡Desafiá a alguien!
              </p>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {bets.map(bet=>{
                  const match=MATCHES.find(m=>m.id===bet.match_id)
                  const se={vaso:'🥃',botella:'🍾',asado:'🥩'}
                  const sl={vaso:'Vaso de Fernet',botella:'Botella de Fernet',asado:'Asado'}
                  const canAccept=bet.challenged_id===user.id&&bet.status==='pending'
                  return(
                    <Card key={bet.id}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <span style={{fontSize:30}}>{se[bet.stake]||'🍺'}</span>
                          <div>
                            <div style={{fontSize:17,fontWeight:800,color:'#F5C518'}}>{sl[bet.stake]}</div>
                            <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>
                              {bet.challenger?.username} → {bet.challenged?.username}
                            </div>
                          </div>
                        </div>
                        <Badge color={bet.status==='pending'?'orange':bet.status==='accepted'?'green':'gray'}>
                          {bet.status==='pending'?'⏳ Pendiente':bet.status==='accepted'?'✅ En juego':'Finalizado'}
                        </Badge>
                      </div>
                      {match&&<div style={{fontSize:13,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.04)',
                        borderRadius:8,padding:'8px 12px',marginBottom:canAccept?12:0}}>
                        ⚽ {f(match.home)}{match.home} vs {f(match.away)}{match.away} · {match.date}
                      </div>}
                      {canAccept&&(
                        <div style={{display:'flex',gap:10,marginTop:12}}>
                          <Btn v="green" onClick={()=>acceptBet(bet.id)} style={{flex:1}}>✅ Aceptar</Btn>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FINAL TAB ── */}
        {tab==='final'&&(
          <div>
            <Title>🏆 PRONÓSTICOS FINALES</Title>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,marginBottom:24,lineHeight:1.6}}>
              Cada pronóstico correcto suma <strong style={{color:'#F5C518'}}>5 puntos extra</strong>.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {KNOCKOUT_PREDS.map(round=>(
                <Card key={round.id}>
                  <h3 style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:14}}>{round.emoji} {round.label}</h3>
                  <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                    {round.options.map(opt=>{
                      const sel=koPreds[round.id]===opt
                      return(
                        <button key={opt} onClick={()=>saveKo(round.id,opt)}
                          style={{padding:'10px 16px',borderRadius:10,cursor:'pointer',fontFamily:'inherit',
                            border:`2px solid ${sel?'#F5C518':'rgba(255,255,255,0.15)'}`,
                            background:sel?'rgba(245,197,24,0.18)':'rgba(255,255,255,0.04)',
                            color:sel?'#F5C518':'rgba(255,255,255,0.7)',fontWeight:sel?800:400,fontSize:15,
                            display:'flex',alignItems:'center',gap:6,transition:'all .15s'}}>
                          {FLAG[opt]&&<span>{FLAG[opt]}</span>}
                          {opt}{sel&&<span style={{fontSize:12}}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                  {koPreds[round.id]&&(
                    <p style={{marginTop:12,fontSize:13,color:'#4CAF50',fontWeight:700}}>
                      ✓ Tu pronóstico: {koPreds[round.id]}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab==='chat'&&(
          <div style={{display:'flex',flexDirection:'column',height:'68vh'}}>
            <Title>💬 CHAT DEL GRUPO</Title>
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
              {msgs.length===0&&<p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',marginTop:40}}>
                Nadie dijo nada todavía 🧊
              </p>}
              {msgs.map((msg,i)=>{
                const isMe=msg.user_id===user.id
                const name=msg.profiles?.username||'?'
                const COLS=['#1565C0','#4CAF50','#FF6F00','#6A1B9A','#C62828','#00838F']
                const col=COLS[(name.charCodeAt(0)||0)%COLS.length]
                return(
                  <div key={msg.id||i} style={{display:'flex',gap:10,alignSelf:isMe?'flex-end':'flex-start',
                    flexDirection:isMe?'row-reverse':'row',maxWidth:'80%'}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:col,flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',marginTop:2}}>
                      {name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      {!isMe&&<div style={{fontSize:11,color:col,fontWeight:800,marginBottom:3}}>{name}</div>}
                      <div style={{background:isMe?'#1565C0':'rgba(255,255,255,0.08)',padding:'9px 14px',
                        lineHeight:1.5,fontSize:15,borderRadius:isMe?'14px 14px 2px 14px':'14px 14px 14px 2px'}}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>
            <form onSubmit={sendMsg} style={{display:'flex',gap:10}}>
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Escribí algo... 💬"
                style={{flex:1,padding:'12px 18px',background:'rgba(255,255,255,0.07)',
                  border:'1px solid rgba(255,255,255,0.15)',borderRadius:30,color:'#fff',
                  fontSize:15,fontFamily:'inherit',outline:'none'}}/>
              <button type="submit" style={{padding:'12px 22px',background:'#F5C518',border:'none',
                borderRadius:30,color:'#000',fontWeight:900,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
                Enviar
              </button>
            </form>
          </div>
        )}
      </main>

      {toast&&(
        <div style={{position:'fixed',top:80,right:20,background:'#2e7d32',color:'#fff',
          padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:700,zIndex:999}}>
          {toast}
        </div>
      )}

      {betModal&&<BetModal profiles={profiles} userId={user.id} preMatchId={betMatch}
        onClose={()=>setBetModal(false)} onCreate={createBet}/>}
    </div>
  )
}

function BetModal({profiles,userId,preMatchId,onClose,onCreate}){
  const [target,setTarget]=useState('')
  const [matchId,setMatchId]=useState(preMatchId||'')
  const [stake,setStake]=useState('botella')
  function go(){
    const tp=profiles.find(p=>p.username===target)
    if(!tp||!matchId) return
    onCreate({challenged_id:tp.id,match_id:parseInt(matchId),stake})
    onClose()
  }
  const sel={padding:'12px 14px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',
    borderRadius:10,color:'#fff',fontSize:15,fontFamily:'inherit',outline:'none',width:'100%'}
  return(
    <Modal onClose={onClose}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h3 style={{color:'#F5C518',fontSize:22,fontWeight:900,margin:0}}>⚔️ Nuevo Duelo</h3>
        <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:22,cursor:'pointer'}}>✕</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div>
          <label style={{fontSize:13,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:6}}>Desafiar a:</label>
          <select value={target} onChange={e=>setTarget(e.target.value)} style={sel}>
            <option value="">Elegí un participante</option>
            {profiles.filter(p=>p.id!==userId).map(p=><option key={p.id} value={p.username}>{p.username}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:13,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:6}}>Partido:</label>
          <select value={matchId} onChange={e=>setMatchId(e.target.value)} style={sel}>
            <option value="">Elegí el partido</option>
            {MATCHES.map(m=><option key={m.id} value={m.id}>{f(m.home)}{m.home} vs {f(m.away)}{m.away} · {m.date}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:13,color:'rgba(255,255,255,0.5)',display:'block',marginBottom:10}}>La apuesta:</label>
          <div style={{display:'flex',gap:10}}>
            {FERNET_BETS.map(b=>(
              <button key={b.id} onClick={()=>setStake(b.id)}
                style={{flex:1,padding:'14px 8px',borderRadius:12,cursor:'pointer',fontFamily:'inherit',
                  border:`2px solid ${stake===b.id?'#F5C518':'rgba(255,255,255,0.15)'}`,
                  background:stake===b.id?'rgba(245,197,24,0.15)':'rgba(255,255,255,0.04)',
                  color:stake===b.id?'#F5C518':'rgba(255,255,255,0.65)',textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:6}}>{b.emoji}</div>
                <div style={{fontSize:11,lineHeight:1.4,fontWeight:stake===b.id?800:400}}>{b.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:24}}>
        <Btn v="ghost" onClick={onClose} style={{flex:1,padding:'13px'}}>Cancelar</Btn>
        <Btn v="primary" onClick={go} disabled={!target||!matchId} style={{flex:2,padding:'13px',fontSize:16}}>
          Enviar desafío 🤝
        </Btn>
      </div>
    </Modal>
  )
}
