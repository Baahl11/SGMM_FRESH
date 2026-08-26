// Escaneo homegrown de secretos (Recepción IA Fase 0, 2026-08-24).
// No usa un binario externo (gitleaks/truffleHog) a propósito: instalar un
// binario en npm ci ya rompió CI en redes restringidas (ver OD-1 en
// .github/workflows/ci.yml para el CLI de supabase). Este script cubre los
// patrones de alta confianza relevantes para este repo; no reemplaza una
// auditoría de secretos completa.

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const SECRET_PATTERNS = [
  { name: 'Twilio Account SID', regex: /\bAC[0-9a-fA-F]{32}\b/g },
  { name: 'Twilio Messaging Service SID', regex: /\bMG[0-9a-fA-F]{32}\b/g },
  { name: 'Stripe live secret key', regex: /\bsk_live_[0-9a-zA-Z]{16,}\b/g },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: 'PEM private key', regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
]

const ALLOWLIST_SUBSTRINGS = [
  'sk_test_dummy',
  'whsec_dummy',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
]

export function scanContent(content) {
  const hits = []
  for (const { name, regex } of SECRET_PATTERNS) {
    const matches = content.match(regex) || []
    for (const match of matches) {
      if (ALLOWLIST_SUBSTRINGS.some((safe) => match.includes(safe))) continue
      hits.push({ name, match })
    }
  }
  return hits
}

const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|ico|svg|woff2?|ttf|eot|pdf|zip|lock)$/i

function listTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out.split('\n').filter(Boolean)
}

function main() {
  const files = listTrackedFiles()
  const findings = []
  for (const file of files) {
    if (SKIP_EXTENSIONS.test(file)) continue
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const hit of scanContent(content)) {
      findings.push({ file, ...hit })
    }
  }

  if (findings.length > 0) {
    console.error('secret-scan: posibles credenciales encontradas:')
    for (const f of findings) {
      console.error(`  ${f.file}: ${f.name} (${f.match.slice(0, 6)}...)`)
    }
    process.exitCode = 1
    return
  }

  console.log(`secret-scan: OK (${files.length} archivos revisados, 0 hallazgos).`)
}

// `file://${process.argv[1]}` (la comparación original) no detecta la
// invocación CLI en Windows: ahí process.argv[1] es una ruta relativa con
// backslashes, nunca igual a import.meta.url. pathToFileURL normaliza ambos
// casos (POSIX y Windows, relativo y absoluto) de forma consistente.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
