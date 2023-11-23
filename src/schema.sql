pragma foreign_keys = on;

-- user at time
create table if not exists users(
   epoch
      integer not null,
   id
      integer(17) not null,
   user_name
      text not null,
   profile_url
      text not null,
   avatar_hash
      text,
   last_logoff
      integer not null,
   real_name
      text not null,
   time_created
      integer not null,
   steam_xp
      integer not null,
   steam_level
      integer not null,
   steam_xp_needed_to_level_up
      integer not null,
   steam_xp_needed_current_level
      integer not null,
   primary key (epoch, id),
   foreign key (avatar_hash) references avatars(hash)
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
      integer not null,
   playtime_windows_forever
      integer,
   playtime_mac_forever
      integer,
   playtime_linux_forever
      integer,

   last_played
      integer not null,

   primary key (epoch, user_id, game_id),
   foreign key (epoch, user_id) references users(epoch, id)
);

create table if not exists avatars(
   hash
      text not null,
   data
      blob,
   primary key (hash)
);

create table if not exists friends(
   epoch
      integer not null,
   source_id
      integer(17) not null,
   dest_id
      integer(17) not null,
   friend_since
      integer not null,

   primary key (epoch, source_id, dest_id),
   foreign key (epoch, source_id) references users(epoch, id)
);
