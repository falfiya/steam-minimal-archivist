create table meta(
   vmajor integer not null,
   vminor integer not null,
   vpatch integer not null,
   last_vacuumed integer not null
) strict;

insert into meta values (2, 0, 0, 0);

create table _strings(
   id integer primary key not null,
   value text unique not null
) strict;

create table users(
   id integer primary key not null,
   time_created integer not null
) strict;

create view user_at as
select
   at.epoch,
   at.id,
   u.time_created,

   at.last_logoff,

   (select value from _strings where id = ex.user_name) as user_name,
   (select value from _strings where id = ex.profile_url) as profile_url,
   (select hash from avatars where id = ex.avatar) as avatar_hash,
   (select value from _strings where id = ex.real_name) as real_name,

   ex.steam_xp,
   ex.steam_level,
   ex.steam_xp_needed_to_level_up,
   ex.steam_xp_needed_current_level
from users as u
join _user_at as at
   on u.id = at.id
join _user_ex as ex
   on at.ex = ex.id;

create trigger user_at_insert instead of insert on user_at
begin
   insert into users values (new.id, new.time_created)
      on conflict do nothing;

   insert into _strings values (null, new.user_name), (null, new.profile_url)
      on conflict do nothing;

   insert into _user_ex values (
      null,

      (select id from _strings where value = new.user_name),
      (select id from _strings where value = new.profile_url),
      (select id from avatars where hash = new.avatar_hash),

      (select case when new.real_name is null then -1
         else (select id from _strings where value = new.real_name) end),

      new.steam_xp,
      new.steam_level,
      new.steam_xp_needed_to_level_up,
      new.steam_xp_needed_current_level
   ) on conflict do nothing;

   insert into _user_at values (
      new.epoch,
      new.id,

      new.last_logoff,
      (select id from _user_ex where (1
         and user_name =
            (select id from _strings where value = new.user_name)
         and profile_url =
            (select id from _strings where value = new.profile_url)
         and avatar =
            (select id from avatars where hash = new.avatar_hash)
         and real_name =
            (select case when new.real_name is null then -1
               else (select id from _strings where value = new.real_name) end)
         and steam_xp = new.steam_xp
         and steam_level = new.steam_level
         and steam_xp_needed_to_level_up = new.steam_xp_needed_to_level_up
         and steam_xp_needed_current_level = new.steam_xp_needed_current_level
         )
      )
   );
end;

create table _user_at(
   epoch integer not null,
   id integer references users not null,

   last_logoff integer not null,
   ex integer references _user_ex not null,

   primary key (epoch, id)
) strict;

create table _user_ex(
   id integer primary key not null,

   user_name integer references _strings not null,
   profile_url integer references _strings not null,
   avatar integer references avatars not null,

   real_name integer not null, -- may reference _strings.id

   -- leveling data
   steam_xp integer not null,
   steam_level integer not null,
   steam_xp_needed_to_level_up integer not null,
   steam_xp_needed_current_level integer not null,

   unique (
      user_name,
      profile_url,
      avatar,
      real_name,
      steam_xp,
      steam_level,
      steam_xp_needed_to_level_up,
      steam_xp_needed_current_level
   )
) strict;

create table avatars(
   id integer primary key not null,
   hash text unique not null,
   data blob not null -- unique but it would take too long
) strict;

create table games(
   id integer primary key not null
) strict;

create view game_at as
select
   epoch,
   id,
   (select value from _strings where id = name) as name
from _game_at;

create trigger game_at_insert instead of insert on game_at
begin
   insert into games values (new.id) on conflict do nothing;
   insert into _strings values (null, new.name) on conflict do nothing;

   insert into _game_at values (
      new.epoch,
      new.id,
      (select id from _strings where value = new.name)
   );
end;

create table _game_at(
   epoch integer not null,
   id integer references games not null,
   /*
   https://partner.steamgames.com/doc/store/editing/name
   > You can change the name of your game within Steamworks at any time until your
   > store page has been through the pre-release review process.

   This table might be overkill but I got nervy.
   */
   name integer references _strings not null,

   primary key (id, epoch)
) strict;

create view playtime_at as
select
   at.epoch,
   at.user_id,
   at.game_id,

   ex.playtime_2weeks,
   ex.playtime_forever,
   ex.playtime_windows_forever,
   ex.playtime_mac_forever,
   ex.playtime_linux_forever,
   ex.last_played
from _playtime_at as at
join _playtime_ex as ex
   on at.ex = ex.id;

create trigger playtime_at_insert instead of insert on playtime_at
begin
   insert into _playtime_ex values (
      null,

      new.playtime_2weeks,
      new.playtime_forever,
      new.playtime_windows_forever,
      new.playtime_mac_forever,
      new.playtime_linux_forever,
      new.last_played
   ) on conflict do nothing;

   insert into _playtime_at values (
      new.epoch,
      new.user_id,
      new.game_id,

      (select id from _playtime_ex where (1
         and playtime_2weeks = new.playtime_2weeks
         and playtime_forever = new.playtime_forever
         and playtime_windows_forever = new.playtime_windows_forever
         and playtime_mac_forever = new.playtime_mac_forever
         and playtime_linux_forever = new.playtime_linux_forever
         and last_played = new.last_played)
      )
   );
end;

create table _playtime_at(
   epoch integer not null,
   user_id integer references users not null,
   game_id integer references games not null,

   ex integer references _playtime_ex not null,

   primary key (epoch, user_id, game_id)
) strict;

create table _playtime_ex(
   id integer primary key not null,

   playtime_2weeks integer not null, -- set this to zero if N/A
   playtime_forever integer not null,
   playtime_windows_forever integer not null,
   playtime_mac_forever integer not null,
   playtime_linux_forever integer not null,
   last_played integer not null,

   unique (
      playtime_2weeks,
      playtime_forever,
      playtime_windows_forever,
      playtime_mac_forever,
      playtime_linux_forever,
      last_played
   )
) strict;

/*
Bidirectional relationship.
user_a will be the user with the smaller id.
user_b will be the user with the greater id.
*/
create table friend_at(
   epoch integer not null,

   user_a integer not null,
   user_b integer not null,

   friends_since integer not null,

   primary key (epoch, user_a, user_b)
   -- it is the programmer's job to check these
   -- check (user_a <> user_b),
   -- check (user_a < user_b)
) strict;
