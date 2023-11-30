-- schema v1.0.0
create table sma_meta(schema_version text not null) strict;
insert into sma_meta values ('v1.0.0');

create table avatars(
   hash
      text not null,
   data
      blob,
   primary key (hash)
) strict;

-- one record created per archiving session
create table users(
   last_updated
      integer not null,
   id
      integer(17) not null,

   last_logoff
      integer not null,
   primary key (last_updated, id)
) strict;

-- infrequent user changes
create table users2(
   last_updated
      integer not null,
   user_id
      integer(17) not null,

   user_name
      text not null,
   profile_url
      text not null,
   avatar_hash
      text,
   real_name
      text not null,
   time_created -- as far as I know, this shouldn't change ever
      integer not null,

   primary key (last_updated, user_id),
   foreign key (last_updated, user_id) references users(last_updated, id),

   foreign key (avatar_hash) references avatars(hash)
) strict;
/*
This view keeps only the latest record for specific user_ids.
There should only be one row per user_id.
*/
create view users2_vw as
   select max(last_updated) as last_updated, *
      from users2
      group by user_id;
/*
If there's a similar record, i.e. all fields are the same except for
last_updated, then we don't actually want to insert anything. If a similar
record does NOT EXISTS, then we'll insert a new row.
*/
create trigger users2_insert instead of insert on users2
when not exists (
   select * from users2_vw where 1
      and new.user_name = user_name
      and new.profile_url = profile_url
      and new.avatar_hash = avatar_hash
      and new.real_name = real_name
      and new.time_created = time_created
)
begin
   insert into users2 values (
      new.last_updated,
      new.user_id,

      new.user_name,
      new.profile_url,
      new.avatar_hash,
      new.real_name,
      new.time_created
   );
end

create table leveling(
   last_updated
      integer not null,
   user_id
      integer(17) not null,

   steam_xp
      integer not null,
   steam_level
      integer not null,
   steam_xp_needed_to_level_up
      integer not null,
   steam_xp_needed_current_level
      integer not null,

   primary key (last_updated, user_id),
   foreign key (last_updated, user_id) references users(last_updated, id)
) strict;

create view leveling_vw as
   select max(last_updated) as last_updated, *
   from leveling
   group by user_id;

create trigger leveling_insert instead of insert on leveling_vw
when not exists (
   select * from leveling_vw where 1
      and new.user_id = user_id
      and new.steam_xp = steam_xp
      and new.steam_level = steam_level
      and new.steam_xp_needed_to_level_up = steam_xp_needed_to_level_up
      and new.steam_xp_needed_current_level = steam_xp_needed_current_level
)
begin
   insert into leveling values (
      new.last_updated,
      new.user_id,
      new.steam_xp,
      new.steam_level,
      new.steam_xp_needed_to_level_up,
      new.steam_xp_needed_current_level
   );
end

/*
https://partner.steamgames.com/doc/store/editing/name
> You can change the name of your game within Steamworks at any time until your
> store page has been through the pre-release review process.

It seems to me that the game name can actually change.
*/
create table if not exists playtime(
   last_updated
      integer not null,
   user_id
      integer(17) not null,
   game_id
      integer not null,

   name
      text not null,
   playtime_2weeks
      integer,
   playtime_forever
      integer not null,
   playtime_windows_forever
      integer not null,
   playtime_mac_forever
      integer not null,
   playtime_linux_forever
      integer not null,
   last_played
      integer not null,

   primary key (last_updated, user_id, game_id),
   foreign key (last_updated, user_id) references users(last_updated, id)
) strict;

create view playtime_vw as
   select max(last_updated) as last_updated, *
   from playtime
   group by user_id, game_id;

create trigger playtime_insert instead of insert on playtime_vw
when not exists (
   select * from playtime_vw where 1
      and new.user_id = user_id
      and new.game_id = game_id
      and new.name = name
      and new.playtime_2weeks = playtime_2weeks
      and new.playtime_forever = playtime_forever
      and new.playtime_windows_forever = playtime_windows_forever
      and new.playtime_mac_forever = playtime_mac_forever
      and new.playtime_linux_forever = playtime_linux_forever
      and new.last_played = last_played
)
begin
   insert into playtime values (
      new.last_updated,
      new.user_id,
      new.game_id,
      new.name,
      new.playtime_2weeks,
      new.playtime_forever,
      new.playtime_windows_forever,
      new.playtime_mac_forever,
      new.playtime_linux_forever,
      new.last_played
   );
end

/*
Bidirectional relationship.
user_a will be the user with the smaller id.
user_b will be the user with the greater id.
*/
create table if not exists friends(
   last_updated
      integer not null,

   user_a
      integer(17) not null,
   user_b
      integer(17) not null,

   -- null means not friends
   friends_since
      integer,

   primary key (last_updated, user_a, user_b),
   check (user_a < user_b),
) strict;

-- One row per friendship / combination of user_a, user_b.
create view friends_vw as
   select max(last_updated) as last_updated, *
   from friends
   where friends_since is not null
   group by user_a, user_b;

create trigger friends_insert instead of insert on friends_vw
when not exists (
   select * from friends_vw where 1
      and new.user_a = user_a
      and new.user_b = user_b
      and new.friends_since = friends_since
)
begin
   insert into friends values (
      new.last_updated,
      new.user_a,
      new.user_b,
      new.friends_since
   );
end
