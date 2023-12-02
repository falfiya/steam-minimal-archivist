-- schema v1.0.0
create table sma_meta(schema_version integer not null) strict;
insert into sma_meta values (1);

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
      integer not null,

   last_logoff
      integer not null,
   primary key (last_updated, id)
) strict;

create table simple(
   last_updated
      integer not null,
   id
      integer not null,
   primary key (last_updated, id),
   foreign key (last_updated, id) references users(last_updated, id)
) strict;

-- infrequent user changes
create table users2(
   last_updated
      integer not null,
   id
      integer not null,

   user_name
      text not null,
   profile_url
      text not null,
   avatar_hash
      text,
   real_name
      text,
   time_created -- as far as I know, this shouldn't change ever
      integer not null,

   -- leveling data
   steam_xp
      integer not null,
   steam_level
      integer not null,
   steam_xp_needed_to_level_up
      integer not null,
   steam_xp_needed_current_level
      integer not null,

   primary key (last_updated, id),
   foreign key (last_updated, id) references users(last_updated, id),

   foreign key (avatar_hash) references avatars(hash)
) strict;
/*
This view keeps only the latest record for specific user_ids.
There should only be one row per user_id.
*/
create view users2_vw as
   select
      max(last_updated) as last_updated,
      id,

      user_name,
      profile_url,
      avatar_hash,
      real_name,
      time_created,

      steam_xp,
      steam_level,
      steam_xp_needed_to_level_up,
      steam_xp_needed_current_level
   from users2
   group by id;
/*
If there's a similar record, i.e. all fields are the same except for
last_updated, then we don't actually want to insert anything. If a similar
record does NOT EXISTS, then we'll insert a new row.
*/
create trigger users2_insert instead of insert on users2_vw
when not exists (
   select * from users2_vw where 1
      and new.id is id
      and new.user_name is user_name
      and new.profile_url is profile_url
      and new.avatar_hash is avatar_hash
      and new.real_name is real_name
      and new.time_created is time_created
      and new.steam_xp is steam_xp
      and new.steam_level is steam_level
      and new.steam_xp_needed_to_level_up is steam_xp_needed_to_level_up
      and new.steam_xp_needed_current_level is steam_xp_needed_current_level
)
begin
   insert into users2 values (
      new.last_updated,
      new.id,

      new.user_name,
      new.profile_url,
      new.avatar_hash,
      new.real_name,
      new.time_created,

      new.steam_xp,
      new.steam_level,
      new.steam_xp_needed_to_level_up,
      new.steam_xp_needed_current_level
   );
end;

/*
https://partner.steamgames.com/doc/store/editing/name
> You can change the name of your game within Steamworks at any time until your
> store page has been through the pre-release review process.

It seems to me that the game name can actually change.

This table might be overkill though but I got nervy.
*/
create table games(
   last_updated
      integer not null,
   id
      integer not null,
   name
      text not null,
   primary key (id)
) strict;

create view games_vw as
   select
      max(last_updated) as last_updated,
      id,
      name
   from games
   group by id;

create trigger games_insert instead of insert on games_vw
when not exists (
   select * from games_vw where 1
      and new.id is id
      and new.name is name
)
begin
   insert into games values (new.last_updated, new.id, new.name);
end;

create table playtime(
   last_updated
      integer not null,
   user_id
      integer not null,
   game_id
      integer not null,

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
   foreign key (game_id) references games(id),
   foreign key (last_updated, user_id) references users(last_updated, id)
) strict;

create view playtime_vw as
   select
      max(last_updated) as last_updated,
      user_id,
      game_id,

      playtime_2weeks,
      playtime_forever,
      playtime_windows_forever,
      playtime_mac_forever,
      playtime_linux_forever,
      last_played
   from playtime
   group by user_id, game_id;

create trigger playtime_insert instead of insert on playtime_vw
when not exists (
   select * from playtime_vw where 1
      and new.user_id is user_id
      and new.game_id is game_id
      and new.playtime_2weeks is playtime_2weeks
      and new.playtime_forever is playtime_forever
      and new.playtime_windows_forever is playtime_windows_forever
      and new.playtime_mac_forever is playtime_mac_forever
      and new.playtime_linux_forever is playtime_linux_forever
      and new.last_played is last_played
)
begin
   insert into playtime values (
      new.last_updated,
      new.user_id,
      new.game_id,

      new.playtime_2weeks,
      new.playtime_forever,
      new.playtime_windows_forever,
      new.playtime_mac_forever,
      new.playtime_linux_forever,
      new.last_played
   );
end;

/*
Bidirectional relationship.
user_a will be the user with the smaller id.
user_b will be the user with the greater id.
*/
create table friends(
   last_updated
      integer not null,

   user_a
      integer not null,
   user_b
      integer not null,

   -- null means not friends
   friends_since
      integer,

   primary key (last_updated, user_a, user_b),
   check (user_a <> user_b),
   check (user_a < user_b)
) strict;

-- One row per friendship / combination of user_a, user_b.
create view friends_vw as
   select
      max(last_updated) as last_updated,
      user_a,
      user_b,
      friends_since
   from friends
   where friends_since is not null
   group by user_a, user_b;

create trigger friends_insert instead of insert on friends_vw
when not exists (
   select * from friends_vw where 1
      and new.user_a is user_a
      and new.user_b is user_b
      and new.friends_since is friends_since
)
begin
   insert into friends values (
      new.last_updated,
      new.user_a,
      new.user_b,
      new.friends_since
   );
end;
