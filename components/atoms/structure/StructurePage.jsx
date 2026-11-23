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

const TIER_HUES = ['#0B2A5B', '#0A6CC2', '#1F7A4D', '#C99A1E', '#6B4FB5', '#C42F3D'];

function pathTo(departments, depId) {
    const map = Object.fromEntries(departments.map((d) => [d.id, d]));
    const out = [];
    let cur = map[depId];
    while (cur) { out.unshift(cur); cur = cur.parent ? map[cur.parent] : null; }
    return out;
}

export default function StructurePage() {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [orgId, setOrgId] = useState('');
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [deptId, setDeptId] = useState(null);
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
            const mine = d.users.find((u) => u.id === d.me.user_id);
            // Standart: giriş edənin şöbəsi seçili gəlir
            setDeptId(mine?.department ?? d.me.department_id ?? d.departments.find((x) => !x.parent)?.id ?? null);
            setCollapsed(new Set());
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
        data.users.forEach((u) => { (users[u.department ?? 0] ||= []).push(u); });
        const counts = {};
        const count = (d) => {
            counts[d.id] = (users[d.id] || []).length + (children[d.id] || []).reduce((sum, c) => sum + count(c), 0);
            return counts[d.id];
        };
        roots.forEach(count);
        return {roots, children, users, counts};
    }, [data]);

    // Seçilmiş şöbənin əməkdaşları vəzifə pillələri üzrə (rütbə sırası ilə)
    const tiers = useMemo(() => {
        const members = tree.users[deptId ?? 0] || [];
        const map = new Map();
        members.forEach((u) => {
            const key = `${u.role_order}|${u.position}`;
            if (!map.has(key)) map.set(key, {order: u.role_order, title: u.position || 'Vəzifə göstərilməyib', people: []});
            map.get(key).people.push(u);
        });
        return [...map.values()].sort((a, b) => a.order - b.order);
    }, [tree, deptId]);

    const openPerson = (u) => {
        setPopUserId(u.id);
        setAnchor(nodeRefs.current[u.id] || null);
    };

    const choose = (u) => {
        if (!u) return;
        setDeptId(u.department ?? 0);
        // başqa şöbədə yığılmış valideynlər açılsın
        if (u.department) {
            const anc = pathTo(data.departments, u.department).map((d) => d.id);
            setCollapsed((prev) => { const n = new Set(prev); anc.forEach((id) => n.delete(id)); return n; });
        }
        setTimeout(() => { setPopUserId(u.id); setAnchor(nodeRefs.current[u.id] || null); }, 250);
    };

    const toggleCollapse = (id) => setCollapsed((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
    });

    const selectDept = (id) => { setDeptId(id); setPopUserId(null); setAnchor(null); };

    // Sol: yığcam şöbə ağacı
    const renderNav = (dept, level = 0) => {
        const subs = tree.children[dept.id] || [];
        const open = !collapsed.has(dept.id);
        const active = deptId === dept.id;
        return (
            <Box key={dept.id}>
                <Box sx={{display: 'flex', alignItems: 'center', pl: `${level * 14}px`, position: 'relative'}}>
                    {level > 0 && <Box sx={{position: 'absolute', left: `${level * 14 - 7}px`, top: 0, bottom: 0, borderLeft: `1.5px solid ${C.line}`}}/>}
                    <Box component="button" type="button" aria-label="Aç/bağla" onClick={() => subs.length && toggleCollapse(dept.id)}
                         sx={{width: 22, height: 22, border: 0, background: 'none', p: 0, cursor: subs.length ? 'pointer' : 'default', color: C.inkFaint,
                             display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {subs.length > 0 && <ExpandMoreIcon sx={{fontSize: 18, transition: 'transform .2s', transform: open ? 'none' : 'rotate(-90deg)'}}/>}
                    </Box>
                    <Box role="button" tabIndex={0} onClick={() => selectDept(dept.id)}
                         onKeyDown={(e) => { if (e.key === 'Enter') selectDept(dept.id); }}
                         sx={{flex: 1, display: 'flex', alignItems: 'center', gap: 1, px: 1, py: '7px', borderRadius: '8px', cursor: 'pointer', minWidth: 0,
                             backgroundColor: active ? BRAND.navy900 : 'transparent', color: active ? '#fff' : C.ink,
                             '&:hover': {backgroundColor: active ? BRAND.navy900 : C.surfaceRaised}}}>
                        <Typography sx={{fontSize: 13.5, fontWeight: active ? 700 : 500, flex: 1, lineHeight: 1.3}}>{dept.title}</Typography>
                        <Typography sx={{fontSize: 11.5, fontWeight: 700, opacity: 0.7}}>{tree.counts[dept.id] ?? 0}</Typography>
                    </Box>
                </Box>
                {open && subs.map((c) => renderNav(c, level + 1))}
            </Box>
        );
    };

    const noDept = tree.users[0] || [];
    const dept = deptId ? deptById[deptId] : null;
    const crumbs = dept ? pathTo(data.departments, dept.id) : [];
    const subDepts = dept ? (tree.children[dept.id] || []) : [];
    const popUser = popUserId ? userById[popUserId] : null;

    return (
        <Box sx={pageWrapSx}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3}}>
                <Box>
                    <Typography component="h1" sx={{fontSize: 24, fontWeight: 700, color: BRAND.navy900}}>Təşkilati struktur</Typography>
                    {data?.organization && <Typography sx={{fontSize: 14, color: C.inkMuted}}>{data.organization.title}</Typography>}
                </Box>
                {data?.organizations?.length > 1 && (
                    <TextField select size="small" label="Qurum" value={orgId} sx={{...fieldSx, minWidth: 240}}
                               SelectProps={{native: true}} onChange={(e) => { setData(null); load(e.target.value); }}>
                        {data.organizations.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                    </TextField>
                )}
            </Box>

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
                    <TextField {...params} size="small" placeholder="Ad, soyad və ya daxili nömrə ilə axtarın" sx={{...fieldSx, mb: 3, maxWidth: 560}}
                               InputProps={{...params.InputProps, startAdornment: <SearchIcon sx={{fontSize: 20, color: C.inkFaint, mr: 1}}/>}}/>
                )}
                sx={{maxWidth: 560}}
            />

            <Box sx={{display: 'grid', gap: 3, gridTemplateColumns: {xs: '1fr', md: '300px minmax(0, 1fr)'}, alignItems: 'start'}}>
                {/* Sol: şöbə ağacı */}
                <Box sx={{...panelSx, p: 1.5}}>
                    {!data ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={34}/>) : (
                        <>
                            {tree.roots.map((d) => renderNav(d))}
                            {noDept.length > 0 && (
                                <Box role="button" tabIndex={0} onClick={() => selectDept(0)}
                                     sx={{px: 3, py: '7px', mt: 0.5, borderRadius: '8px', cursor: 'pointer', fontSize: 13.5,
                                         backgroundColor: deptId === 0 ? BRAND.navy900 : 'transparent', color: deptId === 0 ? '#fff' : C.inkMuted}}>
                                    Şöbəsiz əməkdaşlar ({noDept.length})
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {/* Sağ: seçilmiş şöbənin vəzifə iyerarxiyası */}
                <Box sx={{...panelSx, p: {xs: 2, md: 3}, overflow: 'hidden', position: 'relative',
                    backgroundImage: `radial-gradient(${C.line} 1px, transparent 1px)`, backgroundSize: '18px 18px'}}>
                    {!data ? <Skeleton variant="rounded" height={320}/> : (
                        <>
                            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, mb: 0.5}}>
                                {crumbs.map((c, i) => (
                                    <React.Fragment key={c.id}>
                                        {i > 0 && <Typography sx={{color: C.inkFaint, fontSize: 13}}>›</Typography>}
                                        <Typography onClick={() => selectDept(c.id)}
                                                    sx={{fontSize: 12.5, color: i === crumbs.length - 1 ? C.ink : BRAND.navy600, cursor: 'pointer', fontWeight: 600}}>
                                            {c.title}
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Box>
                            <Typography sx={{fontSize: 20, fontWeight: 700, color: BRAND.navy900, mb: 3}}>
                                {dept ? dept.title : deptId === 0 ? 'Şöbəsiz əməkdaşlar' : 'Şöbə seçin'}
                            </Typography>

                            {tiers.length === 0 && <EmptyState title="Bu şöbədə əməkdaş yoxdur"/>}

                            {tiers.map((tier, ti) => (
                                <Box key={`${tier.order}-${tier.title}`}>
                                    {ti > 0 && <Box sx={{height: 26, width: 0, mx: 'auto', borderLeft: `2px solid ${C.lineStrong}`}}/>}
                                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 1.5}}>
                                        <Box sx={{px: 1.75, py: '3px', borderRadius: '999px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
                                            textTransform: 'uppercase', color: '#fff', backgroundColor: TIER_HUES[ti % TIER_HUES.length]}}>
                                            {tier.title}
                                        </Box>
                                    </Box>
                                    <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2.5}}>
                                        {tier.people.map((u) => {
                                            const isMe = u.id === data.me.user_id;
                                            const hue = TIER_HUES[ti % TIER_HUES.length];
                                            return (
                                                <Box key={u.id} ref={(el) => { nodeRefs.current[u.id] = el; }} role="button" tabIndex={0}
                                                     onClick={() => openPerson(u)} onKeyDown={(e) => { if (e.key === 'Enter') openPerson(u); }}
                                                     sx={{width: 148, textAlign: 'center', cursor: 'pointer', p: 1.5, borderRadius: '14px', backgroundColor: C.surface,
                                                         border: `1.5px solid ${u.id === popUserId ? hue : C.line}`, transition: 'transform .18s, box-shadow .18s',
                                                         '&:hover': {transform: 'translateY(-3px)', boxShadow: '0 12px 24px rgba(6,18,38,0.12)'}}}>
                                                    <Box sx={{display: 'inline-flex', p: '3px', borderRadius: '50%', border: `2.5px solid ${hue}`, position: 'relative'}}>
                                                        <PersonAvatar user={u} size={64}/>
                                                        {isMe && <Box sx={{position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', px: 0.9,
                                                            borderRadius: '8px', fontSize: 10, fontWeight: 800, color: '#fff', backgroundColor: hue}}>SİZ</Box>}
                                                    </Box>
                                                    <Typography sx={{fontSize: 13.5, fontWeight: 650, color: C.ink, mt: 1, lineHeight: 1.25}}>{u.name}</Typography>
                                                    {u.work_phone && <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.25}}>☎ {u.work_phone}</Typography>}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ))}

                            {subDepts.length > 0 && (
                                <Box sx={{mt: 4}}>
                                    <Box sx={{height: 26, width: 0, mx: 'auto', borderLeft: `2px dashed ${C.lineStrong}`}}/>
                                    <Typography sx={{textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: C.inkFaint, letterSpacing: '0.06em',
                                        textTransform: 'uppercase', mb: 1.5}}>Tabe strukturlar</Typography>
                                    <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5}}>
                                        {subDepts.map((c) => (
                                            <Box key={c.id} role="button" tabIndex={0} onClick={() => selectDept(c.id)}
                                                 onKeyDown={(e) => { if (e.key === 'Enter') selectDept(c.id); }}
                                                 sx={{px: 2, py: 1.25, borderRadius: '12px', border: `1.5px dashed ${C.lineStrong}`, backgroundColor: C.surface,
                                                     cursor: 'pointer', '&:hover': {borderColor: BRAND.navy600, borderStyle: 'solid'}}}>
                                                <Typography sx={{fontSize: 13.5, fontWeight: 650, color: BRAND.navy900}}>{c.title}</Typography>
                                                <Typography sx={{fontSize: 12, color: C.inkMuted}}>{tree.counts[c.id] ?? 0} əməkdaş</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            <Popover open={!!(popUser && anchor)} anchorEl={anchor} onClose={() => { setPopUserId(null); setAnchor(null); }}
                     anchorOrigin={{vertical: 'bottom', horizontal: 'center'}} transformOrigin={{vertical: 'top', horizontal: 'center'}}
                     slotProps={{paper: {sx: {width: 340, borderRadius: '14px', mt: 1}}}}>
                {popUser && <ProfileCard user={popUser} department={deptById[popUser.department]}/>}
            </Popover>
        </Box>
    );
}
