"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Autocomplete, Avatar, Box, Chip, Popover, Skeleton, TextField, Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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

const GAP = 30;                       // düyünlər arası üfüqi məsafə
const LINE = `1.5px solid #8C9BB5`;

// Üfüqi ağacın uşaq sütunu: hər uşaq üçün qol + ortaq şaquli magistral
const childWrapSx = {
    position: 'relative', pl: `${GAP}px`, py: '5px', display: 'flex', alignItems: 'center',
    '&::before': {content: '""', position: 'absolute', left: 0, top: '50%', width: `${GAP}px`, borderTop: LINE},
    '&::after': {content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, borderLeft: LINE},
    '&:first-of-type::after': {top: '50%'},
    '&:last-of-type::after': {bottom: '50%'},
    '&:only-child::after': {display: 'none'},
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

    const personNode = (u) => {
        const isMe = u.id === data.me.user_id;
        return (
            <Box ref={(el) => { nodeRefs.current[u.id] = el; }} role="button" tabIndex={0} onClick={() => openPerson(u)}
                 onKeyDown={(e) => { if (e.key === 'Enter') openPerson(u); }}
                 sx={{display: 'flex', alignItems: 'center', gap: 1.25, pr: 1.75, pl: 0.75, py: 0.75, borderRadius: '999px', cursor: 'pointer',
                     width: 250, backgroundColor: C.surface, border: `1.5px solid ${isMe ? BRAND.navy600 : popUserId === u.id ? BRAND.navy600 : C.line}`,
                     boxShadow: isMe ? `0 0 0 3px ${BRAND.navy600}22` : 'none', transition: 'box-shadow .15s, border-color .15s',
                     '&:hover': {borderColor: BRAND.navy600, boxShadow: '0 6px 16px rgba(6,18,38,0.10)'}}}>
                <PersonAvatar user={u} size={38}/>
                <Box sx={{minWidth: 0, flex: 1}}>
                    <Typography noWrap sx={{fontSize: 13, fontWeight: 650, color: C.ink, lineHeight: 1.25}}>
                        {u.name}{isMe && <Box component="span" sx={{ml: 0.75, fontSize: 10, fontWeight: 800, color: BRAND.navy600}}>SİZ</Box>}
                    </Typography>
                    <Typography noWrap sx={{fontSize: 11.5, color: C.inkMuted, lineHeight: 1.25}}>{u.position || '—'}</Typography>
                </Box>
            </Box>
        );
    };

    const renderDept = (dept) => {
        const isOpen = open.has(dept.id);
        const members = tree.users[dept.id] || [];
        const subs = tree.children[dept.id] || [];
        const hasKids = members.length + subs.length > 0;
        return (
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Box role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => hasKids && toggle(dept.id)}
                     onKeyDown={(e) => { if (e.key === 'Enter' && hasKids) toggle(dept.id); }}
                     sx={{display: 'flex', alignItems: 'center', gap: 1, width: 230, px: 1.5, py: 1.1, borderRadius: '10px', flexShrink: 0,
                         cursor: hasKids ? 'pointer' : 'default', backgroundColor: isOpen ? BRAND.navy900 : C.surface,
                         color: isOpen ? '#fff' : BRAND.navy900, border: `1.5px solid ${BRAND.navy900}`,
                         '&:hover': {boxShadow: '0 6px 16px rgba(6,18,38,0.14)'}}}>
                    <Typography sx={{fontSize: 13.5, fontWeight: 700, flex: 1, lineHeight: 1.3}}>{dept.title}</Typography>
                    <Box sx={{fontSize: 11.5, fontWeight: 700, px: 0.9, borderRadius: '8px', backgroundColor: isOpen ? 'rgba(255,255,255,0.2)' : `${BRAND.navy900}14`}}>
                        {tree.counts[dept.id] ?? members.length}
                    </Box>
                    {hasKids && <ChevronRightIcon sx={{fontSize: 18, transition: 'transform .2s', transform: isOpen ? 'rotate(90deg)' : 'none'}}/>}
                </Box>
                {isOpen && hasKids && (
                    <>
                        <Box sx={{width: `${GAP}px`, borderTop: LINE, flexShrink: 0}}/>
                        <Box sx={{display: 'flex', flexDirection: 'column'}}>
                            {members.map((u) => <Box key={`u${u.id}`} sx={childWrapSx}>{personNode(u)}</Box>)}
                            {subs.map((c) => <Box key={`d${c.id}`} sx={childWrapSx}>{renderDept(c)}</Box>)}
                        </Box>
                    </>
                )}
            </Box>
        );
    };

    const noDept = tree.users[0] || [];
    const rootItems = [...tree.roots, ...(noDept.length ? [{id: 0, title: 'Şöbəsiz əməkdaşlar'}] : [])];
    const popUser = popUserId ? userById[popUserId] : null;

    return (
        <Box sx={pageWrapSx}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3}}>
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

            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, mb: 3}}>
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
                <Box sx={{display: 'flex', gap: 1, ml: 'auto'}}>
                    <Box component="button" type="button" onClick={expandAll} sx={toolBtnSx}>Hamısını aç</Box>
                    <Box component="button" type="button" onClick={collapseAll} sx={toolBtnSx}>Hamısını bağla</Box>
                </Box>
            </Box>

            <Box sx={{...panelSx, p: 3, overflow: 'auto', maxHeight: '75vh'}}>
                {!data ? <Skeleton variant="rounded" height={300}/> : rootItems.length === 0 ? <EmptyState title="Struktur məlumatı yoxdur"/> : (
                    <Box sx={{display: 'flex', alignItems: 'center', width: 'max-content', minWidth: '100%'}}>
                        <Box sx={{px: 2.5, py: 1.75, maxWidth: 220, borderRadius: '12px', color: '#fff', flexShrink: 0,
                            background: `linear-gradient(135deg, ${BRAND.navy950}, ${BRAND.navy700})`}}>
                            <Typography sx={{fontSize: 10.5, letterSpacing: '0.08em', opacity: 0.7, textTransform: 'uppercase'}}>Qurum</Typography>
                            <Typography sx={{fontSize: 15, fontWeight: 700, lineHeight: 1.3}}>{data.organization?.title || '—'}</Typography>
                        </Box>
                        <Box sx={{width: `${GAP}px`, borderTop: LINE, flexShrink: 0}}/>
                        <Box sx={{display: 'flex', flexDirection: 'column'}}>
                            {rootItems.map((d) => (
                                <Box key={d.id} sx={childWrapSx}>
                                    {d.id === 0 ? renderDept(d) : renderDept(d)}
                                </Box>
                            ))}
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
