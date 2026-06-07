create table if not exists delivery_rules (
  id integer primary key autoincrement,
  match_type text not null check (match_type in ('cp', 'cp_prefix', 'state', 'national')),
  match_value text not null,
  carrier text not null,
  service_label text not null,
  min_business_days integer not null,
  max_business_days integer not null,
  target_cost_mxn integer not null default 120,
  cutoff_hour_local integer not null default 13,
  priority integer not null default 100,
  active integer not null default 1,
  notes text,
  updated_at text not null default current_timestamp
);

create unique index if not exists delivery_rules_unique_idx
  on delivery_rules (match_type, match_value, carrier, service_label);

create index if not exists delivery_rules_lookup_idx
  on delivery_rules (match_type, match_value, active, priority);

create table if not exists delivery_holidays (
  holiday_date text primary key,
  name text not null
);

insert or replace into delivery_rules (
  match_type,
  match_value,
  carrier,
  service_label,
  min_business_days,
  max_business_days,
  target_cost_mxn,
  cutoff_hour_local,
  priority,
  notes
) values
  ('cp_prefix', '64', 'Estafeta / FedEx', 'Zona metropolitana de Monterrey', 1, 2, 120, 13, 10, 'Origen San Nicolas de los Garza; regla local.'),
  ('cp_prefix', '66', 'Estafeta / FedEx', 'Zona metropolitana de Monterrey', 1, 2, 120, 13, 10, 'Origen San Nicolas de los Garza; regla local.'),
  ('cp_prefix', '67', 'Estafeta / FedEx', 'Nuevo Leon cercano', 1, 3, 120, 13, 20, 'Regla regional para Nuevo Leon.'),
  ('state', 'Nuevo León', 'Estafeta / FedEx', 'Nuevo Leon', 1, 3, 120, 13, 30, 'Cobertura estatal estimada.'),
  ('state', 'Ciudad de México', 'DHL / FedEx / Estafeta', 'Nacional express', 2, 3, 120, 13, 40, 'Zona urbana con buena frecuencia.'),
  ('state', 'México', 'DHL / FedEx / Estafeta', 'Nacional express', 2, 4, 120, 13, 45, 'Zona centro; puede variar por municipio.'),
  ('state', 'Jalisco', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 50, 'Guadalajara suele quedar en el rango bajo.'),
  ('state', 'Veracruz de Ignacio de la Llave', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 50, 'Boca del Rio y Veracruz suelen quedar en el rango bajo.'),
  ('state', 'Puebla', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 55, 'Zona centro con cobertura frecuente.'),
  ('state', 'Querétaro', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 55, 'Zona bajio con cobertura frecuente.'),
  ('state', 'Guanajuato', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 55, 'Zona bajio con cobertura frecuente.'),
  ('state', 'Aguascalientes', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 4, 120, 13, 55, 'Zona bajio con cobertura frecuente.'),
  ('state', 'San Luis Potosí', 'DHL / FedEx / Estafeta', 'Nacional regular', 2, 5, 120, 13, 58, 'Zona centro-norte.'),
  ('state', 'Tamaulipas', 'Estafeta / FedEx', 'Norte regular', 2, 5, 120, 13, 58, 'Zona norte cercana.'),
  ('state', 'Coahuila de Zaragoza', 'Estafeta / FedEx', 'Norte regular', 2, 5, 120, 13, 58, 'Zona norte cercana.'),
  ('state', 'Chihuahua', 'DHL / FedEx / Estafeta', 'Norte extendido', 3, 6, 120, 13, 70, 'Distancia mayor desde Nuevo Leon.'),
  ('state', 'Sonora', 'DHL / FedEx / Estafeta', 'Norte extendido', 3, 6, 120, 13, 70, 'Distancia mayor desde Nuevo Leon.'),
  ('state', 'Baja California', 'DHL / FedEx / Estafeta', 'Noroeste extendido', 3, 6, 120, 13, 75, 'Distancia mayor desde Nuevo Leon.'),
  ('state', 'Baja California Sur', 'DHL / FedEx / Estafeta', 'Noroeste extendido', 4, 7, 120, 13, 80, 'Zona peninsular.'),
  ('state', 'Quintana Roo', 'DHL / FedEx / Estafeta', 'Sureste extendido', 3, 6, 120, 13, 75, 'Distancia mayor desde Nuevo Leon.'),
  ('state', 'Yucatán', 'DHL / FedEx / Estafeta', 'Sureste extendido', 3, 6, 120, 13, 75, 'Distancia mayor desde Nuevo Leon.'),
  ('state', 'Chiapas', 'DHL / FedEx / Estafeta', 'Sureste extendido', 3, 7, 120, 13, 80, 'Zonas fuera de ciudad pueden tardar mas.'),
  ('state', 'Oaxaca', 'DHL / FedEx / Estafeta', 'Sur extendido', 3, 7, 120, 13, 80, 'Zonas fuera de ciudad pueden tardar mas.'),
  ('national', '*', 'DHL / FedEx / Estafeta / Sepomex', 'Nacional estimado', 3, 6, 120, 13, 100, 'Regla fallback mientras se ajustan rutas reales.');

insert or ignore into delivery_holidays (holiday_date, name) values
  ('2026-09-16', 'Dia de la Independencia'),
  ('2026-11-16', 'Revolucion Mexicana observada'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Ano Nuevo'),
  ('2027-02-01', 'Constitucion observada'),
  ('2027-03-15', 'Natalicio de Benito Juarez observado'),
  ('2027-05-01', 'Dia del Trabajo'),
  ('2027-09-16', 'Dia de la Independencia'),
  ('2027-11-15', 'Revolucion Mexicana observada'),
  ('2027-12-25', 'Navidad');
