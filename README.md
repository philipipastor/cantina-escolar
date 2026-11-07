# Cantina

Sistema de gestão de compras, fiados, pagamentos e créditos de cantinas escolares.

- `api/`: API em Node.js, TypeScript, Express, PostgreSQL, Prisma, Zod, JWT, bcryptjs, Jest e Supertest.
- `web/`: telas em React com Vite (ainda não criadas).

## Como rodar

Requer Node.js 22 ou superior e Docker Desktop aberto.

```bash
npm install
npm run db:up
```

Copie `api/.env.example` para `api/.env` e defina `JWT_SECRET` e `SEED_PASSWORD`. Depois:

```bash
npm run prisma:deploy -w api
npm run seed -w api
npm run dev
```

A API fica em `http://localhost:3333`.

## Primeiro acesso

O seed cria apenas o usuário `admin`, com a senha definida em `SEED_PASSWORD`, de 8 a 72 caracteres. Ele pode rodar mais de uma vez: se o `admin` já existir, nada muda, nem a senha. Em produção, defina `SEED_PASSWORD` nas variáveis de ambiente do servidor e rode `npm run seed -w api` depois das migrações.

Depois, o administrador entra no sistema e cadastra as cantinas e os funcionários, sem alterar o código nem publicar de novo. Para mudar a senha depois disso, use o próprio sistema: alterar `SEED_PASSWORD` não muda a senha de um `admin` que já existe.

## Testes

```bash
npm test
```

Os testes usam o banco `cantina_test` e apagam os dados dele a cada execução. O banco de desenvolvimento não é afetado.

## Organização

| Pasta             | Conteúdo                                                 |
| ----------------- | -------------------------------------------------------- |
| `src/routes`      | Rotas de cada recurso                                    |
| `src/controllers` | Recebem a requisição e aplicam as regras                 |
| `src/schemas`     | Validação dos dados com Zod                              |
| `src/middlewares` | Autenticação, permissões, acesso à cantina e erros       |
| `src/utils`       | Saldo, lançamentos, datas, token e formato das respostas |
| `src/configs`     | Variáveis de ambiente e JWT                              |
| `prisma`          | Modelo do banco, migrações e seed                        |
| `tests`           | Testes com banco real                                    |

A conexão do Prisma 7 fica em dois lugares: `prisma.config.ts`, usado pelos comandos como `migrate` e `seed`, e `src/prisma.ts`, usado pela API com o adaptador `@prisma/adapter-pg`.

## Regras principais

- **Saldo:** é sempre a soma dos lançamentos da conta. Positivo é crédito; negativo é dívida. Os valores são guardados em centavos.
- **Lançamentos:** nunca são alterados nem apagados, o que o próprio banco garante. Um lançamento errado é estornado e, se preciso, refeito.
- **Novas tentativas:** toda operação financeira exige uma `idempotencyKey`, gerada pela tela ao abrir o formulário. Reenviar a mesma chave devolve o lançamento original com status 200.
- **Cantinas:** toda rota de unidade fica em `/canteens/:canteenId`, e o funcionário só acessa a própria. As chaves estrangeiras compostas impedem vínculos entre unidades no banco.
- **Autenticação:** envie `Authorization: Bearer <token>`. Inativar um usuário ou trocar a senha derruba o acesso na hora. Para sair, a tela descarta o token.

## Rotas

| Rota                                                                | Finalidade                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `POST /sessions`                                                    | Login                                                       |
| `GET /users/me`, `PATCH /users/me/password`                         | Dados e troca da própria senha                              |
| `GET, POST /users`, `PATCH /users/:id`, `PATCH /users/:id/password` | Usuários (só o administrador)                               |
| `GET /dashboard`                                                    | Visão das cantinas e estornos recentes (só o administrador) |
| `GET /canteens`                                                     | Cantinas acessíveis ao usuário                              |
| `POST /canteens`, `PATCH /canteens/:id`                             | Criar e renomear cantinas (só o administrador)              |

Rotas abaixo de `/canteens/:canteenId`:

| Rota                                                                 | Finalidade                              |
| -------------------------------------------------------------------- | --------------------------------------- |
| `GET, POST /clients`, `GET, PATCH /clients/:id`                      | Busca, cadastro, edição e inativação    |
| `POST /clients/:id/children`, `PATCH /clients/:id/children/:childId` | Filhos vinculados                       |
| `GET /clients/:id/statement`                                         | Extrato com saldo acumulado             |
| `GET, POST /products`, `PATCH /products/:id`                         | Produtos, com os mais vendidos primeiro |
| `POST /purchases/preview`                                            | Efeito da compra, sem salvar            |
| `POST /purchases`                                                    | Registrar compra                        |
| `POST /payments`                                                     | Pagamento ou depósito antecipado        |
| `POST /opening-balances`                                             | Dívida ou crédito anterior ao sistema   |
| `POST /credit-refunds`                                               | Devolver crédito ao cliente             |
| `POST /entries/:id/reversal`                                         | Estornar, com justificativa             |
| `GET /entries`, `GET /entries/:id`                                   | Histórico e detalhe                     |
| `GET /dashboard`                                                     | Resumo da cantina                       |
| `GET /daily-review?date=AAAA-MM-DD`                                  | Conferência do dia                      |
