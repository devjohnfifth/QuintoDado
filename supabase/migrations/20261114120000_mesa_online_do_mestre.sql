-- Mestre aprovado passa a criar mesa online, não só presencial.
--
-- Por que isso não reabre o Conflito A (§5.1 da especificação): o risco de
-- intermediação de pagamento por pessoa física vem do site *processar* o
-- dinheiro, não da modalidade da mesa. A exceção D11–D13 liberou a presencial
-- porque `cobranca_gerenciada_pelo_site = false` mantém o pagamento fora do
-- site. Mesa online com a mesma trava tem o mesmo perfil de risco. Mesa online
-- *comissionada* (o site cobra e repassa) continua só do admin, e segue
-- dependendo do gateway, que é Fase 2.
--
-- O problema é que as policies confiavam na aplicação para isso:
--
--   `mesa_cria` checava papel e dono, mas deixava passar qualquer
--   `cobranca_gerenciada_pelo_site` e qualquer `status`.
--
--   `mesa_mestre_edita` tinha só `using`, sem `with check` — e em UPDATE o
--   Postgres, sem `with check`, só valida a linha ANTIGA. Então o dono podia
--   gravar qualquer valor novo.
--
-- Enquanto só a presencial estava aberta e o formulário fixava os dois campos,
-- isso não aparecia. Mas a garantia morava no form, e form não é garantia: um
-- insert/update direto no PostgREST com uma sessão de mestre criava mesa com
-- cobrança gerenciada pelo site, ou se autopublicava sem passar pela moderação.

-- ---------------------------------------------------------------------
-- Criação (D12 e D13 viram regra do banco)
-- ---------------------------------------------------------------------
drop policy if exists mesa_cria on public.mesas;

create policy mesa_cria on public.mesas for insert
  with check (
    eh_admin()
    or (
      mestre_id = auth.uid()
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.papel in ('mestre', 'admin')
      )
      -- D12: o valor da mesa de mestre é informativo, combinado fora do site.
      and cobranca_gerenciada_pelo_site = false
      -- D13: a moderação do admin continua; só quem cria mudou.
      and status = 'aguardando_aprovacao'
    )
  );

-- ---------------------------------------------------------------------
-- Edição
-- ---------------------------------------------------------------------
-- O `using` continua o mesmo: dono ou admin. O que muda é o `with check`, que
-- antes não existia.
--
-- A cobrança dá pra travar aqui, porque não depende do valor anterior. O
-- status não: exigir `status = 'aguardando_aprovacao'` no check quebraria a
-- edição legítima de uma mesa que o admin já publicou — o mestre não
-- conseguiria mais corrigir a própria sinopse. Comparação com o valor antigo
-- não existe em `with check`, então o status vai na trigger abaixo.
drop policy if exists mesa_mestre_edita on public.mesas;

create policy mesa_mestre_edita on public.mesas for update
  using (mestre_id = auth.uid() or eh_admin())
  with check (
    eh_admin()
    or (mestre_id = auth.uid() and cobranca_gerenciada_pelo_site = false)
  );

-- ---------------------------------------------------------------------
-- Campos que continuam sendo só do admin
-- ---------------------------------------------------------------------
-- Aqui dá pra comparar OLD com NEW, que é o que o `with check` não alcança.
create or replace function public.mesa_protege_campos_do_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- `security definer` para não depender da RLS de profiles na hora de saber
  -- quem está editando.
  if exists (select 1 from profiles where id = auth.uid() and papel = 'admin') then
    return new;
  end if;

  if new.mestre_id is distinct from old.mestre_id then
    raise exception 'Não dá pra transferir a mesa para outro mestre.' using errcode = '42501';
  end if;

  if new.cobranca_gerenciada_pelo_site is distinct from old.cobranca_gerenciada_pelo_site then
    raise exception 'Só o admin muda a forma de cobrança da mesa.' using errcode = '42501';
  end if;

  if new.aprovada_por is distinct from old.aprovada_por
     or new.aprovada_em is distinct from old.aprovada_em then
    raise exception 'Só o admin aprova mesa.' using errcode = '42501';
  end if;

  -- O mestre cancela a própria mesa; publicar e confirmar continuam do admin.
  if new.status is distinct from old.status and new.status <> 'cancelada' then
    raise exception 'Só o admin muda o status da mesa.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists mesa_protege_campos on public.mesas;

create trigger mesa_protege_campos
  before update on public.mesas
  for each row
  execute function public.mesa_protege_campos_do_admin();
