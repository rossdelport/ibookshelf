import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import {
  BellIcon, ChevronIcon, CommentIcon, DotsIcon, HeartIcon, ListIcon,
  PhotoIcon, QuoteIcon, SearchIcon, ShareIcon,
} from '../../components/icons';

// ── Design tokens (DESIGN.md) ──────────────────────────────────────────────
const INK   = '#332C24';
const MUTE  = '#A89A88';
const BROWN = '#8B5E3C';
const WHITE = '#FFFFFF';
const GREEN = '#5BA66E';
const LIKE  = '#E0506B';

// ── Assets ──────────────────────────────────────────────────────────────────
const AV = {
  me:    require('../../assets/images/av_me.png'),
  maya:  require('../../assets/images/av_maya.png'),
  theo:  require('../../assets/images/av_theo.png'),
  priya: require('../../assets/images/av_priya.png'),
  noor:  require('../../assets/images/av_noor.png'),
  sam:   require('../../assets/images/av_sam.png'),
  leo:   require('../../assets/images/av_leo.png'),
};
const BK = {
  acotar:   require('../../assets/images/bk_acotar.png'),
  ironflame:require('../../assets/images/bk_ironflame.png'),
  babel:    require('../../assets/images/bk_babel.png'),
  cover:    require('../../assets/images/cover.png'),
};

// ── Star rating (supports halves) ──────────────────────────────────────────
const STAR_D = 'M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.6 9.3l5.8-.8L12 3.2Z';
function Stars({ score }: { score: number }) {
  return (
    <View style={cm.stars}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, score - (i - 1))) * 100;
        const id = `star-${i}-${score}`;
        return (
          <Svg key={i} width={15} height={15} viewBox="0 0 24 24">
            <Defs>
              <SvgGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <Stop offset={`${fillPct}%`} stopColor="#E8A838" />
                <Stop offset={`${fillPct}%`} stopColor="#E4D7C2" />
              </SvgGradient>
            </Defs>
            <Path d={STAR_D} fill={`url(#${id})`} />
          </Svg>
        );
      })}
    </View>
  );
}

// ── Avatar + soul badge ─────────────────────────────────────────────────────
function Ava({ src, soul, size = 42 }: { src: ImageSourcePropType; soul: string; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Image source={src} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: WHITE }} resizeMode="cover" />
      <View style={cm.postSoul}><Text style={cm.postSoulEmoji}>{soul}</Text></View>
    </View>
  );
}

function PostHead({ src, soul, name, sub }: { src: ImageSourcePropType; soul: string; name: string; sub: string }) {
  return (
    <View style={cm.postHead}>
      <Ava src={src} soul={soul} />
      <View style={cm.postId}>
        <Text style={cm.postName}>{name}</Text>
        <Text style={cm.postSub}>{sub}</Text>
      </View>
      <TouchableOpacity style={cm.postMore} activeOpacity={0.6}><DotsIcon color="#C3B7A4" /></TouchableOpacity>
    </View>
  );
}

function Actions({ likes, comments, liked }: { likes: number; comments: number; liked?: boolean }) {
  const [on, setOn] = useState(!!liked);
  const n = likes + (on && !liked ? 1 : 0) - (!on && liked ? 1 : 0);
  return (
    <View style={cm.postActions}>
      <TouchableOpacity style={cm.pa} onPress={() => setOn((o) => !o)} activeOpacity={0.7}>
        <HeartIcon color={on ? LIKE : '#7C7264'} size={19} fill={on ? LIKE : 'none'} />
        <Text style={[cm.paText, on && { color: LIKE }]}>{n}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={cm.pa} activeOpacity={0.7}>
        <CommentIcon color="#7C7264" size={19} />
        <Text style={cm.paText}>{comments}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[cm.pa, { marginLeft: 'auto' }]} activeOpacity={0.7}>
        <ShareIcon color="#7C7264" size={19} />
      </TouchableOpacity>
    </View>
  );
}

function BookChip({ cover, title, author, milestone }: { cover: ImageSourcePropType; title: string; author: string; milestone?: string }) {
  return (
    <View style={cm.bookChip}>
      <Image source={cover} style={cm.bookChipImg} resizeMode="cover" />
      <View style={{ flex: 1 }}>
        <Text style={cm.bookChipTitle}>{title}</Text>
        <Text style={cm.bookChipAuthor}>{author}</Text>
        {milestone && <Text style={cm.milestone}>{milestone}</Text>}
      </View>
    </View>
  );
}

// ── Feed posts ──────────────────────────────────────────────────────────────
function ReviewPost() {
  return (
    <View style={cm.post}>
      <PostHead src={AV.maya} soul="🦉" name="Maya" sub="🦉 Owl · reviewed · 3h" />
      <View style={cm.starsRow}><Stars score={4.5} /><Text style={cm.score}>4.5</Text></View>
      <Text style={cm.postText}>Yarros did <Text style={cm.em}>not</Text> have to end it like that. The last 50 pages had me pacing my kitchen at 2am. Violet's arc this book? Devastating in the best way.</Text>
      <BookChip cover={BK.ironflame} title="Iron Flame" author="Rebecca Yarros" />
      <Actions likes={142} comments={28} />
    </View>
  );
}

function ClubPost() {
  return (
    <LinearGradient colors={['#FFFDF8', '#FBF4E7']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[cm.post, cm.postClub]}>
      <View style={cm.clubTagWrap}><Text style={cm.clubTag}>💬 Chapter 14 · Discussion Room</Text></View>
      <View style={cm.clubPromptClub}>
        <Image source={BK.acotar} style={cm.clubPromptImg} resizeMode="cover" />
        <View>
          <Text style={cm.postName}>Romantasy & Coffee</Text>
          <Text style={cm.postSub}>moderated by @chamberofbooks</Text>
        </View>
      </View>
      <Text style={cm.postText}>Spoiler-free until ch. 14 → Was Feyre right to keep the bargain a secret? Drop your hot takes ☕️</Text>
      <View style={cm.clubFoot}>
        <View style={cm.avaStack}>
          <Image source={AV.sam} style={[cm.avaStackImg, { marginLeft: 0 }]} resizeMode="cover" />
          <Image source={AV.leo} style={cm.avaStackImg} resizeMode="cover" />
          <Image source={AV.maya} style={cm.avaStackImg} resizeMode="cover" />
          <Text style={cm.avaStackN}>+18 replied</Text>
        </View>
        <TouchableOpacity style={cm.clubJoinDisc} activeOpacity={0.85}>
          <Text style={cm.clubJoinDiscText}>Join discussion</Text>
          <ChevronIcon color={WHITE} size={16} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function QuotePost() {
  return (
    <View style={cm.post}>
      <PostHead src={AV.priya} soul="🐉" name="Priya" sub="🐉 Dragon · shared a highlight · 1d" />
      <LinearGradient colors={['#FBF3E3', '#F6E9D2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cm.quoteCard}>
        <View style={cm.quoteMark}><QuoteIcon color="rgba(139,94,60,0.35)" size={18} /></View>
        <Text style={cm.quoteText}>"Don't feel bad for one moment about doing what brings you joy."</Text>
        <Text style={cm.quoteSrc}>A Court of Thorns and Roses · p. 124</Text>
      </LinearGradient>
      <Actions likes={210} comments={16} />
    </View>
  );
}

function UpdatePost() {
  return (
    <View style={cm.post}>
      <PostHead src={AV.theo} soul="🦌" name="Theo" sub="🦌 Deer · finished a book · 5h" />
      <Text style={cm.postText}>Closed the back cover on <Text style={cm.em}>Babel</Text> and just sat in silence for ten minutes. A book about the violence of translation that broke my whole heart.</Text>
      <BookChip cover={BK.babel} title="Babel" author="R. F. Kuang" milestone="📖 Book 12 of his 2026 goal" />
      <Actions likes={64} comments={9} liked />
    </View>
  );
}

function ListPost() {
  const covers = [BK.acotar, BK.ironflame, BK.cover, BK.babel];
  return (
    <View style={cm.post}>
      <PostHead src={AV.noor} soul="🦊" name="Noor" sub="🦊 Fox · made a list · 1d" />
      <Text style={cm.listTitle}>Romantasy that wrecked me (in order of damage) 🐉</Text>
      <View style={cm.listCovers}>
        {covers.map((c, i) => (
          <Image key={i} source={c} style={[cm.listCover, { marginLeft: i === 0 ? 0 : -12, zIndex: covers.length - i }]} resizeMode="cover" />
        ))}
        <Text style={cm.listMore}>+5</Text>
      </View>
      <Actions likes={88} comments={12} />
    </View>
  );
}

// ── Clubs view ──────────────────────────────────────────────────────────────
function YourClub({ cover, name, mod, members, reading }: { cover: ImageSourcePropType; name: string; mod: string; members: string; reading: string }) {
  return (
    <TouchableOpacity style={cm.clubCard} activeOpacity={0.85}>
      <Image source={cover} style={cm.clubCover} resizeMode="cover" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={cm.postName}>{name}</Text>
        <Text style={cm.postSub}>{mod}</Text>
        <View style={cm.clubStats}>
          <View style={cm.clubLive}><View style={cm.clubDot} /><Text style={cm.clubLiveText}>{reading} reading now</Text></View>
          <Text style={cm.clubMembers}>{members}</Text>
        </View>
      </View>
      <ChevronIcon color="#C3B7A4" size={18} />
    </TouchableOpacity>
  );
}

function DiscoverClub({ emoji, name, genre, members, color }: { emoji: string; name: string; genre: string; members: string; color: string }) {
  const [joined, setJoined] = useState(false);
  return (
    <View style={cm.discRow}>
      <View style={[cm.discEmoji, { backgroundColor: color }]}><Text style={cm.discEmojiText}>{emoji}</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={cm.postName}>{name}</Text>
        <Text style={cm.postSub}>{genre} · {members} members</Text>
      </View>
      <TouchableOpacity style={[cm.discJoin, joined && cm.discJoinOn]} onPress={() => setJoined((j) => !j)} activeOpacity={0.85}>
        <Text style={[cm.discJoinText, joined && cm.discJoinTextOn]}>{joined ? 'Joined ✓' : 'Join'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'foryou' | 'clubs'>('foryou');

  return (
    <LinearGradient colors={['#FAF8F3', '#F3ECDF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={cm.fill}>
      {/* ── Topbar ───────────────────────────────────── */}
      <View style={[cm.topbar, { paddingTop: insets.top + 4 }]}>
        <View style={cm.avatarWrap}>
          <Image source={AV.me} style={cm.avatar} resizeMode="cover" />
          <View style={cm.soul}><Text style={cm.soulEmoji}>🦊</Text></View>
        </View>
        <Text style={cm.commTitle}>Community</Text>
        <View style={cm.topActions}>
          <TouchableOpacity style={cm.iconBtn} activeOpacity={0.7}><SearchIcon color={INK} /></TouchableOpacity>
          <TouchableOpacity style={cm.iconBtn} activeOpacity={0.7}><BellIcon color={INK} /><View style={cm.bellDot} /></TouchableOpacity>
        </View>
      </View>

      {/* ── Segmented control ────────────────────────── */}
      <View style={cm.seg}>
        <TouchableOpacity style={[cm.segBtn, tab === 'foryou' && cm.segBtnOn]} onPress={() => setTab('foryou')} activeOpacity={0.8}>
          <Text style={[cm.segLabel, tab === 'foryou' && cm.segLabelOn]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[cm.segBtn, tab === 'clubs' && cm.segBtnOn]} onPress={() => setTab('clubs')} activeOpacity={0.8}>
          <Text style={[cm.segLabel, tab === 'clubs' && cm.segLabelOn]}>Clubs</Text>
        </TouchableOpacity>
      </View>

      {/* ── Body ─────────────────────────────────────── */}
      <ScrollView
        style={cm.body}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'foryou' ? (
          <>
            {/* Composer */}
            <View style={cm.composer}>
              <Image source={AV.me} style={cm.composerAv} resizeMode="cover" />
              <Text style={cm.composerInput}>Share a thought…</Text>
              <View style={cm.composerTools}>
                <View style={cm.composerTool}><QuoteIcon color={BROWN} size={18} /></View>
                <View style={cm.composerTool}><PhotoIcon color={BROWN} size={18} /></View>
                <View style={cm.composerTool}><ListIcon color={BROWN} size={18} /></View>
              </View>
            </View>

            {/* Feed */}
            <View style={cm.feed}>
              <ReviewPost />
              <ClubPost />
              <QuotePost />
              <UpdatePost />
              <ListPost />
            </View>
          </>
        ) : (
          <View>
            <Text style={cm.secTitle}>Your clubs</Text>
            <View style={cm.clubList}>
              <YourClub cover={BK.acotar} name="Romantasy & Coffee" mod="@chamberofbooks · you + 4.2k" members="4.2k" reading="38" />
              <YourClub cover={BK.babel} name="The Sci-Fi & Fantasy Salon" mod="@nebula.reads · you + 2.1k" members="2.1k" reading="12" />
            </View>

            <Text style={[cm.secTitle, { marginTop: 26 }]}>Discover clubs</Text>
            <View style={cm.discList}>
              <DiscoverClub emoji="🐉" name="Dragons & Daggers" genre="Romantasy" members="6.1k" color="#5A2A38" />
              <DiscoverClub emoji="🕯️" name="Slow Burn Society" genre="Literary fiction" members="3.4k" color="#3A4A60" />
              <DiscoverClub emoji="🌙" name="Sapphic Lit Club" genre="Queer romance" members="2.8k" color="#4A3A5E" />
              <DiscoverClub emoji="☕️" name="Cozy Mystery Nook" genre="Mystery" members="1.9k" color="#2E4A3E" />
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const cm = StyleSheet.create({
  fill: { flex: 1 },

  // ── Topbar
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4 },
  avatarWrap: { width: 46, height: 46 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: WHITE, shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  soul: { position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  soulEmoji: { fontSize: 12 },
  commTitle: { fontSize: 17, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.14)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 1 },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8A838', borderWidth: 1.5, borderColor: WHITE },

  // ── Segmented control
  seg: { flexDirection: 'row', gap: 4, marginHorizontal: 20, marginTop: 12, padding: 4, backgroundColor: '#EFE6D6', borderRadius: 999 },
  segBtn: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: INK, shadowColor: '#332C24', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 3 },
  segLabel: { fontSize: 14, fontWeight: '800', color: BROWN },
  segLabelOn: { color: WHITE },

  // ── Body
  body: { flex: 1 },

  // ── Composer
  composer: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: WHITE, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  composerAv: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: WHITE },
  composerInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#B3A693' },
  composerTools: { flexDirection: 'row', gap: 4 },
  composerTool: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F6EFE2', alignItems: 'center', justifyContent: 'center' },

  // ── Feed / post
  feed: { gap: 14, marginTop: 14 },
  post: { backgroundColor: WHITE, borderRadius: 20, padding: 16, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 },

  postHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  postSoul: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 3, elevation: 2 },
  postSoulEmoji: { fontSize: 11 },
  postId: { flex: 1, minWidth: 0 },
  postName: { fontSize: 14.5, fontWeight: '800', color: INK },
  postSub: { fontSize: 12, fontWeight: '600', color: MUTE, marginTop: 1 },
  postMore: { padding: 4 },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  stars: { flexDirection: 'row', gap: 2 },
  score: { fontSize: 13, fontWeight: '800', color: '#C99A4C' },

  postText: { marginTop: 11, fontSize: 14.5, lineHeight: 22, fontWeight: '500', color: '#463E33' },
  em: { fontStyle: 'italic', color: BROWN },

  // ── Book chip
  bookChip: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 13, padding: 11, backgroundColor: '#FAF6EE', borderRadius: 13, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.10)' },
  bookChipImg: { width: 44, height: 66, borderRadius: 4, shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.22, shadowRadius: 9 },
  bookChipTitle: { fontSize: 14.5, fontWeight: '800', color: INK },
  bookChipAuthor: { fontSize: 12.5, fontWeight: '600', color: MUTE, fontFamily: 'Georgia', fontStyle: 'italic' },
  milestone: { alignSelf: 'flex-start', marginTop: 6, fontSize: 11, fontWeight: '800', color: '#C99A4C', backgroundColor: '#FBF1DC', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },

  // ── Quote card
  quoteCard: { marginTop: 13, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 14, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)' },
  quoteMark: { position: 'absolute', top: 12, left: 13 },
  quoteText: { marginTop: 6, fontFamily: 'Georgia', fontSize: 18, fontStyle: 'italic', lineHeight: 26, color: '#50402C' },
  quoteSrc: { marginTop: 10, fontSize: 11.5, fontWeight: '700', color: '#B08A52', letterSpacing: 0.2 },

  // ── List
  listTitle: { marginTop: 12, fontSize: 15, fontWeight: '800', color: INK },
  listCovers: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  listCover: { width: 50, height: 75, borderRadius: 4, borderWidth: 2, borderColor: WHITE, shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.28, shadowRadius: 8 },
  listMore: { marginLeft: 12, fontSize: 13, fontWeight: '800', color: BROWN },

  // ── Club discussion post
  postClub: { borderColor: 'rgba(201,154,76,0.28)' },
  clubTagWrap: { marginBottom: 12, alignSelf: 'flex-start' },
  clubTag: { fontSize: 11.5, fontWeight: '800', color: WHITE, backgroundColor: '#C99A4C', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, overflow: 'hidden' },
  clubPromptClub: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clubPromptImg: { width: 36, height: 52, borderRadius: 4, shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.24, shadowRadius: 7 },
  clubFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  avaStack: { flexDirection: 'row', alignItems: 'center' },
  avaStackImg: { width: 28, height: 28, borderRadius: 14, marginLeft: -8, borderWidth: 2, borderColor: '#FFFDF8' },
  avaStackN: { marginLeft: 10, fontSize: 12.5, fontWeight: '700', color: BROWN },
  clubJoinDisc: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: INK, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  clubJoinDiscText: { color: WHITE, fontSize: 13, fontWeight: '800' },

  // ── Post actions
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 14, paddingTop: 13, borderTopWidth: 0.5, borderTopColor: 'rgba(139,94,60,0.10)' },
  pa: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  paText: { fontSize: 13.5, fontWeight: '700', color: '#7C7264' },

  // ── Clubs view
  secTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: '#B08A52', marginBottom: 12, marginLeft: 2 },
  clubList: { gap: 12 },
  clubCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 18, padding: 13, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 },
  clubCover: { width: 52, height: 78, borderRadius: 5, shadowColor: '#5A3C23', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.26, shadowRadius: 10 },
  clubStats: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  clubLive: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clubDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: GREEN },
  clubLiveText: { fontSize: 12, fontWeight: '800', color: GREEN },
  clubMembers: { fontSize: 12, fontWeight: '700', color: MUTE },

  discList: { gap: 10 },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: WHITE, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 13, borderWidth: 0.5, borderColor: 'rgba(139,94,60,0.12)', shadowColor: '#8B5E3C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  discEmoji: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  discEmojiText: { fontSize: 23 },
  discJoin: { borderWidth: 1.5, borderColor: 'rgba(139,94,60,0.22)', backgroundColor: WHITE, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  discJoinOn: { backgroundColor: INK, borderColor: INK },
  discJoinText: { fontSize: 13, fontWeight: '800', color: BROWN },
  discJoinTextOn: { color: WHITE },
});
