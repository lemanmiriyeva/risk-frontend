"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Autocomplete, Avatar, Box, Chip, Skeleton, TextField, Typography,
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

export default function StructurePage() {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [orgId, setOrgId] = useState('');
    const [expanded, setExpanded] = useState(() => new Set());
    const [selectedId, setSelectedId] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const rowRefs = useRef({});

    const load = useCallback(async (organization) => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.STRUCTURE.LIST + (organization ? `?organization=${organization}` : ''));
            const d = res.data;
            setData(d);
            setOrgId(d.organization?.id || '');
            // Standart: giriş edən şəxsin şöbəsi açıq, özü kartda seçili
            const mine = d.users.find((u) => u.id === d.me.user_id);
            const depId = mine?.department ?? d.me.department_id;
            setSelectedId(mine ? mine.id : null);
            setExpanded(depId ? new Set(ancestors(d.departments, depId)) : new Set());
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
            counts[d.id] = (users[d.id] || []).length + (children[d.id] || []).reduce((s, c) => s + count(c), 0);
            return counts[d.id];
        };
        roots.forEach(count);
        return {roots, children, users, counts};
    }, [data]);

    const selected = selectedId ? userById[selectedId] : null;

    const choose = (user) => {
        if (!user) return;
        setSelectedId(user.id);
        if (user.department) {
            setExpanded((prev) => new Set([...prev, ...ancestors(data.departments, user.department)]));
        }
        setTimeout(() => rowRefs.current[user.id]?.scrollIntoView({behavior: 'smooth', block: 'center'}), 350);
    };

    const toggle = (id) => (_, isOpen) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (isOpen) next.add(id); else next.delete(id);
            return next;
        });
    };

    // Ağac: şöbə düyünləri + əməkdaş yarpaqları, şaquli xətt və üfüqi qollarla birləşir
    const branchSx = {
        position: 'relative', pl: '22px',
        '&::before': {content: '""', position: 'absolute', left: 0, top: 22, width: 14, borderTop: `1.5px solid ${C.lineStrong}`},
    };

    const renderDept = (dept, isRoot = true) => {
        const open = expanded.has(dept.id);
        const members = tree.users[dept.id] || [];
        const subs = tree.children[dept.id] || [];
        return (
            <Box key={dept.id} sx={isRoot ? {mb: 1.5} : branchSx}>
                <Box role="button" tabIndex={0} aria-expanded={open}
                     onClick={() => toggle(dept.id)(null, !open)}
                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(dept.id)(null, !open); }}
                     sx={{
                         display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, height: 44, cursor: 'pointer', maxWidth: '100%',
                         borderRadius: '10px', border: `1px solid ${open ? BRAND.navy600 : C.line}`,
                         backgroundColor: isRoot ? BRAND.navy900 : C.surface, color: isRoot ? '#fff' : BRAND.navy900,
                         '&:hover': {borderColor: BRAND.navy600},
                     }}>
                    <ExpandMoreIcon sx={{fontSize: 20, transition: 'transform .2s', transform: open ? 'none' : 'rotate(-90deg)'}}/>
                    <ApartmentOutlinedIcon sx={{fontSize: 18, opacity: 0.8}}/>
                    <Typography sx={{fontSize: 14, fontWeight: 650}}>{dept.title}</Typography>
                    <Chip size="small" label={tree.counts[dept.id] ?? members.length}
                          sx={{height: 20, fontSize: 11.5, fontWeight: 700, ml: 0.5,
                              ...(isRoot ? {backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff'} : {})}}/>
                </Box>
                {open && (
                    <Box sx={{ml: '20px', pl: 0, borderLeft: `1.5px solid ${C.lineStrong}`, mt: 0.5}}>
                        {members.map((u) => (
                            <Box key={u.id} sx={{position: 'relative', pl: '22px', py: '3px',
                                '&::before': {content: '""', position: 'absolute', left: 0, top: '50%', width: 14, borderTop: `1.5px solid ${C.lineStrong}`}}}>
                                <Box ref={(el) => { rowRefs.current[u.id] = el; }} role="button" tabIndex={0}
                                     onClick={() => setSelectedId(u.id)}
                                     onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(u.id); }}
                                     sx={{
                                         display: 'flex', alignItems: 'center', gap: 1.5, p: '6px 10px', borderRadius: '10px', cursor: 'pointer',
                                         backgroundColor: u.id === selectedId ? `${BRAND.navy600}14` : 'transparent',
                                         outline: u.id === selectedId ? `1px solid ${BRAND.navy600}66` : 'none',
                                         '&:hover': {backgroundColor: u.id === selectedId ? `${BRAND.navy600}14` : C.surfaceRaised},
                                     }}>
                                    <PersonAvatar user={u} size={36}/>
                                    <Box sx={{minWidth: 0, flex: 1}}>
                                        <Typography sx={{fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.25}}>{u.name}</Typography>
                                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>{u.position || 'Vəzifə göstərilməyib'}</Typography>
                                    </Box>
                                    {u.work_phone && <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>{u.work_phone}</Typography>}
                                </Box>
                            </Box>
                        ))}
                        {subs.map((c) => (
                            <Box key={c.id} sx={{py: '3px'}}>{renderDept(c, false)}</Box>
                        ))}
                        {!members.length && !subs.length && (
                            <Typography sx={{fontSize: 13, color: C.inkFaint, pl: '22px', py: 0.75}}>Bu şöbədə əməkdaş yoxdur.</Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    };

    const noDept = tree.users[0] || [];

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

            <Box sx={{display: 'grid', gap: 3, gridTemplateColumns: {xs: '1fr', md: 'minmax(0, 1fr) 360px'}, alignItems: 'start'}}>
                <Box>
                    {!data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{mb: 1, borderRadius: '10px'}}/>)
                        : data.departments.length === 0 && noDept.length === 0 ? <EmptyState title="Struktur məlumatı yoxdur"/>
                        : tree.roots.map((d) => renderDept(d))}
                    {noDept.length > 0 && renderDept({id: 0, title: 'Şöbəsiz əməkdaşlar'}, true)}
                </Box>
                <Box sx={{position: {md: 'sticky'}, top: {md: 96}}}>
                    <ProfileCard user={selected} department={selected ? deptById[selected.department] : null}/>
                </Box>
            </Box>
        </Box>
    );
}

function ancestors(departments, depId) {
    const map = Object.fromEntries(departments.map((d) => [d.id, d]));
    const ids = [];
    let cur = map[depId];
    while (cur) {
        ids.push(cur.id);
        cur = cur.parent ? map[cur.parent] : null;
    }
    return ids;
}
