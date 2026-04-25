import React, { useState } from 'react';
import { X, Wallet, Copy, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const DepositModal = ({ isOpen, onClose, walletAddress, user }) => {
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Billetera copiada');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refNumber.trim()) return toast.info('Ingresa el número de referencia');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'deposit_requests'), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userEmail: user.email,
        referenceNumber: refNumber.trim(),
        status: 'pendiente',
        createdAt: serverTimestamp()
      });
      toast.success('Solicitud enviada. El administrador validará tu depósito pronto.');
      setRefNumber('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#001532] rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center border border-warning/30 text-warning">
                <Wallet size={20} />
              </div>
              <h3 className="font-sport text-xl text-white uppercase tracking-tight italic italic-gradient-text">Depositar Fondos</h3>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Red de Red: USDT (TRC-20)</p>
              <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-white font-mono truncate flex-1">{walletAddress || 'No configurada'}</span>
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/10 rounded-lg text-primary transition-all"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex items-start gap-2 mt-4 text-[9px] text-white/40 leading-relaxed italic">
                 <Info size={12} className="shrink-0 mt-0.5" />
                 <span>Asegúrate de enviar fondos a través de la red TRC-20 únicamente. De lo contrario, los fondos podrían perderse.</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Número de Referencia / Hash</label>
                <input 
                  type="text" 
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Pega el código de transacción de Binance o tu wallet..."
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-white text-sm focus:border-primary transition-all outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="btn w-full h-14 bg-primary text-black font-sport text-base tracking-widest uppercase hover:scale-[1.02] shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR DEPÓSITO'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
