/**
 * Regras de tamanho para upload de imagens (mídia e notícias).
 * Limites conservadores para evitar timeout e loading infinito.
 */

/** Tamanho máximo do arquivo em bytes (5 MB) — adequado para flyers */
export const NEWS_IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Maior lado da imagem em pixels (será redimensionada se maior) */
export const NEWS_IMAGE_MAX_DIMENSION_PX = 1200

/** Regra para exibição na tela de notícias */
export const NEWS_IMAGE_RULE_LABEL =
  'Máx. 1200 px no maior lado e 5 MB. Use JPG ou PNG. Imagens maiores serão recusadas.'

/** Tamanho máximo para mídia geral em bytes (3 MB) */
export const MEDIA_IMAGE_MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024

/** Maior lado para mídia geral em pixels */
export const MEDIA_IMAGE_MAX_DIMENSION_PX = 1920

/** Regra para exibição na galeria de mídia */
export const MEDIA_IMAGE_RULE_LABEL =
  'Até 1920 px no maior lado, no máx. 3 MB. Formatos: JPG, PNG, WebP.'
