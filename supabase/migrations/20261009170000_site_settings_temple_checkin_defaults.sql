-- Grava as coordenadas do Templo e a janela padrão do check-in por QR.
-- Só preenche se ainda não houver coordenadas configuradas.
UPDATE public.site_settings
   SET temple_latitude = -22.8812604,
       temple_longitude = -48.4554303,
       checkin_radius_meters = COALESCE(checkin_radius_meters, 50),
       checkin_open_minutes_before = COALESCE(checkin_open_minutes_before, 30)
 WHERE id = 1
   AND temple_latitude IS NULL
   AND temple_longitude IS NULL;
