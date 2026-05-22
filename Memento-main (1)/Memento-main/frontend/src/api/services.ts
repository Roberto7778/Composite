import client from './client';
import {
  AuthResponse,
  RegisterData,
  CrearPrescripcionData,
  NuevaPrescripcionAlergiaData,
  Paciente,
  Medico,
  Prescripcion,
  HistorialResponse,
  ComparacionResponse,
  PerfilPacienteResponse,
} from '../types';

// Auth
export const authAPI = {
  register: (data: RegisterData) => client.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (email: string, password: string) => client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
};

// Pacientes
export const pacientesAPI = {
  crear: (data: { nombre: string; edad: number; alergias?: string[] }) => client.post<Paciente>('/pacientes', data).then((r) => r.data),
  getAll: () => client.get<Paciente[]>('/pacientes').then((r) => r.data),
  getById: (id: string) => client.get<Paciente>(`/pacientes/${id}`).then((r) => r.data),
  getPerfil: () => client.get<PerfilPacienteResponse>('/pacientes/perfil').then((r) => r.data),
  updateAlergias: (id: string, alergias: string[]) => client.put<Paciente>(`/pacientes/${id}/alergias`, { alergias }).then((r) => r.data),
};

// Medicos
export const medicosAPI = {
  getAll: () => client.get<Medico[]>('/medicos').then((r) => r.data),
  getById: (id: string) => client.get<Medico>(`/medicos/${id}`).then((r) => r.data),
  getPerfil: () => client.get<Medico>('/medicos/perfil').then((r) => r.data),
};

// Prescripciones
export const prescripcionesAPI = {
  crear: (data: CrearPrescripcionData) => client.post<Prescripcion>('/prescripciones', data).then((r) => r.data),
  crearPorAlergia: (data: NuevaPrescripcionAlergiaData) => client.post('/prescripciones/alergia', data).then((r) => r.data),
  getHistorial: (pacienteId: string) => client.get<HistorialResponse>(`/prescripciones/historial/${pacienteId}`).then((r) => r.data),
  comparar: (id1: string, id2: string) => client.get<ComparacionResponse>(`/prescripciones/comparar/${id1}/${id2}`).then((r) => r.data),
  getActivas: (pacienteId: string) => client.get<Prescripcion[]>(`/prescripciones/activas/${pacienteId}`).then((r) => r.data),
  getCadena: (id: string) => client.get<Prescripcion[]>(`/prescripciones/cadena/${id}`).then((r) => r.data),
  getById: (id: string) => client.get<Prescripcion>(`/prescripciones/${id}`).then((r) => r.data),
  enviarEmail: (id: string, email: string) => client.post(`/prescripciones/${id}/email`, { email }).then((r) => r.data),
};
