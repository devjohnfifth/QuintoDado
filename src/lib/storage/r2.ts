import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Arquivos de suplemento no Cloudflare R2 (bucket privado). Nada aqui é
 * público: o download sai sempre por URL assinada gerada depois de conferir
 * login e RLS, e o upload por URL assinada gerada só pro admin.
 */

/**
 * 15 min e não as 24 h da §10.5: o link é gerado a cada clique e a pessoa é
 * redirecionada na hora. Com 24 h, um link copiado deixaria baixar sem conta.
 */
const VALIDADE_DOWNLOAD_S = 15 * 60;
const VALIDADE_UPLOAD_S = 30 * 60;

let cliente: S3Client | null = null;

function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("R2 não configurado: faltam variáveis R2_* no ambiente.");
  }
  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, bucket: R2_BUCKET_NAME };
}

function s3() {
  if (!cliente) {
    const c = config();
    cliente = new S3Client({
      region: "auto",
      endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: c.R2_ACCESS_KEY_ID, secretAccessKey: c.R2_SECRET_ACCESS_KEY },
    });
  }
  return cliente;
}

export function r2Configurado() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

/**
 * URL pra o navegador enviar o arquivo direto pro R2. O `Content-Type`
 * entra na assinatura, então o upload tem que mandar exatamente o mesmo header.
 */
export async function urlUploadAssinada(chave: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: config().bucket, Key: chave, ContentType: contentType }), {
    expiresIn: VALIDADE_UPLOAD_S,
  });
}

/**
 * `filename` só aceita ASCII com segurança; `filename*` (RFC 5987) leva o nome
 * com acento e os navegadores modernos preferem ele. Os dois juntos cobrem tudo.
 */
function contentDisposition(nomeArquivo: string) {
  const limpo = nomeArquivo.replace(/["\\\r\n]/g, "").trim() || "arquivo";
  const ascii = limpo.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "_");
  const rfc5987 = encodeURIComponent(limpo).replace(/['()*!]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${rfc5987}`;
}

export async function urlDownloadAssinada(chave: string, nomeArquivo: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: config().bucket,
      Key: chave,
      ResponseContentDisposition: contentDisposition(nomeArquivo),
    }),
    { expiresIn: VALIDADE_DOWNLOAD_S },
  );
}

/** Tamanho em bytes se o objeto existe; null se não existe. Outros erros sobem. */
export async function tamanhoDoObjeto(chave: string): Promise<number | null> {
  try {
    const resposta = await s3().send(new HeadObjectCommand({ Bucket: config().bucket, Key: chave }));
    return resposta.ContentLength ?? 0;
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw e;
  }
}

export async function apagarObjeto(chave: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: config().bucket, Key: chave }));
}
