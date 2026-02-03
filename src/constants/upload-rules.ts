/**
 * Regras de tamanho para upload de imagens (mídia e notícias).
 * Usado para validação e exibição na UI.
 */

/** Tamanho máximo do arquivo em bytes (2 MB) */
export const NEWS_IMAGE_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

/** Maior lado da imagem em pixels (será redimensionada se maior) */
export const NEWS_IMAGE_MAX_DIMENSION_PX = 1280

/** Regra para exibição na tela de notícias */
export const NEWS_IMAGE_RULE_LABEL =
  'Até 1280 px no maior lado, no máx. 2 MB. Formatos: JPG, PNG, WebP.'

/** Tamanho máximo para mídia geral em bytes (3 MB) */
export const MEDIA_IMAGE_MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024

/** Maior lado para mídia geral em pixels */
export const MEDIA_IMAGE_MAX_DIMENSION_PX = 1920

/** Regra para exibição na galeria de mídia */
export const MEDIA_IMAGE_RULE_LABEL =
  'Até 1920 px no maior lado, no máx. 3 MB. Formatos: JPG, PNG, WebP.'
