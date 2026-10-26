-- When the photo was taken (editable by the user, defaults to EXIF/now) and how usable it was for the AI.
alter table public.polenbee_pollen_analyses
  add column if not exists photo_taken_at timestamptz,
  add column if not exists photo_quality text;
