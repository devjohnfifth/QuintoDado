-- Evento que já aconteceu continua no ar.
--
-- `evento_leitura` liberava só `status = 'publicado'`, então no dia em que o
-- admin marcava o evento como encerrado a página inteira virava 404: sumiam
-- as fotos, os apoiadores, os mestres e o texto. O UAIventura, que é a prova
-- de que a coisa funciona, hoje não existe pra quem chega de fora — e o
-- endereço dele já circulou e está indexado, então o 404 também joga fora o
-- link que o Google já conhecia.
--
-- Evento encerrado é acervo: serve de prova social pro próximo, responde a
-- busca pelo nome dele e mantém o link vivo. O que ele não pode é continuar
-- vendendo ingresso — isso o código tranca pelo `status`, e a listagem separa
-- "próximos" de "já rolaram" pra ninguém se confundir.
--
-- `rascunho` e `cancelado` seguem invisíveis: um nunca foi público, o outro
-- não aconteceu.

drop policy if exists evento_leitura on eventos;
create policy evento_leitura on eventos for select
  using (status in ('publicado', 'encerrado') or eh_admin());

-- Os tipos de ingresso seguem a mesma regra: a página do evento encerrado
-- mostra quanto custava, mas o botão de comprar não aparece.
drop policy if exists evento_ingresso_tipo_leitura on evento_ingresso_tipos;
create policy evento_ingresso_tipo_leitura on evento_ingresso_tipos for select
  using (
    eh_admin()
    or exists (
      select 1 from eventos e
      where e.id = evento_id and e.status in ('publicado', 'encerrado')
    )
  );

-- Pagamento continua só pra evento publicado: ninguém paga por evento que já
-- aconteceu. (A policy de 20261115220000 já dizia 'publicado'; fica o
-- comentário pra deixar claro que é de propósito, e não esquecimento.)
comment on table public.evento_pagamento is
  'Chave Pix e WhatsApp do evento. Legível só por admin e por quem está logado num evento PUBLICADO — evento encerrado não cobra mais.';
