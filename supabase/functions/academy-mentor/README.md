# Mentor de IA da ChromaX

A função `academy-mentor` responde ao chat de Meu Laboratório usando a API da OpenAI. A chave do provedor fica exclusivamente nos secrets do Supabase e nunca é enviada ao navegador.

## Configuração necessária

1. Configure o secret da OpenAI no projeto Supabase:

   `supabase secrets set OPENAI_API_KEY=sua_chave`

2. Publique a função:

   `supabase functions deploy academy-mentor`

3. Confirme que a função está vinculada ao mesmo projeto Supabase usado pelo aplicativo e que a autenticação JWT das Edge Functions continua habilitada.

A função usa `SUPABASE_URL` e `SUPABASE_ANON_KEY` fornecidos automaticamente pelo ambiente das Edge Functions.

## Observações

- O chat exige uma sessão autenticada.
- O histórico atual permanece na sessão aberta do navegador; ainda não existe persistência de conversas entre dispositivos.
- A função usa o modelo `gpt-4.1-mini`. O modelo pode ser alterado no arquivo `index.ts`.
- Não cole senhas, tokens ou chaves privadas no chat.
