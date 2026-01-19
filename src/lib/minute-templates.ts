export interface MinuteTemplate {
  id: string
  name: string
  description: string
  content: string
}

export const minuteTemplates: MinuteTemplate[] = [
  {
    id: 'sessao-ordinaria',
    name: 'Sessão Ordinária Completa',
    description: 'Template completo para sessões ordinárias com todos os itens',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO ORDINÁRIA</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Ano Maçônico:</strong> [ANO]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão Ordinária pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  Após a abertura dos trabalhos, foi verificada a regularidade da Loja e lida a 
  ata da sessão anterior, que foi aprovada por unanimidade.
</p>

<h2>2. ORDEM DO DIA</h2>
<p>
  <strong>2.1.</strong> Leitura e aprovação da ata da sessão anterior;<br/>
  <strong>2.2.</strong> [PRIMEIRO PONTO DA ORDEM DO DIA];<br/>
  <strong>2.3.</strong> [SEGUNDO PONTO DA ORDEM DO DIA];<br/>
  <strong>2.4.</strong> [TERCEIRO PONTO DA ORDEM DO DIA];<br/>
  <strong>2.5.</strong> Assuntos gerais.
</p>

<h2>3. DELIBERAÇÕES</h2>
<p>
  <strong>3.1.</strong> [PRIMEIRA DELIBERAÇÃO]<br/>
  Após discussão, foi deliberado por [UNANIMIDADE/MAIORIA] que [DECISÃO TOMADA].
</p>
<p>
  <strong>3.2.</strong> [SEGUNDA DELIBERAÇÃO]<br/>
  [DESCREVER A DELIBERAÇÃO E DECISÃO]
</p>

<h2>4. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR], que será destinado a [FINALIDADE].
</p>

<h2>5. COMUNICAÇÕES</h2>
<p>
  <strong>5.1.</strong> [COMUNICAÇÃO 1]<br/>
  <strong>5.2.</strong> [COMUNICAÇÃO 2]
</p>

<h2>6. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de [GRAU].
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
  {
    id: 'iniciacao',
    name: 'Sessão de Iniciação',
    description: 'Template completo para iniciação de novos irmãos',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO DE INICIAÇÃO</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Ano Maçônico:</strong> [ANO]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão de Iniciação pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  Após a abertura dos trabalhos, foi verificada a regularidade da Loja e lida a 
  ata da sessão anterior, que foi aprovada por unanimidade.
</p>

<h2>2. PROCESSO DE INICIAÇÃO</h2>
<p>
  <strong>2.1. Apresentação do Candidato</strong><br/>
  Foi apresentado à Loja o candidato <strong>[NOME DO CANDIDATO]</strong>, 
  filho de [NOME DO PAI] e [NOME DA MÃE], natural de [CIDADE/ESTADO], 
  solteiro/casado, [PROFISSÃO], portador do CPF [CPF], residente em [ENDEREÇO].
</p>
<p>
  <strong>2.2. Votação</strong><br/>
  Após a apresentação, foi realizada a votação secreta, obtendo o candidato 
  [NÚMERO] votos favoráveis e [NÚMERO] votos contrários, sendo aprovado por 
  [UNANIMIDADE/MAIORIA].
</p>
<p>
  <strong>2.3. Cerimônia de Iniciação</strong><br/>
  Foi iniciado no Grau de Aprendiz o Irmão <strong>[NOME DO INICIADO]</strong>, 
  sob o número [NÚMERO], após a realização da cerimônia de iniciação, que foi 
  conduzida pelo Venerável Mestre [NOME DO VM], com a assistência dos demais 
  Oficiais da Loja.
</p>
<p>
  Durante a cerimônia, foram ministradas as instruções iniciais e entregues os 
  símbolos e ferramentas do Grau de Aprendiz.
</p>

<h2>3. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR].
</p>

<h2>4. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de Aprendiz.
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
  {
    id: 'elevacao',
    name: 'Sessão de Elevação',
    description: 'Template completo para elevação ao grau de Companheiro',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO DE ELEVAÇÃO</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Ano Maçônico:</strong> [ANO]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão de Elevação pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  Após a abertura dos trabalhos, foi verificada a regularidade da Loja e lida a 
  ata da sessão anterior, que foi aprovada por unanimidade.
</p>

<h2>2. PROCESSO DE ELEVAÇÃO</h2>
<p>
  <strong>2.1. Apresentação do Candidato</strong><br/>
  Foi apresentado à Loja o Irmão Aprendiz <strong>[NOME DO ELEVADO]</strong>, 
  iniciado em [DATA DE INICIAÇÃO], para elevação ao Grau de Companheiro.
</p>
<p>
  <strong>2.2. Verificação de Estudos</strong><br/>
  Foi verificada a frequência e os estudos do Irmão Aprendiz, constatando-se que 
  o mesmo cumpriu todos os requisitos necessários para a elevação, tendo 
  frequentado [NÚMERO] sessões e apresentado os trabalhos exigidos.
</p>
<p>
  <strong>2.3. Votação</strong><br/>
  Após a apresentação e verificação, foi realizada a votação secreta, obtendo o 
  candidato [NÚMERO] votos favoráveis e [NÚMERO] votos contrários, sendo aprovado 
  por [UNANIMIDADE/MAIORIA].
</p>
<p>
  <strong>2.4. Cerimônia de Elevação</strong><br/>
  Foi elevado ao Grau de Companheiro o Irmão <strong>[NOME DO ELEVADO]</strong>, 
  após a realização da cerimônia de elevação, que foi conduzida pelo Venerável 
  Mestre [NOME DO VM], com a assistência dos demais Oficiais da Loja.
</p>
<p>
  Durante a cerimônia, foram ministradas as instruções do Grau de Companheiro e 
  entregues os símbolos e ferramentas correspondentes.
</p>

<h2>3. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR].
</p>

<h2>4. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de Companheiro.
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
  {
    id: 'exaltacao',
    name: 'Sessão de Exaltação',
    description: 'Template completo para exaltação ao grau de Mestre',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO DE EXALTAÇÃO</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Ano Maçônico:</strong> [ANO]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão de Exaltação pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  Após a abertura dos trabalhos, foi verificada a regularidade da Loja e lida a 
  ata da sessão anterior, que foi aprovada por unanimidade.
</p>

<h2>2. PROCESSO DE EXALTAÇÃO</h2>
<p>
  <strong>2.1. Apresentação do Candidato</strong><br/>
  Foi apresentado à Loja o Irmão Companheiro <strong>[NOME DO EXALTADO]</strong>, 
  iniciado em [DATA DE INICIAÇÃO] e elevado em [DATA DE ELEVAÇÃO], para exaltação 
  ao Grau de Mestre.
</p>
<p>
  <strong>2.2. Verificação de Estudos</strong><br/>
  Foi verificada a frequência e os estudos do Irmão Companheiro, constatando-se que 
  o mesmo cumpriu todos os requisitos necessários para a exaltação, tendo 
  frequentado [NÚMERO] sessões e apresentado os trabalhos exigidos nos graus anteriores.
</p>
<p>
  <strong>2.3. Votação</strong><br/>
  Após a apresentação e verificação, foi realizada a votação secreta, obtendo o 
  candidato [NÚMERO] votos favoráveis e [NÚMERO] votos contrários, sendo aprovado 
  por [UNANIMIDADE/MAIORIA].
</p>
<p>
  <strong>2.4. Cerimônia de Exaltação</strong><br/>
  Foi exaltado ao Grau de Mestre o Irmão <strong>[NOME DO EXALTADO]</strong>, 
  após a realização da cerimônia de exaltação, que foi conduzida pelo Venerável 
  Mestre [NOME DO VM], com a assistência dos demais Oficiais da Loja.
</p>
<p>
  Durante a cerimônia, foram ministradas as instruções do Grau de Mestre e 
  entregues os símbolos e ferramentas correspondentes.
</p>

<h2>3. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR].
</p>

<h2>4. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de Mestre.
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
  {
    id: 'instalacao',
    name: 'Sessão de Instalação',
    description: 'Template para sessão de instalação de novos oficiais',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO DE INSTALAÇÃO</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Ano Maçônico:</strong> [ANO]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão de Instalação pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  Após a abertura dos trabalhos, foi verificada a regularidade da Loja e lida a 
  ata da sessão anterior, que foi aprovada por unanimidade.
</p>

<h2>2. INSTALAÇÃO DOS OFICIAIS</h2>
<p>
  <strong>2.1. Instalação do Venerável Mestre</strong><br/>
  Foi instalado no cargo de Venerável Mestre o Irmão <strong>[NOME DO VM]</strong>, 
  após aprovação unânime da Loja.
</p>
<p>
  <strong>2.2. Instalação dos Demais Oficiais</strong><br/>
  Foram instalados nos respectivos cargos os seguintes Irmãos:
</p>
<ul>
  <li><strong>1º Vigilante:</strong> [NOME DO 1º VIGILANTE]</li>
  <li><strong>2º Vigilante:</strong> [NOME DO 2º VIGILANTE]</li>
  <li><strong>Secretário:</strong> [NOME DO SECRETÁRIO]</li>
  <li><strong>Tesoureiro:</strong> [NOME DO TESOUREIRO]</li>
  <li><strong>Orador:</strong> [NOME DO ORADOR]</li>
  <li><strong>Chanceler:</strong> [NOME DO CHANCELER]</li>
  <li><strong>Mestre de Cerimônias:</strong> [NOME DO MC]</li>
  <li><strong>Hospitaleiro:</strong> [NOME DO HOSPITALEIRO]</li>
  <li><strong>Porta-Estandarte:</strong> [NOME DO PORTA-ESTANDARTE]</li>
  <li><strong>1º Diácono:</strong> [NOME DO 1º DIÁCONO]</li>
  <li><strong>2º Diácono:</strong> [NOME DO 2º DIÁCONO]</li>
  <li><strong>Cobridor Externo:</strong> [NOME DO COBRIDOR EXTERNO]</li>
  <li><strong>Cobridor Interno:</strong> [NOME DO COBRIDOR INTERNO]</li>
</ul>
<p>
  Todos os oficiais foram instalados após aprovação unânime da Loja e prestaram 
  o compromisso de bem desempenhar suas funções.
</p>

<h2>3. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR].
</p>

<h2>4. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de Mestre.
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
  {
    id: 'sessao-extraordinaria',
    name: 'Sessão Extraordinária',
    description: 'Template completo para sessões extraordinárias',
    content: `<h1 style="text-align: center; font-weight: bold; margin-bottom: 1rem;">ATA DA SESSÃO EXTRAORDINÁRIA</h1>
      
<p style="text-align: center; margin-bottom: 2rem;">
  <strong>Nº [NÚMERO DA SESSÃO]</strong><br/>
  <strong>Data:</strong> [DATA DA SESSÃO]<br/>
  <strong>Finalidade:</strong> [MOTIVO DA SESSÃO EXTRAORDINÁRIA]
</p>

<h2>1. ABERTURA DOS TRABALHOS</h2>
<p>
  Às [HORA] horas do dia [DATA], na sede da Augusta e Respeitável Loja Simbólica 
  <strong>Templários da Paz</strong>, sob os auspícios do Grande Oriente do Brasil, 
  foi aberta a Sessão Extraordinária pelo Venerável Mestre [NOME DO VM], 
  com a presença de [NÚMERO] Irmãos, sendo [NÚMERO] Mestres, [NÚMERO] Companheiros 
  e [NÚMERO] Aprendizes.
</p>
<p>
  A sessão foi convocada com a finalidade de tratar sobre: [MOTIVO DA CONVOCAÇÃO].
</p>

<h2>2. ASSUNTO PRINCIPAL</h2>
<p>
  <strong>2.1. Apresentação do Assunto</strong><br/>
  [DESCREVER O ASSUNTO PRINCIPAL DA SESSÃO EXTRAORDINÁRIA]
</p>
<p>
  <strong>2.2. Discussão</strong><br/>
  [DESCREVER A DISCUSSÃO REALIZADA]
</p>

<h2>3. DELIBERAÇÕES</h2>
<p>
  Após ampla discussão, foi deliberado por [UNANIMIDADE/MAIORIA] que:
</p>
<ul>
  <li>[PRIMEIRA DECISÃO]</li>
  <li>[SEGUNDA DECISÃO]</li>
  <li>[TERCEIRA DECISÃO]</li>
</ul>

<h2>4. TRONCO DE BENEFICÊNCIA</h2>
<p>
  Foi realizada a coleta do Tronco de Beneficência, arrecadando o valor de 
  R$ [VALOR].
</p>

<h2>5. ENCERRAMENTO</h2>
<p>
  Nada mais havendo a tratar, foram encerrados os trabalhos às [HORA] horas, 
  com a presença de [NÚMERO] Irmãos.
</p>
<p>
  A Loja foi fechada em paz e harmonia, sendo os trabalhos encerrados com 
  a bateria de Mestre.
</p>

<p style="text-align: center; margin-top: 3rem;">
  <strong>[CIDADE], [DATA COMPLETA]</strong>
</p>

<div style="display: flex; justify-content: space-between; margin-top: 4rem;">
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Venerável Mestre</strong></p>
    <p>[NOME DO VM]</p>
  </div>
  <div style="text-align: center; flex: 1;">
    <p>_________________________</p>
    <p><strong>Secretário</strong></p>
    <p>[NOME DO SECRETÁRIO]</p>
  </div>
</div>`,
  },
]
