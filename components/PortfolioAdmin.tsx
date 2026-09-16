"use client";

import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { defaultPortfolioConfig, PortfolioConfig, savePortfolioConfig } from "@/lib/portfolio-config";

export default function PortfolioAdmin({ config, setConfig, notify }: { config: PortfolioConfig; setConfig: React.Dispatch<React.SetStateAction<PortfolioConfig>>; notify: (message: string) => void }) {
  const update = (field: keyof PortfolioConfig, value: string) => setConfig((current) => ({ ...current, [field]: value }));
  const save = () => { savePortfolioConfig(config); notify("Portfolio settings saved"); };
  const reset = () => { setConfig(defaultPortfolioConfig); savePortfolioConfig(defaultPortfolioConfig); notify("Portfolio settings restored"); };

  return <section className="admin-editor">
    <div className="admin-actions"><div><p className="kicker">PORTFOLIO ADMIN</p><h2>Edit public content</h2></div><div><button className="secondary" onClick={reset}><RotateCcw size={15}/>Reset</button><button className="primary" onClick={save}><Save size={15}/>Save changes</button></div></div>
    <div className="admin-fields">
      <label>Name<input value={config.name} onChange={(e)=>update("name",e.target.value)}/></label><label>Role<input value={config.role} onChange={(e)=>update("role",e.target.value)}/></label>
      <label className="wide">Availability<input value={config.availability} onChange={(e)=>update("availability",e.target.value)}/></label>
      <label className="wide">Portfolio headline<input value={config.headline} onChange={(e)=>update("headline",e.target.value)}/></label>
      <label className="wide">Intro<textarea value={config.intro} onChange={(e)=>update("intro",e.target.value)}/></label><label className="wide">About<textarea value={config.about} onChange={(e)=>update("about",e.target.value)}/></label>
      <label>Email<input type="email" value={config.email} onChange={(e)=>update("email",e.target.value)}/></label><label>Location<input value={config.location} onChange={(e)=>update("location",e.target.value)}/></label><label className="wide">GitHub URL<input type="url" value={config.githubUrl} onChange={(e)=>update("githubUrl",e.target.value)}/></label>
    </div>
    <div className="admin-project-heading"><h3>Resume projects</h3><button className="secondary" onClick={()=>setConfig((current)=>({...current,projects:[...current.projects,{id:`project-${Date.now()}`,name:"New project",summary:"Describe the project and its impact.",stack:"Technology stack",repo:current.githubUrl,demo:"",accent:"forest"}]}))}><Plus size={15}/>Add project</button></div>
    <div className="admin-projects">{config.projects.map((project,index)=><article key={project.id}><div className="row"><b>Project {index+1}</b><button className="icon" aria-label={`Delete ${project.name}`} onClick={()=>setConfig((current)=>({...current,projects:current.projects.filter((item)=>item.id!==project.id)}))}><Trash2 size={15}/></button></div><input value={project.name} onChange={(e)=>setConfig((current)=>({...current,projects:current.projects.map((item)=>item.id===project.id?{...item,name:e.target.value}:item)}))}/><textarea value={project.summary} onChange={(e)=>setConfig((current)=>({...current,projects:current.projects.map((item)=>item.id===project.id?{...item,summary:e.target.value}:item)}))}/><input value={project.stack} onChange={(e)=>setConfig((current)=>({...current,projects:current.projects.map((item)=>item.id===project.id?{...item,stack:e.target.value}:item)}))}/><input type="url" placeholder="Repository URL" value={project.repo} onChange={(e)=>setConfig((current)=>({...current,projects:current.projects.map((item)=>item.id===project.id?{...item,repo:e.target.value}:item)}))}/><input type="url" placeholder="Live demo URL (optional)" value={project.demo} onChange={(e)=>setConfig((current)=>({...current,projects:current.projects.map((item)=>item.id===project.id?{...item,demo:e.target.value}:item)}))}/></article>)}</div>
  </section>;
}
