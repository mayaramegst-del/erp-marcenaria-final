import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class RootBoundary extends Component {
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  render(){
    if(this.state.err)return(
      <div style={{fontFamily:"Arial,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f5f6fa",padding:24}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:800,color:"#ef4444",marginBottom:8}}>Erro ao carregar o sistema</div>
        <div style={{fontSize:13,color:"#64748b",marginBottom:20,maxWidth:400,textAlign:"center"}}>{this.state.err?.message}</div>
        <button onClick={()=>window.location.reload()} style={{padding:"10px 24px",borderRadius:10,background:"#6366f1",color:"#fff",border:"none",cursor:"pointer",fontWeight:700,fontSize:14}}>🔄 Recarregar</button>
      </div>
    );
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootBoundary>
      <App />
    </RootBoundary>
  </StrictMode>,
)
