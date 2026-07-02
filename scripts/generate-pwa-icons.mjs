/**
 * Gera ícones PWA (192, 512, 48) a partir do logo da loja.
 *
 * Ordem da fonte:
 * 1. --source=<caminho ou URL>
 * 2. site_settings.logo_url (Supabase, via VITE_SUPABASE_*)
 * 3. site_settings.favicon_url
 * 4. public/logo-loja-default.png
 *
 * Uso: npm run generate:pwa-icons
 *      node scripts/generate-pwa-icons.mjs --source=./public/logo-loja-default.png
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const DEFAULT_SOURCE = path.join(PUBLIC_DIR, 'logo-loja-default.png')

/** background_color do manifest.webmanifest */
const BACKGROUND = { r: 26, g: 32, b: 44, alpha: 1 }

const SIZES = [
  { size: 48, filename: 'favicon.png' },
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
]

function parseArgs(argv) {
  let source = null
  for (const arg of argv) {
    if (arg.startsWith('--source=')) {
      source = arg.slice('--source='.length).trim()
    }
  }
  return { source }
}

function readEnvFile() {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return {}
  const out = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function getSupabaseConfig() {
  const fileEnv = readEnvFile()
  const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    fileEnv.VITE_SUPABASE_ANON_KEY
  return { url, key }
}

async function fetchSiteBrandUrls() {
  const { url, key } = getSupabaseConfig()
  if (!url || !key) return { logoUrl: null, faviconUrl: null }

  try {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/site_settings?id=eq.1&select=logo_url,favicon_url`
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    if (!res.ok) return { logoUrl: null, faviconUrl: null }
    const rows = await res.json()
    const row = Array.isArray(rows) ? rows[0] : null
    return {
      logoUrl: row?.logo_url?.trim() || null,
      faviconUrl: row?.favicon_url?.trim() || null,
    }
  } catch {
    return { logoUrl: null, faviconUrl: null }
  }
}

async function loadImageBuffer(sourceHint) {
  if (sourceHint) {
    if (/^https?:\/\//i.test(sourceHint)) {
      const res = await fetch(sourceHint)
      if (!res.ok) {
        throw new Error(`Não foi possível baixar a imagem: ${sourceHint}`)
      }
      return Buffer.from(await res.arrayBuffer())
    }
    const filePath = path.isAbsolute(sourceHint)
      ? sourceHint
      : path.resolve(ROOT, sourceHint)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de origem não encontrado: ${filePath}`)
    }
    return fs.readFileSync(filePath)
  }

  const { logoUrl, faviconUrl } = await fetchSiteBrandUrls()
  const remoteUrl = logoUrl || faviconUrl
  if (remoteUrl) {
    console.log(`Fonte: logo configurado em site_settings (${remoteUrl})`)
    const res = await fetch(remoteUrl)
    if (!res.ok) {
      throw new Error(`Falha ao baixar logo do site: ${res.status}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  if (!fs.existsSync(DEFAULT_SOURCE)) {
    throw new Error(
      `Nenhum logo remoto e arquivo padrão ausente: ${DEFAULT_SOURCE}`,
    )
  }
  console.log(`Fonte: ${path.relative(ROOT, DEFAULT_SOURCE)}`)
  return fs.readFileSync(DEFAULT_SOURCE)
}

async function renderSquareIcon(sourceBuffer, size) {
  const inner = Math.round(size * 0.8)
  const logoBuffer = await sharp(sourceBuffer)
    .resize(inner, inner, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()

  const meta = await sharp(logoBuffer).metadata()
  const width = meta.width ?? inner
  const height = meta.height ?? inner
  const left = Math.max(0, Math.round((size - width) / 2))
  const top = Math.max(0, Math.round((size - height) / 2))

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function main() {
  const { source } = parseArgs(process.argv.slice(2))
  const sourceBuffer = await loadImageBuffer(source)

  for (const { size, filename } of SIZES) {
    const outPath = path.join(PUBLIC_DIR, filename)
    const png = await renderSquareIcon(sourceBuffer, size)
    fs.writeFileSync(outPath, png)
    console.log(`Gerado ${filename} (${size}x${size})`)
  }

  console.log('Ícones PWA atualizados em public/')
}

main().catch((err) => {
  console.error('generate-pwa-icons:', err instanceof Error ? err.message : err)
  process.exit(1)
})
