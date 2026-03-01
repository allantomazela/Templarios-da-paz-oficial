# Troubleshooting do deploy (GitHub Actions → SSH)

## Erro: `kex_exchange_identification: read: Connection reset by peer` / `Connection reset by *** port 22`

Significa que o **servidor** está encerrando ou recusando a conexão SSH na porta 22. O workflow já faz **3 tentativas** com intervalo de 10s; se ainda falhar, verifique no servidor:

### 1. Firewall (UFW, iptables, cloud security groups)

- A porta **22 (SSH)** precisa aceitar conexões **de qualquer IP** (ou dos IPs do GitHub).
- GitHub Actions usa IPs variados. Para liberar apenas os IPs deles:
  - [Meta da API do GitHub](https://api.github.com/meta) lista ranges (ex.: `actions`).
  - Ou use um **self-hosted runner** na sua rede, assim o SSH sai do seu próprio IP.

### 2. Fail2ban ou similar

- Se o servidor usa fail2ban (ou equivalente), muitas tentativas de login podem **bloquear o IP** do runner.
- Desbloqueie o IP ou crie exceção para a porta 22 em IPs conhecidos do GitHub, ou temporariamente desative para testar.

### 3. Limite de conexões SSH (sshd)

- No servidor: `MaxStartups` e `MaxSessions` em `/etc/ssh/sshd_config`.
- Valores muito baixos podem fazer o servidor recusar novas conexões.

### 4. Testar SSH manualmente

No seu PC (ou de outro IP):

```bash
ssh -i caminho/para/chave usuario@SEU_HOST "echo ok"
```

Se funcionar da sua rede mas o GitHub Actions falhar, a causa provável é **firewall/restrição por IP** no servidor.

### 5. Alternativas se o servidor não puder liberar IPs do GitHub

- **Self-hosted runner**: instalar um runner do GitHub Actions na sua rede e usar `runs-on: [self-hosted]` no job de deploy; o SSH sai do IP do seu servidor/rede.
- **Deploy por webhook**: no servidor, um script que escuta um webhook (do GitHub ou de um CI) e faz `git pull` + build no próprio servidor (não precisa de SSH do GitHub para dentro do servidor).
