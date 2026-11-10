import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { createPreInitiationUserAsAdmin } from '@/lib/admin-user-api'
import { Loader2, Copy, Check } from 'lucide-react'

interface CreatePreInitiationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export function CreatePreInitiationDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePreInitiationDialogProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState(() => generateTemporaryPassword())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdSummary, setCreatedSummary] = useState<{
    fullName: string
    email: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setPassword(generateTemporaryPassword())
    setError(null)
    setCreatedSummary(null)
    setCopied(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (busy) return
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleCreate = async () => {
    setError(null)
    if (fullName.trim().length < 3) {
      setError('Informe o nome completo.')
      return
    }
    if (!email.trim().includes('@')) {
      setError('Informe um e-mail válido.')
      return
    }
    if (password.length < 8) {
      setError('A senha temporária deve ter no mínimo 8 caracteres.')
      return
    }
    setBusy(true)
    try {
      const result = await createPreInitiationUserAsAdmin({
        fullName,
        email,
        password,
        phone: phone || undefined,
      })
      setCreatedSummary({
        fullName: result.fullName,
        email: result.email,
        password,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar.')
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    if (!createdSummary) return
    const text = [
      `Nome: ${createdSummary.fullName}`,
      `E-mail: ${createdSummary.email}`,
      `Senha temporária: ${createdSummary.password}`,
      '',
      'Acesso só ao perfil até a iniciação. Troque a senha no primeiro acesso.',
    ].join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar iniciando (pré-iniciação)</DialogTitle>
          <DialogDescription>
            Cria a conta já liberada só para o perfil, fora do quadro e sem
            mensalidade. A senha temporária fica com você para entregar depois.
          </DialogDescription>
        </DialogHeader>

        {createdSummary ? (
          <div className="space-y-3 text-sm">
            <p className="rounded-md border bg-muted/40 p-3">
              Conta criada. Guarde a senha agora — ela não será mostrada de novo.
            </p>
            <div className="space-y-1 font-mono text-xs">
              <div>Nome: {createdSummary.fullName}</div>
              <div>E-mail: {createdSummary.email}</div>
              <div>Senha: {createdSummary.password}</div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" /> Copiar dados
                  </>
                )}
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pre-init-name">Nome completo</Label>
              <Input
                id="pre-init-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-init-email">E-mail</Label>
              <Input
                id="pre-init-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-init-phone">Telefone (opcional)</Label>
              <Input
                id="pre-init-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-init-password">Senha temporária</Label>
              <PasswordInput
                id="pre-init-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => setPassword(generateTemporaryPassword())}
              >
                Gerar outra senha
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={busy} onClick={() => void handleCreate()}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
