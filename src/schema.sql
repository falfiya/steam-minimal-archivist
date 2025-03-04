create table meta(version text not null) strict;
insert into meta values ('2.0.0');

create table strings(
   id integer primary key not null,
   value text unique not null
) strict;

create table snapshots(
   epoch integer primary key not null
) strict;

create table users(
   id integer primary key not null,
   time_created integer not null
) strict;

create table games(
   id integer primary key not null
) strict;

create table user_at(
   epoch integer references snapshots not null,
   id integer references users not null,

   last_logoff integer not null,
   more integer references users_more not null,

   primary key (epoch, id)
) strict;

create table users_more(
   id integer primary key not null,

   user_name integer references strings not null,
   profile_url integer references strings not null;
   avatar integer references avatars not null;

   real_name integer references strings, -- allowed to to be null

   -- leveling data
   steam_xp integer not null,
   steam_level integer not null,
   steam_xp_needed_to_level_up integer not null,
   steam_xp_needed_current_level integer not null,
) strict;

create table avatars(
   id integer primary key not null,
   hash text unique not null,
   data blob unique not null,
) strict;

create table games(
   id integer primary key not null
) strict;

create table game_at(
   id integer not null,
   epoch integer references snapshots not null,
   /*
   https://partner.steamgames.com/doc/store/editing/name
   > You can change the name of your game within Steamworks at any time until your
   > store page has been through the pre-release review process.

   It seems to me that the game name can actually change.

   This table might be overkill though but I got nervy.
   */
   name integer references strings not null,

   primary key (id, epoch)
) strict;

create table playtime_at(
   epoch integer references snapshots not null,
   user_id integer references users not null,
   game_id integer references games not null,

   more integer references playtime_more not null,

   primary key (epoch, user_id, game_id)
) strict;

create table playtime_more(
   id integer primary key not null,

   playtime_2weeks integer,
   playtime_forever integer not null,
   playtime_windows_forever integer not null,
   playtime_mac_forever integer not null,
   playtime_linux_forever integer not null,
   last_played integer not null,
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

   primary key (epoch, user_a, user_b),
   check (user_a <> user_b),
   check (user_a < user_b)
) strict;
