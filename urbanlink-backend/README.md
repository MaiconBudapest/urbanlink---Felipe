# Backend UrbanLink

API REST em Node.js, Express e MySQL para as telas da UrbanLink. A arquitetura aproveita os padrões apresentados nos módulos: camadas, modelos relacionais, autenticação, perfis, validação, paginação, histórico de eventos e testes. O exemplo de biblioteca/estoque dos módulos foi adaptado ao domínio de envios, entregadores e pontos de entrega.

## Requisitos

- Node.js 20 ou superior
- MySQL 8 ou compatível e uma conta dedicada para a aplicação

## Preparar o ambiente

1. Abra esta pasta no terminal e instale as dependências:

   ```powershell
   npm install
   ```

2. Copie `.env.example` para `.env` e configure o MySQL. Gere chaves próprias com `npm run secrets:generate` e substitua `JWT_SECRET` e `PII_ENCRYPTION_KEY` no `.env`. Não use os exemplos ou as chaves de teste em produção e não compartilhe o `.env`.

3. Com uma conta administrativa do MySQL, crie o banco e uma conta dedicada com privilégios apenas nesse banco. A conta de aplicação precisa poder criar e alterar tabelas para executar as migrações:

   ```sql
   CREATE DATABASE urbanlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'urbanlink_app'@'localhost' IDENTIFIED BY 'substitua-por-uma-senha-forte';
   GRANT ALL PRIVILEGES ON urbanlink.* TO 'urbanlink_app'@'localhost';
   ```

   Preencha `DB_USER` e `DB_PASSWORD` com esses dados. Se sua conta de aplicação tiver também privilégio de criação de banco, `npm run db:create` pode criar o banco; caso contrário, pule esse comando porque o banco já foi criado pelo administrador.

4. Aplique as migrações e insira tarifas demonstrativas:

   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

5. Inicie a API:

   ```powershell
   npm run dev
   ```

A API fica em `http://localhost:3000`, a documentação interativa em `/api/docs`, e os checks de disponibilidade em `/api/health/live` e `/api/health/ready`. Se `urbanlink-site` estiver ao lado desta pasta, o servidor também publica seus arquivos estáticos na raiz. As páginas atuais continuam demonstrativas e ainda não enviam os formulários à API.

## Primeiro administrador

Contas públicas sempre recebem o perfil `cliente`. Crie o primeiro administrador apenas pelo comando local, depois de configurar `.env` e aplicar as migrações. No PowerShell, defina os dados na sessão atual e execute:

```powershell
$env:ADMIN_NAME = 'Administradora UrbanLink'
$env:ADMIN_EMAIL = 'admin@exemplo.com'
$env:ADMIN_PASSWORD = 'substitua-por-uma-senha-forte-de-12-caracteres'
npm run admin:create
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Não coloque a senha na linha de comando nem em arquivos versionados. Para criar outras contas, use a tela administrativa depois de entrar.

## Arquitetura

```text
src/
  config/       validação de ambiente e conexão Sequelize
  controllers/  tradução HTTP e respostas
  middleware/   autenticação, perfis, validação, limites e erros
  models/       entidades e relacionamentos Sequelize
  routes/       rotas REST e aplicação de permissões
  services/     regras de negócio e transações
  utils/        paginação, serialização, códigos e proteção de dados
  validators/   esquemas de entrada Zod
migrations/     estrutura do banco
seeders/        tarifas iniciais sinalizadas como demonstração
test/           testes unitários e de integração HTTP sem banco
```

## Rotas principais

Todas as rotas também estão disponíveis nos caminhos abaixo de `/api`. A autenticação usa `Authorization: Bearer <token>`.

| Área | Operações |
|---|---|
| Acesso | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Contas | `POST /usuarios`, `GET/PATCH /usuarios/me`; administração: `GET /usuarios`, `PATCH/DELETE /usuarios/:id` |
| Cotações | `POST /cotacoes`; tarifas públicas `GET /tarifas` |
| Envios | `POST /envios`, `GET /envios/me`, `GET /envios/:id`, `PATCH /envios/:id/cancelar` |
| Entregadores | `GET /entregas/me` lista os envios atribuídos ao entregador autenticado |
| Operação | `GET /envios`, `PATCH /envios/:id/situacao`, `PATCH /envios/:id/entregador` |
| Rastreio | `GET /rastreio/:codigo` retorna somente eventos públicos e não revela endereços |
| Parcerias | `POST /parcerias/entregadores`, `POST /parcerias/pontos-de-entrega`; análise em `/admin/parcerias` |
| Contato | `POST /contato`; análise em `/admin/contatos` |
| Administração | `/admin/tarifas` permite consultar, atualizar e desativar tarifas |

As listas aceitam `pagina`, `limite` (máximo 100), `busca`, `status` e `tipo`. Algumas ações exigem perfil `administrador`, `operador` ou `entregador`; os serviços também verificam propriedade do envio e transições de situação.

## Cotações e adaptação do formulário

O cálculo usado pelas tarifas é: valor base + peso total × preço por kg + pacotes adicionais × preço por pacote. As duas tarifas inseridas pelo seed refletem valores demonstrativos das telas; o backend sempre informa que elas são estimativas de demonstração. Um administrador pode substituí-las em `PUT /admin/tarifas`.

Para a futura conexão das telas, `POST /cotacoes` espera `serviceType` (`local` ou `national`) e `packages`, com `heightCm`, `widthCm`, `lengthCm` e `weightKg`. `POST /envios` também exige conta autenticada e os objetos `origin` e `destination`, cada um com `address` e CEP em `zip`. Os nomes dos campos HTTP estão documentados em `/api/docs`; a interface atual ainda usa armazenamento e cálculo locais.

## Segurança e privacidade

- Senhas são armazenadas com bcrypt; JWT tem validade configurável e logout invalida tokens anteriores.
- O cadastro público não aceita perfil; só o comando local cria o primeiro administrador.
- Dados de documento e CNH são criptografados com AES-256-GCM; uma impressão HMAC permite detectar duplicidade sem persistir o documento puro.
- Respostas administrativas exibem documento mascarado; rastreio público não expõe endereços nem notas internas.
- Schemas estritos validam entrada; APIs têm limite de corpo, CORS configurável, cabeçalhos Helmet e limites de tentativas em login e formulários.
- O histórico do envio guarda o autor, a situação, local, descrição pública e anotação privada. A API nunca retorna notas internas no rastreio público.

Configure `TRUST_PROXY=true` apenas atrás de um proxy confiável. Para produção, use TLS, uma conta MySQL com privilégios mínimos, segredos fora do controle de versão e política operacional de retenção dos dados pessoais.

## Testes e rastreabilidade (módulo 7)

Execute `npm test` para cobrir cálculo de tarifas, proteção de dados, transições de situação e respostas HTTP/validação. Os testes usam a biblioteca padrão `node:test` e não precisam de MySQL.

| Requisito dos módulos | Implementação UrbanLink | Verificação |
|---|---|---|
| Módulos 1–2: projeto organizado por camadas | `src/config`, `controllers`, `services`, `models`, `routes` | Inicialização e teste HTTP |
| Módulo 3: autenticação e perfis | JWT, bcrypt, roles, middleware e provisionamento local do administrador | Rota HTTP e checagem de acesso nos serviços |
| Módulo 4: entidades e histórico | envios, pacotes, tarifas e eventos em migrações relacionais | Testes de estado; migrações MySQL pendentes de servidor local |
| Módulo 5: pesquisa e paginação | filtros e paginação em usuários, envios, parcerias e contatos | Validação de consulta no middleware |
| Módulo 6: requisitos de negócio e proteção | cotação, cancelamento, transições, consentimento e dados criptografados | Testes de cotação, PII e transições |
| Módulo 7: testes e rastreabilidade | testes unitários, integração HTTP e esta tabela | `npm test` |
| Módulos 8–9: telas e integração | serve as telas irmãs e expõe API documentada para integração futura | Health e validação HTTP; front-end ainda permanece demonstrativo |
