-- Pro admin conseguir esconder mesas canceladas há mais de um dia (feedback
-- do usuário) sem depender de criado_em (que marca quando a mesa nasceu,
-- não quando foi cancelada).
alter table mesas add column if not exists cancelado_em timestamptz;
