drop table if exists postal_codes;

create table postal_codes (
  id integer primary key autoincrement,
  cp text not null,
  state text not null,
  municipality text not null,
  settlement text not null,
  settlement_type text,
  city text,
  zone_type text,
  source text not null default 'sepomex',
  updated_at text not null default current_timestamp
);

create index postal_codes_cp_idx on postal_codes (cp);
