pragma foreign_keys = on;

-- user at time
create table if not exists users(
   epoch
      integer not null,
   id
      integer(17) not null,
   steam_xp
      integer not null,
   steam_level
      integer not null,
   steam_xp_needed_to_level_up,
      integer not null,
   steam_xp_needed_current_level,
      integer not null,
   primary key (epoch, id),
);

-- game at time
create table if not exists games(
   epoch
      integer not null,
   user_id
      integer(17) not null,
   game_id
      integer not null,
   name
      text,

   playtime_2weeks
      integer,
   playtime_forever
      integer,
   playtime_windows_forever
      integer,
   playtime_mac_forever
      integer,
   playtime_linux_forever
      integer,

   last_played
      integer,

   primary key (epoch, user_id, game_id),
   foreign key (epoch, user_id) references users(epoch, id)
);
