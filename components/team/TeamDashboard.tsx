'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Flag, Headset, Users, RefreshCw } from 'lucide-react';

type Props = { teamRole: string | null; isAdmin: boolean; isDarkMode: boolean };
export default function TeamDashboard({ teamRole, isAdmin, isDarkMode }: Props) {
  const [metrics,setMetrics]=useState<any>(null);
  const [reports,setReports]=useState<any[]>([]);
  const [tickets,setTickets]=useState<any[]>([]);
  const [directory,setDirectory]=useState<any[]>([]);
  const [search,setSearch]=useState('');
  const [replyDrafts,setReplyDrafts]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const canOpen=!!isAdmin||!!teamRole;
  const isCore=isAdmin||teamRole==='core_team';
  const theme={bg:isDarkMode?'#0E1117':'#F8FAFC',card:isDarkMode?'#161B22':'#FFFFFF',border:isDarkMode?'#30363D':'#E2E8F0',text:isDarkMode?'#F0F6FC':'#0F172A',muted:isDarkMode?'#8B949E':'#64748B',accent:'#8B5CF6'};

  const load=useCallback(async()=>{
    if(!canOpen)return;
    setLoading(true);setError('');
    const [m,r,t]=await Promise.all([
      supabase.rpc('admin_dashboard_metrics'),
      supabase.from('content_reports').select('id,reporter_id,target_type,target_id,reason,status,created_at,resolution').order('created_at',{ascending:false}).limit(100),
      supabase.from('support_tickets').select('id,user_id,subject,message,status,staff_reply,created_at,updated_at').order('created_at',{ascending:false}).limit(100)
    ]);
    if(m.error)setError(m.error.message);else setMetrics(m.data);
    if(r.error)setError(r.error.message);else {
      const reportRows=r.data||[];
      const resourceIds=reportRows.filter((x:any)=>x.target_type==='resource').map((x:any)=>x.target_id);
      const discussionIds=reportRows.filter((x:any)=>x.target_type==='discussion').map((x:any)=>x.target_id);
      const replyIds=reportRows.filter((x:any)=>x.target_type==='reply').map((x:any)=>x.target_id);
      const [resourceRows,discussionRows,replyRows]=await Promise.all([
        resourceIds.length?supabase.from('resources').select('id,title,description,content,moderation_hidden').in('id',resourceIds):Promise.resolve({data:[]}),
        discussionIds.length?supabase.from('discussions').select('id,title,content,moderation_hidden').in('id',discussionIds):Promise.resolve({data:[]}),
        replyIds.length?supabase.from('discussion_replies').select('id,content,moderation_hidden').in('id',replyIds):Promise.resolve({data:[]})
      ]);
      const previews:Record<string,string>={};
      const hiddenMap:Record<string,boolean>={};
      (resourceRows.data||[]).forEach((x:any)=>{previews[x.id]=x.title+' — '+(x.description||x.content||'');hiddenMap[x.id]=x.moderation_hidden;});
      (discussionRows.data||[]).forEach((x:any)=>{previews[x.id]=x.title+' — '+x.content;hiddenMap[x.id]=x.moderation_hidden;});
      (replyRows.data||[]).forEach((x:any)=>{previews[x.id]=x.content;hiddenMap[x.id]=x.moderation_hidden;});
      setReports(reportRows.map((x:any)=>({...x,target_preview:previews[x.target_id]||'Content is unavailable or has already been removed.',target_hidden:hiddenMap[x.target_id]||false})));
    }
    if(t.error)setError(t.error.message);else setTickets(t.data||[]);
    if(isCore){
      if(search.trim().length >= 2){
        const {data,error:directoryError}=await supabase.rpc('team_user_directory',{p_search:search.trim()});
        if(!directoryError)setDirectory(data||[]);else setError(directoryError.message);
      } else setDirectory([]);
    }
    setLoading(false);
  },[canOpen,isAdmin,teamRole,search,isCore]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!canOpen)return;
    const channel=supabase.channel('team-operations-dashboard')
      .on('postgres_changes',{event:'*',schema:'public',table:'content_reports'},()=>void load())
      .on('postgres_changes',{event:'*',schema:'public',table:'support_tickets'},()=>void load())
      .subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[canOpen,load]);

  async function toggleReportedContent(report:any){
    const {error:e}=await supabase.rpc('moderate_hide_content',{p_target_type:report.target_type,p_target_id:report.target_id,p_hidden:!report.target_hidden});
    if(e)setError(e.message);else{await supabase.rpc('record_team_activity',{p_action:report.target_hidden?'report_content_restored':'report_content_hidden',p_target_user_id:null,p_details:{report_id:report.id,target_id:report.target_id}});await load();}
  }
  async function updateReport(id:string,status:string){
    const {error:e}=await supabase.from('content_reports').update({status,assigned_to:(await supabase.auth.getUser()).data.user?.id,updated_at:new Date().toISOString()}).eq('id',id);
    if(e)setError(e.message);else { await supabase.rpc('record_team_activity',{p_action:'report_'+status.toLowerCase(),p_target_user_id:null,p_details:{report_id:id}}); await load(); }
  }
  async function replyTicket(ticket:any){
    const reply=(replyDrafts[ticket.id]||'').trim();if(!reply)return;
    const {error:e}=await supabase.from('support_tickets').update({staff_reply:reply,status:'In Progress',handled_by:(await supabase.auth.getUser()).data.user?.id,updated_at:new Date().toISOString()}).eq('id',ticket.id);
    if(e)setError(e.message);else{await supabase.rpc('record_team_activity',{p_action:'support_reply',p_target_user_id:ticket.user_id,p_details:{ticket_id:ticket.id}});setReplyDrafts(p=>({...p,[ticket.id]:''}));await load();}
  }
  async function closeTicket(ticket:any){
    const {error:e}=await supabase.from('support_tickets').update({status:'Resolved',handled_by:(await supabase.auth.getUser()).data.user?.id,updated_at:new Date().toISOString()}).eq('id',ticket.id);
    if(e)setError(e.message);else {await supabase.rpc('record_team_activity',{p_action:'support_resolved',p_target_user_id:ticket.user_id,p_details:{ticket_id:ticket.id}});await load();}
  }
  if(!canOpen)return null;
  const cards=[['Registered users',metrics?.registered_users],['Online now',metrics?.online_users],['Pending reports',metrics?.pending_reports],['Open support tickets',metrics?.open_support_tickets]];
  return <div style={{display:'grid',gap:18,color:theme.text}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><p style={{color:theme.accent,fontSize:12,fontWeight:800,letterSpacing:2,margin:0}}>NORTH SYNAPSE / TEAM</p><h1 style={{fontSize:28,margin:'5px 0'}}>Team Dashboard</h1><p style={{color:theme.muted,margin:0}}>Platform overview and community operations.</p></div><button onClick={()=>void load()} style={{border:`1px solid ${theme.border}`,borderRadius:8,padding:'9px 12px',background:theme.card,color:theme.text,display:'flex',gap:7,alignItems:'center'}}><RefreshCw size={15}/> Refresh</button></header>
    {error&&<p role="alert" style={{color:'#EF4444'}}>{error}</p>}
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:11}}>{cards.map(([label,value])=><div key={String(label)} style={{padding:16,border:`1px solid ${theme.border}`,borderRadius:12,background:theme.card}}><div style={{fontSize:13,color:theme.muted}}>{label}</div><div style={{fontSize:30,fontWeight:850}}>{value??'—'}</div></div>)}</section>
    <section style={{border:`1px solid ${theme.border}`,borderRadius:13,background:theme.card,padding:16,display:'grid',gap:12}}>
      <h2 style={{margin:0,fontSize:19,display:'flex',gap:8,alignItems:'center'}}><Flag size={18}/> Report queue</h2>
      {reports.length===0?<p style={{color:theme.muted}}>No reports have been submitted.</p>:reports.map(r=><article key={r.id} style={{borderTop:`1px solid ${theme.border}`,paddingTop:12,display:'grid',gap:7}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>{r.target_type} · {r.reason.slice(0,150)}</strong><span style={{fontSize:12,color:theme.muted}}>{new Date(r.created_at).toLocaleString()}</span></div>
        <p style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{r.target_preview}</p><small style={{color:theme.muted}}>Report ID: {r.id} · Target: {r.target_id} · Reporter: {r.reporter_id}</small>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:12}}>{r.status}</strong><button onClick={()=>void toggleReportedContent(r)} style={{border:'1px solid rgba(239,68,68,.45)',borderRadius:7,padding:'6px 9px',background:'transparent',color:r.target_hidden?'#10B981':'#EF4444',fontSize:12}}>{r.target_hidden?'Restore content':'Hide content'}</button>{['Pending','Reviewing','Resolved','Dismissed'].filter(s=>s!==r.status).map(s=><button key={s} onClick={()=>void updateReport(r.id,s)} style={{border:`1px solid ${theme.border}`,borderRadius:7,padding:'6px 9px',background:theme.bg,color:theme.text,fontSize:12}}>{s}</button>)}</div>
      </article>)}
    </section>
    <section style={{border:`1px solid ${theme.border}`,borderRadius:13,background:theme.card,padding:16,display:'grid',gap:12}}>
      <h2 style={{margin:0,fontSize:19,display:'flex',gap:8,alignItems:'center'}}><Headset size={18}/> User support</h2>
      {tickets.length===0?<p style={{color:theme.muted}}>No support requests yet.</p>:tickets.map(t=><article key={t.id} style={{borderTop:`1px solid ${theme.border}`,paddingTop:12,display:'grid',gap:8}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>{t.subject}</strong><small style={{color:theme.muted}}>{t.status} · {new Date(t.created_at).toLocaleString()}</small></div>
        <p style={{margin:0,whiteSpace:'pre-wrap'}}>{t.message}</p>
        {t.staff_reply&&<div style={{padding:10,borderRadius:8,background:theme.bg}}><small style={{color:theme.muted}}>Team reply</small><p style={{margin:'4px 0 0',whiteSpace:'pre-wrap'}}>{t.staff_reply}</p></div>}
        {t.status!=='Resolved'&&<><textarea value={replyDrafts[t.id]??''} onChange={e=>setReplyDrafts(p=>({...p,[t.id]:e.target.value}))} rows={2} placeholder="Write a reply..." style={{padding:10,borderRadius:8,border:`1px solid ${theme.border}`,background:theme.bg,color:theme.text}}/><div style={{display:'flex',gap:8}}><button onClick={()=>void replyTicket(t)} disabled={!(replyDrafts[t.id]||'').trim()} style={{background:theme.accent,color:'#fff',border:0,borderRadius:7,padding:'7px 11px'}}>Send reply</button><button onClick={()=>void closeTicket(t)} style={{background:'transparent',color:theme.text,border:`1px solid ${theme.border}`,borderRadius:7,padding:'7px 11px'}}>Resolve</button></div></>}
      </article>)}
    </section>
    {isCore&&<section style={{border:`1px solid ${theme.border}`,borderRadius:13,background:theme.card,padding:16,display:'grid',gap:12}}>
      <h2 style={{margin:0,fontSize:19,display:'flex',gap:8,alignItems:'center'}}><Users size={18}/> User directory</h2>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by email or name" style={{padding:10,borderRadius:8,border:`1px solid ${theme.border}`,background:theme.bg,color:theme.text}}/>
      {search.trim().length < 2 ? <p style={{color:theme.muted,margin:0}}>Enter at least 2 characters to search for a member.</p> : directory.length===0 ? <p style={{color:theme.muted,margin:0}}>No matching members found.</p> : directory.map(u=><div key={u.user_id} style={{borderTop:`1px solid ${theme.border}`,paddingTop:9,display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><div><strong>{u.nickname||u.username}</strong><div style={{fontSize:12,color:theme.muted}}>{u.email} · Joined {new Date(u.created_at).toLocaleDateString()}</div></div><span style={{fontSize:12,color:theme.muted}}>{u.team_role==='core_team'?'Core Team':u.team_role==='community_team'?'Community Team':'Member'}</span></div>)}
    </section>}

    {loading&&<small style={{color:theme.muted}}>Refreshing team data…</small>}
  </div>;
}
