revoke all on public.profiles from authenticated;
revoke all on public.songs from authenticated;
revoke all on public.lyric_lines from authenticated;
revoke all on public.lyric_words from authenticated;
revoke all on public.markers from authenticated;
revoke all on public.annotations from authenticated;
revoke all on public.audio_references from authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.songs to authenticated;
grant select, insert, update, delete on public.lyric_lines to authenticated;
grant select, insert, update, delete on public.lyric_words to authenticated;
grant select, insert, update, delete on public.markers to authenticated;
grant select, insert, update, delete on public.annotations to authenticated;
grant select, insert, update, delete on public.audio_references to authenticated;

drop policy if exists "Users can insert their lyric lines" on public.lyric_lines;
drop policy if exists "Users can update their lyric lines" on public.lyric_lines;

create policy "Users can insert their lyric lines"
on public.lyric_lines for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.songs s
    where s.id = lyric_lines.song_id
      and s.user_id = (select auth.uid())
  )
);

create policy "Users can update their lyric lines"
on public.lyric_lines for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.songs s
    where s.id = lyric_lines.song_id
      and s.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert their lyric words" on public.lyric_words;
drop policy if exists "Users can update their lyric words" on public.lyric_words;

create policy "Users can insert their lyric words"
on public.lyric_words for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.lyric_lines l
    where l.id = lyric_words.line_id
      and l.song_id = lyric_words.song_id
      and l.user_id = (select auth.uid())
  )
);

create policy "Users can update their lyric words"
on public.lyric_words for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.lyric_lines l
    where l.id = lyric_words.line_id
      and l.song_id = lyric_words.song_id
      and l.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert their annotations" on public.annotations;
drop policy if exists "Users can update their annotations" on public.annotations;

create policy "Users can insert their annotations"
on public.annotations for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.songs s
    where s.id = annotations.song_id
      and s.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.markers m
    where m.id = annotations.marker_id
      and (m.is_system or m.user_id = (select auth.uid()))
  )
  and (
    (
      target_type = 'line'
      and word_id is null
      and line_id is not null
      and exists (
        select 1
        from public.lyric_lines l
        where l.id = annotations.line_id
          and l.song_id = annotations.song_id
          and l.user_id = (select auth.uid())
      )
    )
    or
    (
      target_type = 'word'
      and word_id is not null
      and line_id is not null
      and exists (
        select 1
        from public.lyric_words w
        where w.id = annotations.word_id
          and w.line_id = annotations.line_id
          and w.song_id = annotations.song_id
          and w.user_id = (select auth.uid())
      )
    )
  )
);

create policy "Users can update their annotations"
on public.annotations for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.songs s
    where s.id = annotations.song_id
      and s.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.markers m
    where m.id = annotations.marker_id
      and (m.is_system or m.user_id = (select auth.uid()))
  )
  and (
    (
      target_type = 'line'
      and word_id is null
      and line_id is not null
      and exists (
        select 1
        from public.lyric_lines l
        where l.id = annotations.line_id
          and l.song_id = annotations.song_id
          and l.user_id = (select auth.uid())
      )
    )
    or
    (
      target_type = 'word'
      and word_id is not null
      and line_id is not null
      and exists (
        select 1
        from public.lyric_words w
        where w.id = annotations.word_id
          and w.line_id = annotations.line_id
          and w.song_id = annotations.song_id
          and w.user_id = (select auth.uid())
      )
    )
  )
);

drop policy if exists "Users can insert their audio references" on public.audio_references;
drop policy if exists "Users can update their audio references" on public.audio_references;

create policy "Users can insert their audio references"
on public.audio_references for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and storage_path like ((select auth.uid())::text || '/%')
  and exists (
    select 1
    from public.songs s
    where s.id = audio_references.song_id
      and s.user_id = (select auth.uid())
  )
  and (
    target_type = 'song'
    or (
      target_type = 'line'
      and line_id is not null
      and word_id is null
      and exists (
        select 1
        from public.lyric_lines l
        where l.id = audio_references.line_id
          and l.song_id = audio_references.song_id
          and l.user_id = (select auth.uid())
      )
    )
    or (
      target_type = 'word'
      and line_id is not null
      and word_id is not null
      and exists (
        select 1
        from public.lyric_words w
        where w.id = audio_references.word_id
          and w.line_id = audio_references.line_id
          and w.song_id = audio_references.song_id
          and w.user_id = (select auth.uid())
      )
    )
  )
);

create policy "Users can update their audio references"
on public.audio_references for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and storage_path like ((select auth.uid())::text || '/%')
  and exists (
    select 1
    from public.songs s
    where s.id = audio_references.song_id
      and s.user_id = (select auth.uid())
  )
  and (
    target_type = 'song'
    or (
      target_type = 'line'
      and line_id is not null
      and word_id is null
      and exists (
        select 1
        from public.lyric_lines l
        where l.id = audio_references.line_id
          and l.song_id = audio_references.song_id
          and l.user_id = (select auth.uid())
      )
    )
    or (
      target_type = 'word'
      and line_id is not null
      and word_id is not null
      and exists (
        select 1
        from public.lyric_words w
        where w.id = audio_references.word_id
          and w.line_id = audio_references.line_id
          and w.song_id = audio_references.song_id
          and w.user_id = (select auth.uid())
      )
    )
  )
);
