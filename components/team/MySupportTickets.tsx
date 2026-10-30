'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function MySupportTickets({ userId, isDarkMode }: { userId?: string; isDarkMode: boolean }) {
  const [tickets,setTickets]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const theme={card:isDarkMode?'#161B22':'#FFFFFF',border:isDarkMode?'#30363D':'#E2E8F0',text:isDarkMode?'#F0F6FC':'#0F172A',muted:isDarkMode?'#8B949E':'#64748B'};
  const load=useCallback(async()=>{
    if(!userId)return;
    setLoading(true);
    const {data}=await supabase.from('support_tickets').select('id,subject,message,status,staff_reply,created_at,updated_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(30);
    setTickets(data||[]);setLoading(false);
  },[userId]);
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!userId)return;
    const channel=supabase.channel('my-support-tickets-'+userId).on('postgres_changes',{event:'*',schema:'public',table:'support_tickets',filter:'user_id=eq.'+userId},()=>void load()).subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[userId,load]);
  if(!userId)return null;
  return <section style={{border:'1px solid '+theme.border,borderRadius:14,background:theme.card,padding:'clamp(1rem,4vw,2rem)',display:'grid',gap:12}}>
    <div><h2 style={{margin:0}}>My Support Requests</h2><p style={{color:theme.muted,fontSize:13,margin:'5px 0 0'}}>View replies and track the status of your requests.</p></div>
    {loading?<p style={{color:theme.muted}}>Loading requests…</p>:tickets.length===0?<p style={{color:theme.muted}}>You have not submitted a support request yet.</p>:tickets.map(t=><article key={t.id} style={{borderTop:'1px solid '+theme.border,paddingTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>{t.subject}</strong><span style={{fontSize:12,color:theme.muted}}>{t.status}</span></div>
      <p style={{whiteSpace:'pre-wrap',margin:'8px 0'}}>{t.message}</p>
      {t.staff_reply&&<div style={{background:isDarkMode?'#0E1117':'#F8FAFC',borderRadius:9,padding:12}}><small style={{color:theme.muted}}>North Synapse Team</small><p style={{whiteSpace:'pre-wrap',margin:'5px 0 0'}}>{t.staff_reply}</p></div>}
      <small style={{color:theme.muted}}>{new Date(t.created_at).toLocaleString()}</small>
    </article>)}
  </section>;
}
