import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { prescripcionesAPI } from '../api/services';
import { Prescripcion, Paciente, HistorialResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Clock, 
  ArrowRight, 
  GitBranch, 
  AlertTriangle, 
  User, 
  ChevronLeft, 
  ArrowDown, 
  Calendar, 
  Activity, 
  Printer,
  Mail,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { toast } from 'sonner';

const HistorialPage: React.FC = () => {
  const { pacienteId } = useParams<{ pacienteId?: string }>();
  const { usuario, perfil } = useAuth();
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<Prescripcion[]>([]);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<[string, string] | null>(null);
  const [emailInputId, setEmailInputId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadHistorial = async () => {
      try {
        let pid = pacienteId;
        if (!pid && usuario?.rol === 'paciente' && perfil && '_id' in perfil) {
          pid = (perfil as Paciente)._id;
        }
        if (!pid) {
          setLoading(false);
          return;
        }
        const data: HistorialResponse = await prescripcionesAPI.getHistorial(pid);
        setHistorial(data.historial);
        setPaciente(data.paciente);
      } catch (err) {
        console.error('Error cargando historial:', err);
        toast.error('Error al cargar el historial clínico');
      } finally {
        setLoading(false);
      }
    };
    loadHistorial();
  }, [pacienteId, usuario, perfil]);

  const toggleSelect = (id: string) => {
    if (!selectedIds) {
      setSelectedIds([id, '']);
      toast.info('Selecciona otra prescripción para comparar');
    } else if (!selectedIds[1]) {
      if (selectedIds[0] === id) {
        setSelectedIds(null);
      } else {
        setSelectedIds([selectedIds[0], id]);
      }
    } else {
      setSelectedIds([id, '']);
    }
  };

  const handleSendEmail = async (prescripcionId: string) => {
    if (!email) {
      toast.error('Por favor ingresa un correo');
      return;
    }

    setSending(true);

    try {
      await prescripcionesAPI.enviarEmail(prescripcionId, email);
      toast.success('Email enviado exitosamente');
      setEmail('');
      setEmailInputId(null);
    } catch (error) {
      toast.error('Error al enviar email');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-premium border border-gray-100">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
           </Button>
           <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
              <ClipboardList className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Expediente Clínico</h1>
              {paciente && (
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-gray-500 font-bold text-sm bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                      {paciente.nombre}
                   </span>
                   <span className="w-1 h-1 bg-gray-300 rounded-full" />
                   <span className="text-gray-500 font-medium text-sm">{paciente.edad} años</span>
                </div>
              )}
           </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedIds && selectedIds[1] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Link to={`/prescripciones/comparar/${selectedIds[0]}/${selectedIds[1]}`}>
                  <Button variant="primary" leftIcon={<GitBranch className="w-5 h-5" />}>
                     Comparar Evolución
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <Link to={`/prescripciones/nueva?paciente=${paciente?._id}`}>
            <Button variant="outline" leftIcon={<Calendar className="w-4 h-4" />}>Nueva Cita</Button>
          </Link>
        </div>
      </div>

      {paciente && paciente.alergias.length > 0 && (
        <Card className="bg-red-50 border-red-100 p-5 flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-black text-red-900 text-sm uppercase tracking-wider">Alergias Detectadas</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {paciente.alergias.map((a: string, i: number) => (
                <Badge key={i} variant="warning" className="bg-white/50 border-red-200">{a}</Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Timeline List */}
      <div className="relative pl-8">
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-200 via-gray-100 to-gray-100" />

        {historial.length === 0 ? (
          <Card variant="outline" className="p-20 text-center border-dashed bg-gray-50/50">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Historial Vacío</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Este paciente aún no cuenta con registros de prescripción en el sistema.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {historial.map((p, index) => {
              const medico = typeof p.medicoId === 'object' && p.medicoId ? (p.medicoId as any) : null;
              const isSelected = selectedIds?.includes(p._id);
              
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[27px] top-6 w-4 h-4 rounded-full border-4 bg-white z-10 transition-colors ${
                    p.activa ? 'border-medical-500 scale-125' : 'border-gray-300'
                  }`} />

                  <Card 
                    hover 
                    className={`p-6 transition-all ring-offset-4 ring-primary-500/20 ${
                      isSelected ? 'ring-4 border-primary-400 bg-primary-50/10' : ''
                    }`}
                    onClick={() => toggleSelect(p._id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4 flex-grow">
                        <div className="flex items-center flex-wrap gap-2">
                           <Badge variant={p.activa ? "success" : "default"}>
                              {p.activa ? "Prescripción Activa" : "Registro Histórico"}
                           </Badge>
                           <span className="text-xs font-black text-gray-400 uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded">
                              Snapshot #{historial.length - index}
                           </span>
                           {p.prescripcionAnteriorId && (
                             <Badge variant="info" className="flex items-center gap-1">
                                <ArrowDown className="w-3 h-3" /> Evolución
                             </Badge>
                           )}
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-gray-900">{p.medicamento}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {p.dosis}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Cada {p.horario}h</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {p.tiempoTratamiento} días</span>
                          </div>
                        </div>

                        {medico && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 w-fit">
                             <div className="p-1.5 bg-white rounded-xl shadow-sm text-primary-600">
                                <User className="w-4 h-4" />
                             </div>
                             <div className="pr-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-0.5">Médico Responsable</p>
                                <p className="text-xs font-bold text-gray-700 leading-tight">Dr. {medico.nombre}</p>
                             </div>
                          </div>
                        )}

                        {p.motivoCambio && (
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                             <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Motivo del Ajuste:</p>
                             <p className="text-sm text-amber-800 font-medium italic">"{p.motivoCambio}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col items-end gap-3 justify-between md:justify-start">
                         <div className="text-right">
                           <div className="flex items-center gap-1 text-gray-400 font-bold text-xs uppercase mb-1">
                             <Clock className="w-3 h-3" /> Fecha de Registro
                           </div>
                           <p className="font-black text-gray-900 text-lg">
                              {new Date(p.fechaCreacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                           </p>
                           <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{new Date(p.fechaCreacion).getFullYear()}</p>
                         </div>

                         <div className="flex gap-2">
                           {isSelected && (
                             <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                                <GitBranch className="w-4 h-4" />
                             </div>
                           )}
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               window.open(`/prescripciones/imprimir/${p._id}`, '_blank');
                             }}
                             className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 flex items-center gap-2 group"
                             title="Imprimir Receta"
                           >
                             <Printer className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Imprimir</span>
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setEmailInputId(emailInputId === p._id ? null : p._id);
                               setEmail('');
                             }}
                             className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100 flex items-center gap-2 group"
                             title="Enviar por Email"
                           >
                             <Mail className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Email</span>
                           </button>
                         </div>
                         {emailInputId === p._id && (
                           <div className="w-full md:w-auto mt-3 md:mt-0 p-3 bg-primary-50 rounded-xl border border-primary-100">
                             <div className="flex gap-2 items-center">
                               <Input
                                 type="email"
                                 placeholder="correo@ejemplo.com"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 className="flex-1 text-sm"
                                 onKeyDown={(e) => e.key === 'Enter' && handleSendEmail(p._id)}
                                 onClick={(e) => e.stopPropagation()}
                               />
                               <Button 
                                 size="sm" 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleSendEmail(p._id);
                                 }}
                                 disabled={sending}
                               >
                                 {sending ? 'Enviando...' : 'Enviar'}
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setEmailInputId(null);
                                   setEmail('');
                                 }}
                               >
                                 <X className="w-4 h-4" />
                               </Button>
                             </div>
                           </div>
                         )}
                      </div>
                    </div>
                  </Card>

                  {/* Connect Line to Next Snapshot */}
                  {p.prescripcionAnteriorId && index < historial.length - 1 && (
                     <div className="h-8 flex items-center justify-center -mb-4 -mt-4 relative z-0">
                        <div className="h-full w-0.5 bg-primary-400 border-l border-primary-200" />
                     </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialPage;
