pragma foreign_keys = on;

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
create table if not exists users_inf(
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
create view if not exists users_inf_vw
as select max(last_updated) as last_modified, * from users_inf group by user_id;
/*
It's probably worth explaining this nonsense at least once.
First intercept the insert operation on the bios table.
We're only gonna allow an insert if there's some new data.
To do that, let's take the users's last record using a sub-subquery and compare each and every column.
If they're all equal, that subquery is gonna come up empty which means that the exists thing is gonna be false.
And if the when clause is false, we're not gonna insert.
*/
create trigger if not exists users_inf_insert instead of insert on users_inf
when exists (
   select * from (select * from users_inf where new.user_id = user_id order by last_updated desc limit 1)
   where 0
      or new.user_name <> user_name
      or new.profile_url <> profile_url
      or new.avatar_hash <> avatar_hash
      or new.last_logoff <> last_logoff
      or new.real_name <> real_name
      or new.time_created <> time_created
)
begin insert into users_inf values (
   new.last_updated,
   new.user_id,

   new.user_name,
   new.profile_url,
   new.avatar_hash,
   new.last_logoff,
   new.real_name,
   new.time_created
);

create table if not exists leveling(
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
);
create trigger if not exists leveling_insert instead of insert on leveling
when exists (
   select * from (select * from leveling where new.user_id = user_id order by last_updated desc limit 1)
   where 0
      or new.steam_xp <> steam_xp
      or new.steam_level <> steam_level
      or new.steam_xp_needed_to_level_up <> steam_xp_needed_to_level_up
      or new.steam_xp_needed_current_level <> steam_xp_needed_current_level
)
begin insert into leveling values (
   new.last_updated,
   new.user_id,

   new.steam_xp,
   new.steam_level,
   new.steam_xp_needed_to_level_up,
   new.steam_xp_needed_current_level
);

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
);
create view if not exists playtime_vw
as select
   max(last_updated) as last_updated,
   *,
group by 

create trigger if not exists playtime_insert instead of insert on playtime
when exists (
   select * from (select * from playtime where new.user_id = user_id order by last_updated desc limit 1)
   where 0
      or new.name <> name
      or new.playtime_2weeks <> playtime_2weeks
      or new.playtime_forever <> playtime_forever
      or new.playtime_windows_forever <> playtime_windows_forever
      or new.playtime_mac_forever <> playtime_mac_forever
      or new.last_played <> last_played
)
begin insert into playtime values (
   new.last_updated,
   new.user_id,

   new.steam_xp,
   new.steam_level,
   new.steam_xp_needed_to_level_up,
   new.steam_xp_needed_current_level
);

create table if not exists avatars(
   hash
      text not null,
   data
      blob,
   primary key (hash)
);

-- this is a bidirectional relationship so let's not record stuff twice
create table if not exists friends(
   last_updated
      integer not null,

   user_a -- user with the smaller id
      integer(17) not null,
   user_b -- user with the bigger id
      integer(17) not null,

   -- null means not friends
   friends_since
      integer,

   primary key (last_updated, user_a, user_b),
   check (user_a < user_b),
);

create view if not exists friends_vw
as select
   max(last_updated) as last_updated,
   user_a,
   user_b,
   friends_since
from friends
where friends_since is not null
group by user_a, user_b;



-- friends.
