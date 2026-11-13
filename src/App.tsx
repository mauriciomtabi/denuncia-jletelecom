import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
  Search,
  X,
  FileText
} from 'lucide-react';

const CATEGORIAS = [
  'Assédio Moral',
  'Assédio Sexual',
  'Descumprimento de Normas de Segurança / EPI',
  'Fraude, Desvio ou Roubo de Materiais/Combustível',
  'Discriminação ou Preconceito',
  'Conduta Inapropriada / Conflito de Interesses',
  'Outro Assunto Ético'
];

export default function App() {
  useEffect(() => {
    document.title = 'Canal de Denúncias | JLE Telecom';
  }, []);

  const [activeTab, setActiveTab] = useState<'nova' | 'consulta'>('nova');

  // Form states
  const [categoria, setCategoria] = useState('');
  const [unidade, setUnidade] = useState('');
  const [envolvidos, setEnvolvidos] = useState('');
  const [testemunhas, setTestemunhas] = useState('');
  const [relato, setRelato] = useState('');
  const [tipoIdentificacao, setTipoIdentificacao] = useState<'anonimo' | 'identificado'>('anonimo');
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Submission states
  const [loading, setLoading] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Consulta states
  const [buscaProtocolo, setBuscaProtocolo] = useState('');
  const [consultaResult, setConsultaResult] = useState<any | null>(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 5) {
        alert('Você pode anexar no máximo 5 arquivos.');
        return;
      }
      setFiles(prev => [...prev, ...selected].slice(0, 5));
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!categoria) {
      setErrorMessage('Por favor, selecione a categoria da ocorrência.');
      return;
    }
    if (!relato || relato.trim().length < 10) {
      setErrorMessage('Por favor, descreva o relato com pelo menos 10 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const isIdentificado = tipoIdentificacao === 'identificado';
      const formData = new FormData();
      formData.append('categoria', categoria);
      formData.append('unidade_ou_obra', unidade);
      formData.append('envolvidos', envolvidos);
      formData.append('testemunhas', testemunhas);
      formData.append('relato', relato);
      formData.append('identificado', String(isIdentificado));
      if (isIdentificado) {
        formData.append('nome_identificado', nome);
        formData.append('contato_identificado', contato);
      }

      files.forEach(file => {
        formData.append('anexos', file);
      });

      const res = await fetch('/api/denuncias', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar manifestação');
      }

      setProtocoloGerado(data.protocolo);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível enviar o formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaProtocolo.trim()) return;

    setConsultaLoading(true);
    setConsultaError('');
    setConsultaResult(null);

    try {
      const res = await fetch(`/api/denuncias/consulta/${encodeURIComponent(buscaProtocolo.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Protocolo não localizado no sistema.');
      }
      setConsultaResult(data);
    } catch (err: any) {
      setConsultaError(err.message || 'Protocolo não encontrado.');
    } finally {
      setConsultaLoading(false);
    }
  };

  const copiarProtocolo = () => {
    if (protocoloGerado) {
      navigator.clipboard.writeText(protocoloGerado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const resetForm = () => {
    setCategoria('');
    setUnidade('');
    setEnvolvidos('');
    setTestemunhas('');
    setRelato('');
    setTipoIdentificacao('anonimo');
    setNome('');
    setContato('');
    setFiles([]);
    setProtocoloGerado(null);
    setErrorMessage('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#1E293B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Header Institucional Branco */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src="/logo_jle_web.png"
              alt="JLE Telecom"
              style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F3854', letterSpacing: '-0.2px' }}>
                Canal de Denúncias
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Integridade e Ética JLE
              </div>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#0F3854',
            backgroundColor: '#F0F9FF',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #BAE6FD',
            fontWeight: 500
          }}>
            <Lock size={13} color="#0F3854" />
            <span>Ambiente Seguro & Sigiloso</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Apresentação do Canal */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            Canal de Denúncias
          </h1>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', margin: 0 }}>
            Um espaço seguro e sigiloso para relatar situações que não estão de acordo com o respeito, a segurança e a integridade da JLE.
          </p>
        </div>

        {/* Caixa de Confiança e Sigilo */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '16px 18px',
          marginBottom: '28px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div style={{ color: '#0F3854', flexShrink: 0 }}>
            <Lock size={20} />
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#334155' }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>
              Seu relato é sigiloso e você pode escolher não se identificar.
            </strong>
            Ninguém saberá quem enviou a mensagem se você optar pelo anonimato. A JLE apoia e protege quem relata de boa-fé.
          </div>
        </div>

        {/* Abas Superiores */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('nova')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'nova' ? '2px solid #0F3854' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'nova' ? '#0F3854' : '#64748B',
              fontWeight: activeTab === 'nova' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            Registrar Nova Denúncia
          </button>
          <button
            onClick={() => setActiveTab('consulta')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'consulta' ? '2px solid #0F3854' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'consulta' ? '#0F3854' : '#64748B',
              fontWeight: activeTab === 'consulta' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '-1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={15} /> Acompanhar Protocolo
          </button>
        </div>

        {/* ABA 1: FORMULÁRIO */}
        {activeTab === 'nova' && (
          <div>
            {protocoloGerado ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '40px 24px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle2 size={32} />
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                  Manifestação Registrada com Sucesso
                </h2>
                <p style={{ color: '#475569', fontSize: '14px', maxWidth: '520px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                  Seu relato foi recebido de forma segura pelo comitê responsável. Guarde o número de protocolo abaixo caso deseje consultar o andamento posteriormente.
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '12px 20px',
                  marginBottom: '24px'
                }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Protocolo:</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F3854', letterSpacing: '0.5px' }}>
                    {protocoloGerado}
                  </span>
                  <button
                    onClick={copiarProtocolo}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      color: copiado ? '#059669' : '#334155',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 500
                    }}
                  >
                    {copiado ? <Check size={13} /> : <Copy size={13} />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <div>
                  <button
                    onClick={resetForm}
                    style={{
                      backgroundColor: '#0F3854',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Registrar Outra Manifestação
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '28px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                {errorMessage && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    color: '#991B1B',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Opção de Identificação - Cards Modernos */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
                    Como você prefere se manifestar?
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    
                    {/* Opção 1: Anônimo */}
                    <div
                      onClick={() => setTipoIdentificacao('anonimo')}
                      style={{
                        border: tipoIdentificacao === 'anonimo' ? '2px solid #0F3854' : '1px solid #E2E8F0',
                        backgroundColor: tipoIdentificacao === 'anonimo' ? '#F0F9FF' : '#FFFFFF',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: tipoIdentificacao === 'anonimo' ? '#E0F2FE' : '#F1F5F9',
                        color: tipoIdentificacao === 'anonimo' ? '#0F3854' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Lock size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Não quero me identificar</span>
                          {tipoIdentificacao === 'anonimo' && (
                            <CheckCircle2 size={16} color="#0F3854" />
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          Relato 100% anônimo e confidencial.
                        </div>
                      </div>
                    </div>

                    {/* Opção 2: Identificado */}
                    <div
                      onClick={() => setTipoIdentificacao('identificado')}
                      style={{
                        border: tipoIdentificacao === 'identificado' ? '2px solid #0F3854' : '1px solid #E2E8F0',
                        backgroundColor: tipoIdentificacao === 'identificado' ? '#F0F9FF' : '#FFFFFF',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: tipoIdentificacao === 'identificado' ? '#E0F2FE' : '#F1F5F9',
                        color: tipoIdentificacao === 'identificado' ? '#0F3854' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <UserCheck size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Quero me identificar</span>
                          {tipoIdentificacao === 'identificado' && (
                            <CheckCircle2 size={16} color="#0F3854" />
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          Vou informar meu nome ou contato.
                        </div>
                      </div>
                    </div>

                  </div>

                  {tipoIdentificacao === 'identificado' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '12px',
                      marginTop: '12px',
                      padding: '14px 16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
                          Seu Nome Completo:
                        </label>
                        <input
                          type="text"
                          value={nome}
                          onChange={e => setNome(e.target.value)}
                          placeholder="Informe seu nome"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#0F172A',
                            backgroundColor: '#FFFFFF'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
                          Telefone ou E-mail para contato:
                        </label>
                        <input
                          type="text"
                          value={contato}
                          onChange={e => setContato(e.target.value)}
                          placeholder="Ex: (41) 99999-9999 ou seu@email.com"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#0F172A',
                            backgroundColor: '#FFFFFF'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Tipo de Ocorrência <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      Selecione o assunto da manifestação...
                    </option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#FFFFFF', color: '#0F172A', padding: '8px' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Local / Unidade */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Local do Ocorrido (Opcional)
                  </label>
                  <input
                    type="text"
                    value={unidade}
                    onChange={e => setUnidade(e.target.value)}
                    placeholder="Ex: Obra MDU Joinville, Canteiro Curitiba, Escritório Central..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                </div>

                {/* Envolvidos e Testemunhas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                      Pessoas Envolvidas (Opcional)
                    </label>
                    <input
                      type="text"
                      value={envolvidos}
                      onChange={e => setEnvolvidos(e.target.value)}
                      placeholder="Nome ou função da pessoa citada"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                      Testemunhas (Opcional)
                    </label>
                    <input
                      type="text"
                      value={testemunhas}
                      onChange={e => setTestemunhas(e.target.value)}
                      placeholder="Quem mais presenciou o fato?"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                  </div>
                </div>

                {/* Relato */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                    Relato dos Fatos <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                    Descreva o ocorrido com o máximo de detalhes (o que aconteceu, datas aproximadas e circunstâncias).
                  </span>
                  <textarea
                    rows={6}
                    value={relato}
                    onChange={e => setRelato(e.target.value)}
                    required
                    placeholder="Digite seu relato aqui..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Upload de Arquivos */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    Anexar Evidências (Fotos, Áudios ou Documentos)
                  </label>
                  
                  <div style={{
                    border: '1px dashed #CBD5E1',
                    borderRadius: '6px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      id="anexos-input"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.mp3,.m4a"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="anexos-input" style={{ cursor: 'pointer', display: 'block' }}>
                      <UploadCloud size={28} color="#64748B" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                        Clique aqui para selecionar os arquivos
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        Formatos permitidos: JPG, PNG, PDF, Word, Áudios (até 5 arquivos de no máximo 15MB cada)
                      </div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {files.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#F1F5F9',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                            <FileText size={14} color="#64748B" /> {f.name} ({Math.round(f.size / 1024)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '2px' }}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão de Envio */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#94A3B8' : '#0F3854',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 28px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Transmitindo relato...' : 'Enviar Manifestação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ABA 2: CONSULTA DE PROTOCOLO */}
        {activeTab === 'consulta' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '28px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 6px' }}>
              Consultar Situação de Manifestação
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px', lineHeight: '1.5' }}>
              Informe o número de protocolo gerado no momento do envio para acompanhar o status do atendimento.
            </p>

            <form onSubmit={handleConsultar} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={buscaProtocolo}
                onChange={e => setBuscaProtocolo(e.target.value.toUpperCase())}
                placeholder="Ex: DEN-2026-X839A"
                required
                style={{
                  flex: '1',
                  minWidth: '220px',
                  padding: '10px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              />
              <button
                type="submit"
                disabled={consultaLoading}
                style={{
                  backgroundColor: '#0F3854',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: consultaLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Search size={15} /> {consultaLoading ? 'Buscando...' : 'Consultar'}
              </button>
            </form>

            {consultaError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                padding: '12px 14px',
                color: '#991B1B',
                fontSize: '13px'
              }}>
                {consultaError}
              </div>
            )}

            {consultaResult && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '18px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Protocolo:</span>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F3854' }}>
                      {consultaResult.protocolo}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: consultaResult.status === 'nova' ? '#EFF6FF' : '#ECFDF5',
                    color: consultaResult.status === 'nova' ? '#1D4ED8' : '#047857'
                  }}>
                    {consultaResult.status === 'nova' ? 'Recebido / Em Triagem' : 'Em Análise / Apuração'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
                  <div><strong>Categoria:</strong> {consultaResult.categoria}</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Data de Registro:</strong> {new Date(consultaResult.created_at).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', color: '#64748B' }}>
                    As apurações ocorrem sob estrito sigilo. Novas providências ou desdobramentos serão conduzidos pelo Comitê de Integridade.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
