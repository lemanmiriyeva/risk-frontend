"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Autocomplete, Avatar, Box, Chip, Popover, Skeleton, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {useSnackbar} from "notistack";
import {BRAND, C} from "@/components/theme/tokens";
import {EmptyState, fieldSx, initials, pageWrapSx, panelSx} from "@/components/atoms/bulletin/bulletinShared";

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

function birthdayText(iso) {
    if (!iso) return null;
    const [, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;   // yaş/il göstərilmir
}

/** Axtarış üçün normallaşdırma: kiçik hərf, azərbaycan hərfləri və diakritiklər sadələşdirilir. */
function norm(s) {
    return (s || '').toString().toLowerCase()
        .replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/i̇/g, 'i');
}

function PersonAvatar({user, size}) {
    return (
        <Avatar src={user.image || undefined} alt={user.name}
                sx={{width: size, height: size, fontSize: size / 2.6, fontWeight: 700,
                    color: BRAND.navy900, backgroundColor: '#E6ECF6'}}>
            {initials(user.name)}
        </Avatar>
    );
}

function InfoRow({icon: Icon, label, children}) {
    return (
        <Box sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1}}>
            <Icon sx={{fontSize: 19, color: C.inkFaint, mt: '2px'}}/>
            <Box sx={{minWidth: 0}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, lineHeight: 1.2}}>{label}</Typography>
                <Typography sx={{fontSize: 14, color: C.ink, wordBreak: 'break-word'}}>{children}</Typography>
            </Box>
        </Box>
    );
}

function ProfileCard({user, department}) {
    if (!user) {
        return (
            <Box sx={{...panelSx, p: 3, textAlign: 'center'}}>
                <Typography sx={{fontSize: 14, color: C.inkMuted}}>Məlumatına baxmaq üçün əməkdaşın adına klikləyin.</Typography>
            </Box>
        );
    }
    const bday = birthdayText(user.birth_date);
    return (
        <Box sx={{...panelSx, overflow: 'hidden'}}>
            <Box sx={{height: 64, background: `linear-gradient(100deg, ${BRAND.navy950}, ${BRAND.navy700})`}}/>
            <Box sx={{px: 3, pb: 3, mt: '-40px'}}>
                <Box sx={{border: '4px solid #fff', borderRadius: '50%', width: 104, height: 104, backgroundColor: '#fff', overflow: 'hidden'}}>
                    <PersonAvatar user={user} size={96}/>
                </Box>
                <Typography sx={{fontSize: 19, fontWeight: 700, color: BRAND.navy900, mt: 1.5, lineHeight: 1.25}}>{user.name}</Typography>
                {user.position && <Typography sx={{fontSize: 14, color: C.inkMuted, mt: 0.25}}>{user.position}</Typography>}
                <Box sx={{mt: 1.5, borderTop: `1px solid ${C.line}`}}>
                    {department && <InfoRow icon={ApartmentOutlinedIcon} label="Şöbə">{department.title}</InfoRow>}
                    <InfoRow icon={MailOutlineIcon} label="Korporativ e-poçt">
                        <Box component="a" href={`mailto:${user.email}`} sx={{color: BRAND.navy600, textDecoration: 'none'}}>{user.email}</Box>
                    </InfoRow>
                    <InfoRow icon={LocalPhoneOutlinedIcon} label="İş nömrəsi (daxili)">{user.work_phone || '—'}</InfoRow>
                    <InfoRow icon={CakeOutlinedIcon} label="Doğum günü">{bday || '—'}</InfoRow>
                </Box>
            </Box>
        </Box>
    );
}

function pathTo(departments, depId) {
    const map = Object.fromEntries(departments.map((d) => [d.id, d]));
    const out = [];
    let cur = map[depId];
    while (cur) { out.unshift(cur); cur = cur.parent ? map[cur.parent] : null; }
    return out;
}

const LINE = '1.5px solid #8C9BB5';
const LEVEL_COLORS = ['#0B2A5B', '#0A6CC2', '#1F7A4D', '#6B4FB5', '#C99A1E'];
const STEM = 26;                      // şaquli qolun hündürlüyü

// Üzdən-aşağı ağacın xətləri: valideyn -> uşaqlar arasında yuvarlaq künclü "şana" xətti
const treeSx = {
    '& ul': {listStyle: 'none', m: 0, p: 0, pt: `${STEM}px`, display: 'flex', justifyContent: 'center', position: 'relative'},
    '& ul::before': {content: '""', position: 'absolute', top: 0, left: '50%', height: `${STEM}px`, borderLeft: LINE},
    '& li': {position: 'relative', pt: `${STEM}px`, px: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center'},
    '& li::before, & li::after': {content: '""', position: 'absolute', top: 0, right: '50%', width: '50%', height: `${STEM}px`, borderTop: LINE},
    '& li::after': {right: 'auto', left: '50%', borderLeft: LINE},
    '& li:only-child': {pt: 0},
    '& li:only-child::before, & li:only-child::after': {display: 'none'},
    '& li:first-of-type::before, & li:last-of-type::after': {border: 'none'},
    '& li:last-of-type::before': {borderRight: LINE, borderRadius: '0 12px 0 0'},
    '& li:first-of-type::after': {borderRadius: '12px 0 0 0'},
    '& > ul': {pt: 0},
    '& > ul::before': {display: 'none'},
    '& > ul > li': {pt: 0},
    '& > ul > li::before, & > ul > li::after': {display: 'none'},
};

export default function StructurePage() {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [orgId, setOrgId] = useState('');
    const [open, setOpen] = useState(() => new Set());
    const [popUserId, setPopUserId] = useState(null);
    const [anchor, setAnchor] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const nodeRefs = useRef({});

    // Sxemi səhifəyə sığdırmaq: ölçülər ölçülür, "auto" rejimində miqyas avtomatik seçilir
    const boxRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [auto, setAuto] = useState(true);
    const [size, setSize] = useState({w: 0, h: 0});
    const MIN_SCALE = 0.3;

    const fit = useCallback(() => {
        const box = boxRef.current;
        const el = contentRef.current;
        if (!box || !el) return;
        const cw = el.offsetWidth;
        const ch = el.offsetHeight;
        setSize({w: cw, h: ch});
        if (!auto || !cw || !ch) return;
        const k = Math.min(1, (box.clientWidth - 48) / cw, (box.clientHeight - 48) / ch);
        setScale(Math.max(MIN_SCALE, Math.round(k * 100) / 100));
    }, [auto]);

    useEffect(() => {
        fit();
        const ro = new ResizeObserver(fit);
        if (boxRef.current) ro.observe(boxRef.current);
        if (contentRef.current) ro.observe(contentRef.current);
        return () => ro.disconnect();
    }, [fit, data, open]);

    const zoom = (delta) => { setAuto(false); setScale((k) => Math.min(1.6, Math.max(MIN_SCALE, Math.round((k + delta) * 100) / 100))); };

    const load = useCallback(async (organization) => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.STRUCTURE.LIST + (organization ? `?organization=${organization}` : ''));
            const d = res.data;
            setData(d);
            setOrgId(d.organization?.id || '');
            // Standart: giriş edənin şöbəsinə gedən yol və şöbənin özü açıq gəlir
            const mine = d.users.find((u) => u.id === d.me.user_id);
            const depId = mine?.department ?? d.me.department_id;
            setOpen(new Set(depId ? pathTo(d.departments, depId).map((x) => x.id) : d.departments.filter((x) => !x.parent).map((x) => x.id)));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setData({departments: [], users: [], organizations: [], me: {}});
        }
    }, [enqueueSnackbar]);

    useEffect(() => { load(); }, [load]);

    const deptById = useMemo(() => Object.fromEntries((data?.departments || []).map((d) => [d.id, d])), [data]);
    const userById = useMemo(() => Object.fromEntries((data?.users || []).map((u) => [u.id, u])), [data]);

    const tree = useMemo(() => {
        if (!data) return {roots: [], children: {}, users: {}, counts: {}};
        const ids = new Set(data.departments.map((d) => d.id));
        const children = {};
        const roots = [];
        data.departments.forEach((d) => {
            if (d.parent && ids.has(d.parent)) (children[d.parent] ||= []).push(d);
            else roots.push(d);
        });
        const users = {};
        data.users.forEach((u) => { (users[u.department ?? 0] ||= []).push(u); });   // artıq vəzifə sırası ilə gəlir
        const counts = {};
        const count = (d) => {
            counts[d.id] = (users[d.id] || []).length + (children[d.id] || []).reduce((sum, c) => sum + count(c), 0);
            return counts[d.id];
        };
        roots.forEach(count);
        return {roots, children, users, counts};
    }, [data]);

    const toggle = (id) => setOpen((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
    });
    const expandAll = () => setOpen(new Set([0, ...(data?.departments || []).map((d) => d.id)]));
    const collapseAll = () => setOpen(new Set());

    const openPerson = (u) => { setPopUserId(u.id); setAnchor(nodeRefs.current[u.id] || null); };

    const choose = (u) => {
        if (!u) return;
        const ids = u.department ? pathTo(data.departments, u.department).map((d) => d.id) : [0];
        setOpen((prev) => new Set([...prev, ...ids]));
        setTimeout(() => {
            const el = nodeRefs.current[u.id];
            el?.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
            setPopUserId(u.id);
            setAnchor(el || null);
        }, 300);
    };

    const memberChip = (u) => {
        const isMe = u.id === data.me.user_id;
        return (
            <Box key={u.id} ref={(el) => { nodeRefs.current[u.id] = el; }} role="button" tabIndex={0} onClick={() => openPerson(u)}
                 onKeyDown={(e) => { if (e.key === 'Enter') openPerson(u); }}
                 sx={{width: 92, textAlign: 'center', cursor: 'pointer', p: '8px 4px', borderRadius: '12px', position: 'relative',
                     backgroundColor: popUserId === u.id ? `${BRAND.navy600}14` : 'transparent', transition: 'background-color .15s, transform .15s',
                     '&:hover': {backgroundColor: `${BRAND.navy600}14`, transform: 'translateY(-2px)'}}}>
                <Box sx={{display: 'inline-flex', p: '2px', borderRadius: '50%', border: `2px solid ${isMe ? '#C99A1E' : 'transparent'}`}}>
                    <PersonAvatar user={u} size={46}/>
                </Box>
                <Typography sx={{fontSize: 11.5, fontWeight: 650, color: C.ink, lineHeight: 1.2, mt: 0.5}}>{u.name}</Typography>
                <Typography sx={{fontSize: 10.5, color: C.inkMuted, lineHeight: 1.2, mt: '2px'}}>{u.position || '—'}</Typography>
                {isMe && <Box sx={{position: 'absolute', top: 4, right: 6, fontSize: 9, fontWeight: 800, color: '#fff',
                    backgroundColor: '#C99A1E', borderRadius: '6px', px: '5px'}}>SİZ</Box>}
            </Box>
        );
    };

    const renderNode = (dept, level = 0) => {
        const isOpen = open.has(dept.id);
        const members = tree.users[dept.id] || [];
        const subs = tree.children[dept.id] || [];
        const hasKids = members.length + subs.length > 0;
        const color = LEVEL_COLORS[level % LEVEL_COLORS.length];
        const mine = dept.id === data?.me?.department_id;
        return (
            <li key={dept.id}>
                <Box role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => hasKids && toggle(dept.id)}
                     onKeyDown={(e) => { if (e.key === 'Enter' && hasKids) toggle(dept.id); }}
                     sx={{width: 208, textAlign: 'center', borderRadius: '14px', backgroundColor: C.surface, overflow: 'hidden', cursor: hasKids ? 'pointer' : 'default',
                         border: `1.5px solid ${isOpen || mine ? color : C.line}`, boxShadow: isOpen ? `0 10px 24px ${color}22` : '0 1px 2px rgba(6,18,38,0.05)',
                         transition: 'box-shadow .2s, border-color .2s', '&:hover': {borderColor: color}}}>
                    <Box sx={{height: 5, backgroundColor: color}}/>
                    <Box sx={{px: 1.5, py: 1.25}}>
                        <Typography sx={{fontSize: 13.5, fontWeight: 700, color: BRAND.navy900, lineHeight: 1.3}}>{dept.title}</Typography>
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mt: 0.5}}>
                            <Typography sx={{fontSize: 11.5, color: C.inkMuted}}>{tree.counts[dept.id] ?? members.length} əməkdaş</Typography>
                            {hasKids && <ExpandMoreIcon sx={{fontSize: 17, color, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none'}}/>}
                        </Box>
                    </Box>
                </Box>

                {isOpen && members.length > 0 && (
                    <>
                        <Box sx={{height: 14, borderLeft: LINE}}/>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px', width: 3 * 96 + 16, maxHeight: 340, overflowY: 'auto',
                            p: '8px', borderRadius: '16px', backgroundColor: '#F3F6FB', border: `1px solid ${C.line}`}}>
                            {members.map(memberChip)}
                        </Box>
                    </>
                )}
                {isOpen && subs.length > 0 && <ul>{subs.map((c) => renderNode(c, level + 1))}</ul>}
            </li>
        );
    };

    const noDept = tree.users[0] || [];
    const rootItems = [...tree.roots, ...(noDept.length ? [{id: 0, title: 'Şöbəsiz əməkdaşlar'}] : [])];
    const popUser = popUserId ? userById[popUserId] : null;

    return (
        <Box sx={{...pageWrapSx, maxWidth: '100%', p: {xs: 2, sm: 3, md: 4}}}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2}}>
                <Box>
                    <Typography component="h1" sx={{fontSize: 24, fontWeight: 700, color: BRAND.navy900}}>Təşkilati struktur</Typography>
                    <Typography sx={{fontSize: 14, color: C.inkMuted}}>Şöbənin üzərinə klikləyib açın, əməkdaşın üzərinə klikləyib məlumatına baxın.</Typography>
                </Box>
                {data?.organizations?.length > 1 && (
                    <TextField select size="small" label="Qurum" value={orgId} sx={{...fieldSx, minWidth: 240}}
                               SelectProps={{native: true}} onChange={(e) => { setData(null); load(e.target.value); }}>
                        {data.organizations.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                    </TextField>
                )}
            </Box>

            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, mb: 2}}>
                <Autocomplete
                    options={data?.users || []}
                    value={null}
                    inputValue={inputValue}
                    onInputChange={(_, v, reason) => { if (reason !== 'reset') setInputValue(v); else setInputValue(''); }}
                    onChange={(_, u) => choose(u)}
                    getOptionLabel={(u) => u.name || ''}
                    filterOptions={(opts, {inputValue: q}) => {
                        const needle = norm(q.trim());
                        if (!needle) return [];
                        return opts.filter((u) => norm(u.name).includes(needle) || (u.work_phone || '').includes(needle.replace(/\s/g, ''))).slice(0, 12);
                    }}
                    noOptionsText="Nəticə tapılmadı"
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderOption={(props, u) => {
                        const {key, ...rest} = props;
                        return (
                            <Box component="li" key={u.id} {...rest} sx={{display: 'flex', gap: 1.5, alignItems: 'center'}}>
                                <PersonAvatar user={u} size={32}/>
                                <Box sx={{flex: 1, minWidth: 0}}>
                                    <Typography sx={{fontSize: 14, fontWeight: 600}}>{u.name}</Typography>
                                    <Typography sx={{fontSize: 12, color: C.inkMuted}}>
                                        {[u.position, deptById[u.department]?.title].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                {u.work_phone && <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>☎ {u.work_phone}</Typography>}
                            </Box>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} size="small" placeholder="Ad, soyad və ya daxili nömrə ilə axtarın" sx={{...fieldSx, width: {xs: '100%', sm: 460}}}
                                   InputProps={{...params.InputProps, startAdornment: <SearchIcon sx={{fontSize: 20, color: C.inkFaint, mr: 1}}/>}}/>
                    )}
                />
                <Box sx={{display: 'flex', gap: 1, ml: 'auto', alignItems: 'center'}}>
                    <Box component="button" type="button" aria-label="Kiçilt" onClick={() => zoom(-0.1)} sx={{...toolBtnSx, px: 1.25}}>−</Box>
                    <Typography sx={{fontSize: 12.5, color: C.inkMuted, minWidth: 40, textAlign: 'center'}}>{Math.round(scale * 100)}%</Typography>
                    <Box component="button" type="button" aria-label="Böyüt" onClick={() => zoom(0.1)} sx={{...toolBtnSx, px: 1.25}}>+</Box>
                    <Box component="button" type="button" onClick={() => setAuto(true)} sx={{...toolBtnSx, ...(auto ? {borderColor: BRAND.navy600} : {})}}>Sığdır</Box>
                    <Box component="button" type="button" onClick={expandAll} sx={toolBtnSx}>Hamısını aç</Box>
                    <Box component="button" type="button" onClick={collapseAll} sx={toolBtnSx}>Hamısını bağla</Box>
                </Box>
            </Box>

            <Box ref={boxRef} sx={{...panelSx, p: 3, overflow: 'auto', height: {xs: '70vh', md: 'calc(100vh - 300px)'}, minHeight: 480}}>
                {!data ? <Skeleton variant="rounded" height={300}/> : rootItems.length === 0 ? <EmptyState title="Struktur məlumatı yoxdur"/> : (
                  <Box sx={{width: size.w * scale || 'auto', height: size.h * scale || 'auto', mx: 'auto'}}>
                    <Box ref={contentRef} sx={{...treeSx, width: 'max-content', transform: `scale(${scale})`, transformOrigin: 'top left',
                        display: 'flex', justifyContent: 'center'}}>
                        <ul>
                            <li>
                                <Box sx={{px: 3, py: 1.5, borderRadius: '14px', color: '#fff', textAlign: 'center', maxWidth: 380,
                                    background: `linear-gradient(135deg, ${BRAND.navy950}, ${BRAND.navy700})`, boxShadow: '0 10px 24px rgba(6,18,38,0.18)'}}>
                                    <Typography sx={{fontSize: 10.5, letterSpacing: '0.1em', opacity: 0.7, textTransform: 'uppercase'}}>Qurum</Typography>
                                    <Typography sx={{fontSize: 16, fontWeight: 700, lineHeight: 1.3}}>{data.organization?.title || '—'}</Typography>
                                </Box>
                                <ul>{rootItems.map((d) => renderNode(d, 0))}</ul>
                            </li>
                        </ul>
                    </Box>
                  </Box>
                )}
            </Box>

            <Popover open={!!(popUser && anchor)} anchorEl={anchor} onClose={() => { setPopUserId(null); setAnchor(null); }}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'center'}} transformOrigin={{vertical: 'top', horizontal: 'center'}}
                     slotProps={{paper: {sx: {width: 340, borderRadius: '14px', mt: 1}}}}>
                {popUser && <ProfileCard user={popUser} department={deptById[popUser.department]}/>}
            </Popover>
        </Box>
    );
}

const toolBtnSx = {
    border: `1px solid ${C.lineStrong}`, backgroundColor: C.surface, color: C.ink, borderRadius: '8px', px: 1.5, height: 36,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', '&:hover': {borderColor: BRAND.navy600},
};
