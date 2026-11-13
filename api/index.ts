import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura Cloudinary se credenciais existirem
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configura Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dmwefcngefeonxuukwdl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuração do Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const DEFAULT_FROM = process.env.DENUNCIA_EMAIL_FROM || '"Canal de Denúncias JLE" <denuncia@jletelecom.com.br>';
const DEFAULT_TO = process.env.DENUNCIA_EMAIL_RECIPIENT || 'eduardo.costa@jletelecom.com.br';

// Multer memory storage (limite 5 arquivos, 15MB cada)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 5,
  },
});

function uploadBufferToCloudinary(buffer: Buffer, originalname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!useCloudinary) {
      return reject(new Error('Serviço Cloudinary não configurado'));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'jle_denuncias',
        resource_type: 'auto',
        // O upload stripa automaticamente metadados EXIF/GPS de câmeras
        context: { anonymized: 'true' },
        public_id: `den_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Falha no upload para Cloudinary'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

function gerarProtocolo(): string {
  const ano = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEN-${ano}-${rand}`;
}

async function notificarNovaDenuncia(denuncia: {
  protocolo: string;
  categoria: string;
  unidade_ou_obra?: string | null;
  relato: string;
  envolvidos?: string | null;
  testemunhas?: string | null;
  identificado: boolean;
  nome_identificado?: string | null;
  contato_identificado?: string | null;
  anexos?: Array<{ url: string; nome?: string }>;
  created_at?: string;
}) {
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Lista de destinatários: Eduardo Costa (oficial) e Mauricio Maciel (acompanhamento)
  const recipientsRaw = DEFAULT_TO.includes(',') ? DEFAULT_TO.split(',').map(s => s.trim()) : [DEFAULT_TO.trim()];

  // Adiciona Mauricio Maciel se não constar para garantia do canal
  if (!recipientsRaw.includes('mauricio.maciel@jletelecom.com.br')) {
    recipientsRaw.push('mauricio.maciel@jletelecom.com.br');
  }

  const subject = `Registro de Manifestacao JLE - Protocolo ${denuncia.protocolo} (${denuncia.categoria.substring(0, 35)})`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Canal de Denúncias JLE</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background-color: #0f2744; padding: 24px 30px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
        .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; }
        .content { padding: 28px 30px; }
        .protocol-box { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 4px; margin-bottom: 22px; }
        .protocol-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
        .protocol-val { font-size: 20px; font-weight: 800; color: #0f2744; font-family: monospace; margin-top: 2px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
        .badge-anonimo { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
        .badge-identificado { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .field { margin-bottom: 18px; }
        .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
        .field-val { font-size: 14px; color: #1e293b; background: #ffffff; padding: 10px 12px; border-radius: 4px; border: 1px solid #e2e8f0; line-height: 1.5; }
        .relato-box { background: #fafafa; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #0f172a; }
        .footer { background: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Canal de Denúncias JLE Telecom</h1>
          <p>Registro em conformidade com a Lei nº 14.457/2022</p>
        </div>
        <div class="content">
          <div class="protocol-box">
            <div class="protocol-label">Protocolo da Manifestação</div>
            <div class="protocol-val">${denuncia.protocolo}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Data de recebimento: ${agora}</div>
          </div>

          <div style="margin-bottom: 18px;">
            ${
              denuncia.identificado
                ? `<span class="badge badge-identificado">Manifestação Identificada</span>`
                : `<span class="badge badge-anonimo">Manifestação 100% Anônima</span>`
            }
          </div>

          <div class="field">
            <div class="field-label">Categoria da Ocorrência</div>
            <div class="field-val" style="font-weight: 600; color: #0f2744;">${denuncia.categoria}</div>
          </div>

          ${
            denuncia.unidade_ou_obra
              ? `<div class="field">
                   <div class="field-label">Unidade / Obra / Local</div>
                   <div class="field-val">${denuncia.unidade_ou_obra}</div>
                 </div>`
              : ''
          }

          ${
            denuncia.envolvidos
              ? `<div class="field">
                   <div class="field-label">Pessoas Envolvidas</div>
                   <div class="field-val">${denuncia.envolvidos}</div>
                 </div>`
              : ''
          }

          ${
            denuncia.testemunhas
              ? `<div class="field">
                   <div class="field-label">Possíveis Testemunhas</div>
                   <div class="field-val">${denuncia.testemunhas}</div>
                 </div>`
              : ''
          }

          ${
            denuncia.identificado
              ? `<div class="field" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px;">
                   <div class="field-label" style="color: #166534;">Dados do Manifestante (Confidenciais)</div>
                   <div style="font-size: 13px; color: #14532d; margin-top: 4px;">
                     <strong>Nome:</strong> ${denuncia.nome_identificado || 'Não informado'}<br>
                     <strong>Contato:</strong> ${denuncia.contato_identificado || 'Não informado'}
                   </div>
                 </div>`
              : ''
          }

          <div class="field">
            <div class="field-label">Relato Completo dos Fatos</div>
            <div class="relato-box">${denuncia.relato.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>

          ${
            denuncia.anexos && denuncia.anexos.length > 0
              ? `<div class="field">
                   <div class="field-label">Evidências e Anexos (${denuncia.anexos.length})</div>
                   <ul style="margin: 6px 0; padding-left: 20px; font-size: 13px;">
                     ${denuncia.anexos
                       .map(
                         (a, i) =>
                           `<li><a href="${a.url}" target="_blank" style="color: #0284c7; text-decoration: underline;">Anexo ${i + 1} (${a.nome || 'Ver Arquivo'})</a></li>`
                       )
                       .join('')}
                   </ul>
                 </div>`
              : ''
          }
        </div>
        <div class="footer">
          JLE Telecom &bull; Sistema de Governança e Integridade &bull; Notificação automática confidencial
        </div>
      </div>
    </body>
    </html>
  `;

  const url = 'https://api.resend.com/emails';
  console.log(`[EmailService] Disparando e-mail para: ${JSON.stringify(recipientsRaw)} de: ${DEFAULT_FROM}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: DEFAULT_FROM,
      to: recipientsRaw,
      reply_to: 'denuncia@jletelecom.com.br',
      subject,
      html,
      text: `NOVA MANIFESTAÇÃO REGISTRADA\nProtocolo: ${denuncia.protocolo}\nCategoria: ${denuncia.categoria}\nData: ${agora}\n\nRelato:\n${denuncia.relato}`,
      headers: {
        'X-Entity-Ref-ID': `denuncia-${denuncia.protocolo}`,
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('[EmailService] Erro retornado pela API do Resend:', data);
    throw new Error(data.message || 'Falha ao despachar e-mail via Resend');
  }

  console.log(`[EmailService] E-mail enviado com sucesso. Resend ID: ${data.id}`);
  return data;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Canal de Denúncias JLE Telecom' });
});

// POST /api/denuncias
app.post('/api/denuncias', upload.array('anexos', 5), async (req: Request, res: Response) => {
  try {
    const {
      categoria,
      unidade_ou_obra,
      relato,
      envolvidos,
      testemunhas,
      identificado,
      nome_identificado,
      contato_identificado,
    } = req.body;

    if (!categoria || !categoria.trim()) {
      return res.status(400).json({ error: 'A categoria da ocorrência é obrigatória.' });
    }

    if (!relato || relato.trim().length < 10) {
      return res.status(400).json({ error: 'O relato da ocorrência deve conter pelo menos 10 caracteres.' });
    }

    const isIdentificado = identificado === true || identificado === 'true';
    const protocolo = gerarProtocolo();

    // Processamento de anexos
    const anexosProcessados: Array<{ url: string; nome: string }> = [];
    const files = req.files as Express.Multer.File[] | undefined;

    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        try {
          const url = await uploadBufferToCloudinary(file.buffer, file.originalname);
          anexosProcessados.push({
            url,
            nome: file.originalname || 'arquivo',
          });
        } catch (uploadErr) {
          console.error('[Denuncias] Erro ao subir anexo:', uploadErr);
        }
      }
    }

    const dadosDenuncia = {
      protocolo,
      categoria: categoria.trim(),
      unidade_ou_obra: unidade_ou_obra ? String(unidade_ou_obra).trim() : null,
      relato: relato.trim(),
      envolvidos: envolvidos ? String(envolvidos).trim() : null,
      testemunhas: testemunhas ? String(testemunhas).trim() : null,
      identificado: isIdentificado,
      nome_identificado: isIdentificado && nome_identificado ? String(nome_identificado).trim() : null,
      contato_identificado: isIdentificado && contato_identificado ? String(contato_identificado).trim() : null,
      anexos: anexosProcessados,
      status: 'nova',
      created_at: new Date().toISOString(),
    };

    // 1. Gravação no Supabase (com proteção de fallback)
    try {
      const { error: dbError } = await supabase.from('denuncias').insert({
        protocolo: dadosDenuncia.protocolo,
        categoria: dadosDenuncia.categoria,
        unidade_ou_obra: dadosDenuncia.unidade_ou_obra,
        relato: dadosDenuncia.relato,
        envolvidos: dadosDenuncia.envolvidos,
        testemunhas: dadosDenuncia.testemunhas,
        identificado: dadosDenuncia.identificado,
        nome_identificado: dadosDenuncia.nome_identificado,
        contato_identificado: dadosDenuncia.contato_identificado,
        anexos: dadosDenuncia.anexos,
        status: dadosDenuncia.status,
        created_at: dadosDenuncia.created_at,
      });

      if (dbError) {
        console.warn('[Denuncias] Aviso: Supabase retorno erro:', dbError.message);
      }
    } catch (err: any) {
      console.warn('[Denuncias] Falha ao persistir no Supabase:', err?.message);
    }

    // 2. Disparo imediato do e-mail oficial
    try {
      console.log(`[Denuncias] Disparando notificação por e-mail para ${protocolo}...`);
      await notificarNovaDenuncia(dadosDenuncia);
      console.log(`[Denuncias] E-mail de ${protocolo} processado com sucesso!`);
    } catch (emailErr: any) {
      console.error('[Denuncias] Falha no disparo do e-mail:', emailErr);
    }

    // 3. Resposta ao usuário com o protocolo seguro
    return res.status(201).json({
      success: true,
      protocolo,
      message: 'Manifestação registrada com sucesso.',
    });
  } catch (error: any) {
    console.error('[Denuncias] Erro interno:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao processar a denúncia. Por favor, tente novamente.' });
  }
});

// GET /api/denuncias/consulta/:protocolo
app.get('/api/denuncias/consulta/:protocolo', async (req: Request, res: Response) => {
  try {
    const { protocolo } = req.params;
    if (!protocolo) {
      return res.status(400).json({ error: 'Protocolo é obrigatório.' });
    }

    const { data, error } = await supabase
      .from('denuncias')
      .select('protocolo, status, created_at, categoria')
      .eq('protocolo', protocolo.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Protocolo não localizado no sistema.' });
    }

    return res.json({
      protocolo: data.protocolo,
      status: data.status,
      categoria: data.categoria,
      created_at: data.created_at,
    });
  } catch (err: any) {
    console.error('[Consulta] Erro ao buscar protocolo:', err);
    return res.status(500).json({ error: 'Erro ao consultar protocolo.' });
  }
});

export default app;
