create or replace function seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, color, emoji)
  values
    (new.id, 'Food',       '#8991B2', '🍱'),
    (new.id, 'Transport',  '#B0B9D3', '🚇'),
    (new.id, 'Groceries',  '#7BBFB5', '🛒'),
    (new.id, 'Dining',     '#C49BAA', '🍽️'),
    (new.id, 'Shopping',   '#9BC4C9', '🛍️'),
    (new.id, 'Healthcare', '#AAB5C5', '💊'),
    (new.id, 'Other',      '#BBBBC4', '📦');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_user_created
  after insert on auth.users
  for each row execute function seed_default_categories();
