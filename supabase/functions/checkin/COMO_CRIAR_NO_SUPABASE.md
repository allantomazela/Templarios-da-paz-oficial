# Como criar a Edge Function "checkin" no Supabase (pelo Dashboard)

Siga estes passos para publicar a função de check-in por QR **sem usar o terminal**.

---

## Passo 1: Abrir o Dashboard

1. Acesse: **https://app.supabase.com**
2. Entre na sua conta e abra o projeto **Templários da Paz** (ou o projeto que usa a URL `hxncevpbwcearzxrstzj.supabase.co`).

---

## Passo 2: Ir em Edge Functions

1. No **menu da esquerda**, clique em **Edge Functions**.
2. Clique no botão **"Deploy a new function"** (ou "Implantar nova função").
3. Escolha **"Via Editor"** (criar pelo editor no navegador).

---

## Passo 3: Nome e código da função

1. **Nome da função:** use exatamente: **`checkin`**  
   (Se o Dashboard pedir um nome ao criar, digite `checkin`.)

2. **Apague todo o código** que vier no editor (template Hello World ou em branco).

3. **Copie todo o código** do arquivo **`index.ts`** que está na mesma pasta deste guia:
   - Caminho no projeto: `supabase/functions/checkin/index.ts`
   - Ou copie o conteúdo que está na seção **Código completo** mais abaixo.

4. **Cole** no editor do Dashboard (substituindo qualquer coisa que estiver lá).

---

## Passo 4: Fazer o deploy

1. Clique no botão **"Deploy function"** (ou "Implantar função") **no final da página**.
2. Aguarde a mensagem de sucesso (geralmente 10–30 segundos).

Pronto. A função ficará disponível em:

```text
https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/checkin
```

(O seu projeto já usa essa URL no front; não precisa mudar nada no código.)

---

## Variáveis de ambiente (já configuradas)

O Supabase **já define** estas variáveis para todas as Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Você não precisa configurar nada.** Só criar a função com o nome `checkin` e colar o código.

---

## Como testar depois do deploy

1. Na página da função **checkin**, use a aba **"Test"** / **"Testar"**.
2. Método: **POST**.
3. Body (JSON), por exemplo:
   ```json
   {
     "sessionRecordId": "um-uuid-valido-de-uma-sessao-que-existe-no-banco"
   }
   ```
4. Em **Authorization**, use um token de usuário logado (Bearer token do seu app).
5. Clique em **Send Request** e confira a resposta.

---

## Resumo

| O quê              | Onde / Como |
|--------------------|-------------|
| Dashboard          | https://app.supabase.com → seu projeto |
| Criar função       | Edge Functions → Deploy new function → Via Editor |
| Nome da função     | `checkin` |
| Código             | Copiar de `supabase/functions/checkin/index.ts` (ou do bloco abaixo) |
| Deploy             | Botão "Deploy function" no final da página |
| URL final          | `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/checkin` |

Se algo der erro (por exemplo "Sessão não encontrada"), confira se você já rodou o SQL das tabelas (`RODAR_CHECKIN_QR.sql`) e se o `sessionRecordId` existe na tabela `session_records`.
