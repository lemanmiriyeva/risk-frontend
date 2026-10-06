"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C} from "@/components/theme/tokens";


const cardSx = {
    backgroundColor: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: '10px',
    p: {xs: 2, sm: 3},
};

/* ---------------------------------------------------------------------- */
/* Modulun / alt-modulun bir qurum üçün açıq olub-olmadığını göstərən     */
/* matrix - yalnız superuser görür.                                       */
/* ---------------------------------------------------------------------- */
function OrgAccessMatrix() {
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // {organizations, modules}
    const [savingKey, setSavingKey] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS);
            setData(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    async function toggle(target, id, organizationId, grant) {
        const key = `${target}:${id}:${organizationId}`;
        setSavingKey(key);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {
                target, id, organization_id: organizationId, grant,
            });
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const applyToggle = (obj) => {
                    const ids = new Set(obj.organization_ids);
                    grant ? ids.add(organizationId) : ids.delete(organizationId);
                    obj.organization_ids = Array.from(ids);
                };
                for (const m of next.modules) {
                    if (target === 'module' && m.id === id) applyToggle(m);
                    if (target === 'sub_module') {
                        const sub = m.sub_modules.find(s => s.id === id);
                        if (sub) applyToggle(sub);
                    }
                }
                return next;
            });
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSavingKey(null);
        }
    }

    async function togglePublic(moduleId, grant) {
        const key = `module_public:${moduleId}:public`;
        setSavingKey(key);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {
                target: 'module_public', id: moduleId, grant,
            });
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const m = next.modules.find(m => m.id === moduleId);
                if (m) m.is_public = grant;
                return next;
            });
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSavingKey(null);
        }
    }

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>;
    }
    if (!data || !data.organizations?.length || !data.modules?.length) {
        return <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 3}}>Göstəriləcək modul və ya qurum yoxdur.</Typography>;
    }

    const rows = [];
    data.modules.forEach(m => {
        rows.push({...m, isSub: false});
        m.sub_modules.forEach(sm => rows.push({...sm, isSub: true, parentTitle: m.title, parentPublic: m.is_public}));
    });

    return (
        <Box sx={{overflowX: 'auto'}}>
            <Box sx={{display: 'table', width: '100%', borderCollapse: 'collapse', minWidth: 420 + data.organizations.length * 120}}>
                {/* header */}
                <Box sx={{display: 'table-row'}}>
                    <Box sx={{
                        display: 'table-cell', p: 1.25, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: C.inkFaint, borderBottom: `1px solid ${C.lineStrong}`, position: 'sticky', left: 0,
                        backgroundColor: C.surface, minWidth: 260,
                    }}>
                        Modul / Alt modul
                    </Box>
                    <Box sx={{
                        display: 'table-cell', p: 1.25, fontSize: 11.5, fontWeight: 700, color: C.gold,
                        borderBottom: `1px solid ${C.lineStrong}`, textAlign: 'center', minWidth: 110,
                    }}>
                        Hər kəsə açıq
                    </Box>
                    {data.organizations.map(org => (
                        <Box key={org.id} sx={{
                            display: 'table-cell', p: 1.25, fontSize: 11.5, fontWeight: 700, color: C.ink,
                            borderBottom: `1px solid ${C.lineStrong}`, textAlign: 'center', minWidth: 120,
                        }}>
                            {org.title}
                        </Box>
                    ))}
                </Box>

                {rows.map(row => {
                    return (
                        <Box key={`${row.isSub ? 'sub' : 'mod'}-${row.id}`} sx={{display: 'table-row', '&:hover': {backgroundColor: 'rgba(0,0,0,0.015)'}}}>
                            <Box sx={{
                                display: 'table-cell', p: 1.25, borderBottom: `1px solid ${C.line}`, position: 'sticky', left: 0,
                                backgroundColor: C.surface,
                            }}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, pl: row.isSub ? 2.5 : 0}}>
                                    {row.isSub && <SubdirectoryArrowRightIcon sx={{fontSize: 15, color: C.inkFaint}}/>}
                                    <Typography sx={{fontSize: 13.5, fontWeight: row.isSub ? 500 : 700, color: C.ink}}>
                                        {row.title}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{display: 'table-cell', p: 0.5, borderBottom: `1px solid ${C.line}`, textAlign: 'center'}}>
                                {row.isSub ? (
                                    row.parentPublic ? (
                                        <Tooltip title="Əsas modul hər kəsə açıq olduğu üçün bu alt modul da avtomatik açıqdır">
                                            <span>
                                                <Checkbox size="small" checked disabled
                                                          sx={{'&.Mui-checked.Mui-disabled': {color: C.goldMuted}}}/>
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <Typography sx={{fontSize: 11, color: C.inkFaint}}>—</Typography>
                                    )
                                ) : savingKey === `module_public:${row.id}:public` ? (
                                    <CircularProgress size={16} sx={{color: C.gold}}/>
                                ) : (
                                    <Tooltip title="Aktiv edilsə, bu modul və alt modulları bütün istifadəçilərə açıq olur">
                                        <Checkbox
                                            size="small"
                                            checked={!!row.is_public}
                                            onChange={(e) => togglePublic(row.id, e.target.checked)}
                                            sx={{color: C.lineStrong, '&.Mui-checked': {color: C.gold}}}
                                        />
                                    </Tooltip>
                                )}
                            </Box>
                            {data.organizations.map(org => {
                                const target = row.isSub ? 'sub_module' : 'module';
                                const checked = row.organization_ids.includes(org.id);
                                const key = `${target}:${row.id}:${org.id}`;
                                const disabled = row.isSub ? row.parentPublic : row.is_public;
                                return (
                                    <Box key={org.id} sx={{display: 'table-cell', p: 0.5, borderBottom: `1px solid ${C.line}`, textAlign: 'center'}}>
                                        {savingKey === key ? (
                                            <CircularProgress size={16} sx={{color: C.gold}}/>
                                        ) : (
                                            <Tooltip title={disabled ? 'Bu modul hər kəsə açıqdır - qurum əsaslı giriş artıq lazım deyil' : ''}>
                                            <span>
                                                <Checkbox
                                                    size="small"
                                                    checked={disabled ? true : checked}
                                                    disabled={disabled}
                                                    onChange={(e) => toggle(target, row.id, org.id, e.target.checked)}
                                                    sx={{color: C.lineStrong, '&.Mui-checked': {color: C.gold}}}
                                                />
                                            </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

/* ====================================================================== */
/* Sadələşdirilmiş giriş idarəsi                                          */
/*                                                                        */
/* Hər əməkdaşın hər modul üzrə 3 səviyyəsi var:                          */
/*   Giriş yoxdur · İstifadəçi · Admin                                    */
/* "Hamıya açıq" modulda hamı avtomatik İstifadəçidir - yalnız adminlər   */
/* seçilir.                                                               */
/* ====================================================================== */

const LEVELS = [
    {key: 'none', label: 'Giriş yoxdur'},
    {key: 'user', label: 'İstifadəçi'},
    {key: 'admin', label: 'Admin'},
];

const LEVEL_HELP = [
    {key: 'none', color: C.inkFaint, title: 'Giriş yoxdur', text: 'modul menyuda görünmür'},
    {key: 'user', color: C.gold, title: 'İstifadəçi', text: 'modula daxil olub işləyə bilər'},
    {key: 'admin', color: C.success, title: 'Admin', text: 'məzmunu əlavə edir və idarə edir'},
];

function initials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* Modul / alt modul faktiki olaraq hamıya açıqdırmı? */
function isPublicObj(obj, isSub, parent) {
    return isSub ? (!!parent?.is_public && !obj.is_restricted) : !!obj.is_public;
}

/* Əməkdaşın bu modul / alt modul üzrə səviyyəsi. */
function userLevel(u, isSub, isPublic) {
    if (!u) return {level: 'none', locked: false};
    if (u.implicit_access) {
        return {level: 'admin', locked: true, reason: 'Sistem və ya qurum inzibatçısıdır - bütün modullara avtomatik girişi var.'};
    }
    if (isSub && u.is_module_admin) {
        return {level: 'admin', locked: true, reason: 'Əsas modulun admini olduğu üçün bu alt modulda da avtomatik admindir.'};
    }
    const isAdmin = isSub ? !!u.is_sub_module_admin : !!u.is_module_admin;
    if (isAdmin) return {level: 'admin', locked: false};
    if (u.has_access || isPublic) return {level: 'user', locked: false};
    return {level: 'none', locked: false};
}

/* 3 vəziyyətli seçici: Giriş yoxdur / İstifadəçi / Admin */
function LevelControl({state, isPublic, busy, disabled, onChange, compact}) {
    if (state.locked) {
        return (
            <Tooltip title={state.reason}>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: '8px',
                    fontSize: 12, fontWeight: 650, color: C.success, backgroundColor: C.successTint, cursor: 'help',
                }}>
                    <LockOutlinedIcon sx={{fontSize: 13}}/> Avtomatik admin
                </Box>
            </Tooltip>
        );
    }
    return (
        <Box sx={{
            display: 'inline-flex', p: '3px', borderRadius: '10px', backgroundColor: C.surfaceDeep,
            position: 'relative', opacity: busy ? 0.6 : 1, flexShrink: 0,
        }}>
            {LEVELS.map(l => {
                const active = state.level === l.key;
                const noneBlocked = l.key === 'none' && isPublic;
                const off = disabled || busy || noneBlocked;
                const activeColor = l.key === 'admin' ? C.success : C.gold;
                const btn = (
                    <Box
                        key={l.key} component="button" type="button" disabled={off}
                        onClick={() => !active && onChange(l.key)}
                        aria-pressed={active}
                        sx={{
                            all: 'unset', boxSizing: 'border-box', cursor: off ? 'default' : (active ? 'default' : 'pointer'),
                            px: compact ? 1 : 1.4, py: 0.55, borderRadius: '8px', whiteSpace: 'nowrap',
                            fontSize: compact ? 11.5 : 12.5, fontWeight: active ? 700 : 550,
                            color: active ? (l.key === 'none' ? C.ink : '#fff') : (noneBlocked ? C.lineStrong : C.inkMuted),
                            backgroundColor: active ? (l.key === 'none' ? C.surface : activeColor) : 'transparent',
                            boxShadow: active ? '0 1px 3px rgba(10,27,54,0.18)' : 'none',
                            transition: 'background-color .15s ease, color .15s ease',
                            '&:hover': (!off && !active) ? {color: C.ink, backgroundColor: 'rgba(255,255,255,0.7)'} : {},
                            '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                        }}
                    >
                        {l.label}
                    </Box>
                );
                return noneBlocked ? (
                    <Tooltip key={l.key} title="Modul hamıya açıqdır - hər kəs avtomatik istifadəçidir">
                        <span style={{display: 'inline-flex'}}>{btn}</span>
                    </Tooltip>
                ) : btn;
            })}
            {busy && (
                <Box sx={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <CircularProgress size={16} sx={{color: C.gold}}/>
                </Box>
            )}
        </Box>
    );
}

function Avatar({name, tone = 'muted', size = 34}) {
    const tones = {
        none: {bg: C.surfaceDeep, fg: C.inkMuted},
        muted: {bg: C.surfaceDeep, fg: C.inkMuted},
        user: {bg: C.goldTint, fg: C.goldDeep},
        admin: {bg: C.successTint, fg: C.success},
    };
    const t = tones[tone] || tones.muted;
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0, fontSize: size > 40 ? 15 : 11.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, color: t.fg,
        }}>
            {initials(name)}
        </Box>
    );
}

function StatusChip({isPublic, count}) {
    return isPublic ? (
        <Box sx={{fontSize: 10.5, fontWeight: 700, px: 0.85, py: 0.2, borderRadius: 999, flexShrink: 0, color: C.success, backgroundColor: C.successTint, whiteSpace: 'nowrap'}}>
            Hamıya açıq
        </Box>
    ) : (
        <Box sx={{
            fontSize: 10.5, fontWeight: 700, px: 0.85, py: 0.2, borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap',
            color: count ? C.goldDeep : C.inkFaint, backgroundColor: count ? C.goldTint : C.surfaceDeep,
        }}>
            {count} nəfər
        </Box>
    );
}

/* Modulun giriş rejimi: "Hamıya açıq" və ya "Yalnız seçilmiş əməkdaşlar" */
function AccessModePicker({cur, canEdit, busy, onChange}) {
    const {obj, isSub, parent} = cur;
    if (isSub && !parent.is_public) {
        return (
            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.5, borderRadius: '10px', backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}>
                <InfoOutlinedIcon sx={{fontSize: 18, color: C.inkFaint, mt: 0.1}}/>
                <Typography sx={{fontSize: 12.5, color: C.inkMuted, lineHeight: 1.55}}>
                    Bu alt modula giriş verdiyiniz əməkdaşa «{parent.title}» moduluna da avtomatik giriş açılır.
                </Typography>
            </Box>
        );
    }
    const pub = isPublicObj(obj, isSub, parent);
    const options = [
        {
            key: true, icon: <PublicOutlinedIcon/>,
            title: isSub ? 'Hamıya açıq (əsas modul kimi)' : 'Hamıya açıq',
            text: 'Bütün əməkdaşlar istifadə edə bilər. Aşağıda yalnız adminləri seçin.',
            color: C.success, tint: C.successTint,
        },
        {
            key: false, icon: <LockOutlinedIcon/>,
            title: 'Yalnız seçilmiş əməkdaşlar',
            text: 'Giriş yalnız aşağıda seçdiyiniz əməkdaşlara açılır.',
            color: C.gold, tint: C.goldTint,
        },
    ];
    return (
        <Box>
            <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 1.25}}>
                {options.map(o => {
                    const active = pub === o.key;
                    const off = !canEdit || busy;
                    return (
                        <Box
                            key={String(o.key)} component="button" type="button" disabled={off}
                            onClick={() => !active && onChange(o.key)} aria-pressed={active}
                            sx={{
                                all: 'unset', boxSizing: 'border-box', display: 'flex', gap: 1.25, alignItems: 'flex-start',
                                p: 1.5, borderRadius: '12px', cursor: off || active ? 'default' : 'pointer',
                                border: `1.5px solid ${active ? o.color : C.line}`,
                                backgroundColor: active ? o.tint : C.surface,
                                opacity: !active && off ? 0.55 : 1,
                                transition: 'border-color .15s ease, background-color .15s ease',
                                '&:hover': (!off && !active) ? {borderColor: C.lineStrong, backgroundColor: C.surfaceRaised} : {},
                                '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 2},
                            }}
                        >
                            <Box sx={{
                                width: 34, height: 34, borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: active ? '#fff' : C.inkFaint, backgroundColor: active ? o.color : C.surfaceDeep,
                                '& svg': {fontSize: 19},
                            }}>
                                {busy && !active ? <CircularProgress size={16} sx={{color: C.inkFaint}}/> : o.icon}
                            </Box>
                            <Box sx={{minWidth: 0}}>
                                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: active ? C.ink : C.inkMuted}}>{o.title}</Typography>
                                <Typography sx={{fontSize: 12, color: C.inkMuted, lineHeight: 1.5, mt: 0.25}}>{o.text}</Typography>
                            </Box>
                            {active && <CheckCircleIcon sx={{fontSize: 18, color: o.color, ml: 'auto', flexShrink: 0}}/>}
                        </Box>
                    );
                })}
            </Box>
            {!canEdit && (
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, mt: 0.75}}>
                    Giriş rejimini yalnız sistem inzibatçısı dəyişə bilər.
                </Typography>
            )}
        </Box>
    );
}

function SearchBox({value, onChange, placeholder}) {
    return (
        <TextField
            size="small" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} fullWidth
            sx={{'& .MuiOutlinedInput-root': {borderRadius: '10px', backgroundColor: C.surface}}}
            InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 18, color: C.inkFaint}}/></InputAdornment>}}
        />
    );
}

const matches = (q, ...vals) => !q || vals.some(v => (v || '').toLocaleLowerCase('az').includes(q));

/* ---------------------------------------------------------------------- */
/* Modul üzrə görünüş                                                     */
/* ---------------------------------------------------------------------- */
function ModuleView({data, api}) {
    const [selected, setSelected] = useState(() => {
        const first = data.modules[0];
        return first ? {type: 'module', id: first.id} : null;
    });
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [bulkKey, setBulkKey] = useState(null);

    let cur = null;
    for (const m of data.modules) {
        if (selected?.type === 'module' && m.id === selected.id) cur = {obj: m, isSub: false, parent: null};
        const sub = selected?.type === 'sub' && m.sub_modules?.find(s => s.id === selected.id);
        if (sub) cur = {obj: sub, isSub: true, parent: m};
    }
    const pub = cur ? isPublicObj(cur.obj, cur.isSub, cur.parent) : false;

    const groups = useMemo(() => {
        if (!cur) return [];
        const q = query.trim().toLocaleLowerCase('az');
        const list = cur.obj.users.filter(u => {
            const lv = userLevel(u, cur.isSub, pub).level;
            if (filter === 'granted' && lv === 'none') return false;
            if (filter === 'admins' && lv !== 'admin') return false;
            if (filter === 'none' && lv !== 'none') return false;
            return matches(q, u.name, u.username, u.role_title, u.department_title);
        });
        const map = new Map();
        for (const u of list) {
            const key = u.department_id || 0;
            if (!map.has(key)) map.set(key, {id: key, title: u.department_title || 'Şöbəsi təyin edilməyib', users: []});
            map.get(key).users.push(u);
        }
        return Array.from(map.values()).sort((a, b) => (a.id || 1e9) - (b.id || 1e9));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cur?.obj, cur?.isSub, pub, query, filter]);

    // Hamıya açıq modulda əsas iş adminləri seçməkdir - filtri ona uyğun təklif edirik
    const filters = pub
        ? [{key: 'all', label: 'Hamısı'}, {key: 'admins', label: 'Adminlər'}]
        : [{key: 'all', label: 'Hamısı'}, {key: 'granted', label: 'Girişi olanlar'}, {key: 'none', label: 'Girişi olmayanlar'}, {key: 'admins', label: 'Adminlər'}];

    useEffect(() => {
        if (!filters.some(f => f.key === filter)) setFilter('all');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pub]);

    const countFor = (obj, isSub, parent) => {
        const p = isPublicObj(obj, isSub, parent);
        return obj.users.filter(u => userLevel(u, isSub, p).level !== 'none').length;
    };

    async function bulk(group, level) {
        const targets = group.users.filter(u => {
            const st = userLevel(u, cur.isSub, pub);
            return !st.locked && st.level !== level && st.level !== 'admin';
        });
        if (!targets.length) return;
        setBulkKey(`${group.id}:${level}`);
        let failed = 0;
        for (const u of targets) {
            const ok = await api.setLevel(cur, u, level, {silent: true});
            if (!ok) failed += 1;
        }
        setBulkKey(null);
        api.notify(failed, targets.length, level);
    }

    const navItem = (obj, isSub, parent) => {
        const active = selected && selected.id === obj.id && (selected.type === 'sub') === isSub;
        const p = isPublicObj(obj, isSub, parent);
        return (
            <Box
                key={`${isSub ? 's' : 'm'}-${obj.id}`}
                component="button" type="button"
                onClick={() => { setSelected({type: isSub ? 'sub' : 'module', id: obj.id}); setFilter('all'); }}
                title={isSub ? `${parent.title} / ${obj.title}` : obj.title}
                sx={{
                    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
                    display: 'flex', alignItems: 'center', gap: 1,
                    pl: isSub ? 3.5 : 1.5, pr: 1.25, py: isSub ? 0.85 : 1.1, borderRadius: '8px',
                    backgroundColor: active ? C.goldTint : 'transparent',
                    boxShadow: active ? `inset 3px 0 0 ${C.gold}` : 'none',
                    transition: 'background-color .15s ease',
                    '&:hover': {backgroundColor: active ? C.goldTint : C.surfaceRaised},
                    '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                }}
            >
                {isSub
                    ? <SubdirectoryArrowRightIcon sx={{fontSize: 14, color: C.inkFaint}}/>
                    : <ExtensionOutlinedIcon sx={{fontSize: 16, color: active ? C.gold : C.inkFaint}}/>}
                <Typography noWrap sx={{flex: 1, fontSize: isSub ? 12.5 : 13.5, fontWeight: isSub ? 500 : 650, color: active ? C.ink : C.inkMuted}}>
                    {obj.title}
                </Typography>
                <StatusChip isPublic={p} count={countFor(obj, isSub, parent)}/>
            </Box>
        );
    };

    const adminCount = cur ? cur.obj.users.filter(u => userLevel(u, cur.isSub, pub).level === 'admin').length : 0;

    return (
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '290px 1fr'}, gap: 2.5, alignItems: 'start'}}>
            <Box sx={{
                border: `1px solid ${C.line}`, borderRadius: '12px', p: 1, backgroundColor: C.surface,
                position: {md: 'sticky'}, top: {md: 140}, maxHeight: {xs: 280, md: 'calc(100vh - 170px)'}, overflowY: 'auto',
            }}>
                <Typography sx={{px: 1.5, pt: 1, pb: 1, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600}}>
                    Modul seçin
                </Typography>
                {data.modules.map(m => (
                    <Box key={m.id}>
                        {navItem(m, false, null)}
                        {m.sub_modules?.map(s => navItem(s, true, m))}
                    </Box>
                ))}
            </Box>

            {cur && (
                <Box sx={{border: `1px solid ${C.line}`, borderRadius: '12px', backgroundColor: C.surface, minWidth: 0}}>
                    <Box sx={{p: {xs: 2, sm: 2.5}, borderBottom: `1px solid ${C.line}`}}>
                        {cur.isSub && (
                            <Typography sx={{fontSize: 11.5, color: C.inkFaint, mb: 0.25}}>{cur.parent.title} · alt modul</Typography>
                        )}
                        <Typography sx={{fontSize: 19, fontWeight: 700, color: C.ink}}>{cur.obj.title}</Typography>
                        {!cur.isSub && cur.obj.description && (
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.25}}>{cur.obj.description}</Typography>
                        )}

                        <Typography sx={{fontSize: 12, fontWeight: 700, color: C.ink, mt: 2.25, mb: 1}}>
                            1. Kim istifadə edə bilər?
                        </Typography>
                        <AccessModePicker
                            cur={cur}
                            canEdit={!!data.can_toggle_public}
                            busy={api.modeBusy === `${cur.isSub ? 's' : 'm'}:${cur.obj.id}`}
                            onChange={(val) => cur.isSub ? api.setRestricted(cur.obj, !val) : api.setPublic(cur.obj, val)}
                        />

                        <Typography sx={{fontSize: 12, fontWeight: 700, color: C.ink, mt: 2.5, mb: 0.25}}>
                            {pub ? '2. Adminləri seçin' : '2. Əməkdaşları seçin'}
                        </Typography>
                        <Typography sx={{fontSize: 12, color: C.inkMuted, mb: 1.25}}>
                            {pub
                                ? `Hamı avtomatik istifadəçidir. Məzmunu idarə edəcək əməkdaşları «Admin» edin. Hazırda ${adminCount} admin var.`
                                : `Hər əməkdaş üçün səviyyəni seçin. Hazırda ${countFor(cur.obj, cur.isSub, cur.parent)} nəfərin girişi var, ${adminCount} admin.`}
                        </Typography>

                        <Box sx={{display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center'}}>
                            <Box sx={{flex: '1 1 240px', maxWidth: 380}}>
                                <SearchBox value={query} onChange={setQuery} placeholder="Ad, vəzifə və ya şöbə üzrə axtarış"/>
                            </Box>
                            <Box sx={{display: 'flex', gap: 0.75, flexWrap: 'wrap'}}>
                                {filters.map(f => (
                                    <Box key={f.key} component="button" type="button" onClick={() => setFilter(f.key)} sx={{
                                        all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, px: 1.5, py: 0.6, borderRadius: 999,
                                        border: `1px solid ${filter === f.key ? C.gold : C.line}`,
                                        color: filter === f.key ? C.goldDeep : C.inkMuted,
                                        backgroundColor: filter === f.key ? C.goldTint : 'transparent',
                                        '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                                    }}>
                                        {f.label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {groups.length === 0 ? (
                        <Typography sx={{p: 3, fontSize: 13.5, color: C.inkFaint}}>
                            {cur.obj.users.length ? 'Seçimə uyğun əməkdaş tapılmadı.' : 'Bu qurumda aktiv əməkdaş yoxdur.'}
                        </Typography>
                    ) : groups.map(group => {
                        const changeable = group.users.filter(u => {
                            const st = userLevel(u, cur.isSub, pub);
                            return !st.locked && st.level !== 'admin';
                        });
                        return (
                            <Box key={group.id}>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 1, px: {xs: 2, sm: 2.5}, py: 1,
                                    backgroundColor: C.surfaceRaised, borderBottom: `1px solid ${C.line}`, flexWrap: 'wrap',
                                }}>
                                    <AccountTreeOutlinedIcon sx={{fontSize: 16, color: C.inkFaint}}/>
                                    <Typography sx={{fontSize: 12.5, fontWeight: 650, color: C.ink, flex: 1, minWidth: 0}} noWrap>
                                        {group.title}
                                    </Typography>
                                    <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>{group.users.length} nəfər</Typography>
                                    {!pub && changeable.length > 0 && (
                                        <Box sx={{display: 'flex', gap: 0.5}}>
                                            {['user', 'none'].map(level => {
                                                const busy = bulkKey === `${group.id}:${level}`;
                                                const off = !!bulkKey || changeable.every(u => userLevel(u, cur.isSub, pub).level === level);
                                                return (
                                                    <Box key={level} component="button" type="button" disabled={off}
                                                         onClick={() => bulk(group, level)}
                                                         sx={{
                                                             all: 'unset', cursor: off ? 'default' : 'pointer', fontSize: 11.5, fontWeight: 600,
                                                             px: 1, py: 0.35, borderRadius: '6px',
                                                             color: off ? C.inkFaint : (level === 'user' ? C.goldDeep : C.danger),
                                                             opacity: off && !busy ? 0.55 : 1,
                                                             display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                             '&:hover': off ? {} : {backgroundColor: level === 'user' ? C.goldTint : C.dangerTint},
                                                             '&:focus-visible': {outline: `2px solid ${C.gold}`},
                                                         }}>
                                                        {busy && <CircularProgress size={11} sx={{color: 'inherit'}}/>}
                                                        {level === 'user' ? 'Şöbənin hamısına ver' : 'Hamısından al'}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                </Box>
                                {group.users.map(u => {
                                    const st = userLevel(u, cur.isSub, pub);
                                    return (
                                        <Box key={u.id} sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'},
                                            px: {xs: 2, sm: 2.5}, py: 1, borderBottom: `1px solid ${C.line}`,
                                            '&:hover': {backgroundColor: C.goldWash},
                                        }}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1}}>
                                                <Avatar name={u.name || u.username} tone={st.level}/>
                                                <Box sx={{minWidth: 0}}>
                                                    <Typography noWrap sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>{u.name || u.username}</Typography>
                                                    <Typography noWrap sx={{fontSize: 12, color: C.inkFaint}}>{u.role_title || u.username}</Typography>
                                                </Box>
                                            </Box>
                                            <LevelControl
                                                state={st} isPublic={pub}
                                                busy={api.busy.has(`${cur.isSub ? 's' : 'm'}:${cur.obj.id}:${u.id}`)}
                                                disabled={!!bulkKey}
                                                onChange={(lv) => api.setLevel(cur, u, lv)}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

/* ---------------------------------------------------------------------- */
/* Əməkdaş üzrə görünüş - bir əməkdaşın bütün modullardakı səviyyəsi      */
/* ---------------------------------------------------------------------- */
function EmployeeView({data, api}) {
    const [query, setQuery] = useState('');
    const people = useMemo(() => {
        const map = new Map();
        for (const m of data.modules) for (const u of m.users) if (!map.has(u.id)) map.set(u.id, u);
        return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'az'));
    }, [data.modules]);
    const [selectedId, setSelectedId] = useState(() => people[0]?.id ?? null);

    const q = query.trim().toLocaleLowerCase('az');
    const filtered = people.filter(u => matches(q, u.name, u.username, u.role_title, u.department_title));
    const person = people.find(u => u.id === selectedId);

    const row = (obj, isSub, parent) => {
        const u = obj.users.find(x => x.id === selectedId);
        const pub = isPublicObj(obj, isSub, parent);
        const st = userLevel(u, isSub, pub);
        const cur = {obj, isSub, parent};
        return (
            <Box key={`${isSub ? 's' : 'm'}-${obj.id}`} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'},
                pl: isSub ? {xs: 3.5, sm: 5} : {xs: 2, sm: 2.5}, pr: {xs: 2, sm: 2.5}, py: isSub ? 0.85 : 1.2,
                borderBottom: `1px solid ${C.line}`, backgroundColor: isSub ? C.surfaceRaised : C.surface,
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0}}>
                    {isSub
                        ? <SubdirectoryArrowRightIcon sx={{fontSize: 14, color: C.inkFaint}}/>
                        : <ExtensionOutlinedIcon sx={{fontSize: 17, color: C.inkFaint}}/>}
                    <Typography noWrap sx={{fontSize: isSub ? 12.75 : 14, fontWeight: isSub ? 500 : 650, color: C.ink}}>{obj.title}</Typography>
                    {pub && <StatusChip isPublic/>}
                </Box>
                {u ? (
                    <LevelControl
                        state={st} isPublic={pub} compact={isSub}
                        busy={api.busy.has(`${isSub ? 's' : 'm'}:${obj.id}:${u.id}`)}
                        onChange={(lv) => api.setLevel(cur, u, lv)}
                    />
                ) : <Typography sx={{fontSize: 12, color: C.inkFaint}}>—</Typography>}
            </Box>
        );
    };

    return (
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '310px 1fr'}, gap: 2.5, alignItems: 'start'}}>
            <Box sx={{
                border: `1px solid ${C.line}`, borderRadius: '12px', backgroundColor: C.surface,
                position: {md: 'sticky'}, top: {md: 140}, display: 'flex', flexDirection: 'column',
                maxHeight: {xs: 340, md: 'calc(100vh - 170px)'},
            }}>
                <Box sx={{p: 1.25, borderBottom: `1px solid ${C.line}`}}>
                    <SearchBox value={query} onChange={setQuery} placeholder="Əməkdaş axtar"/>
                </Box>
                <Box sx={{overflowY: 'auto', p: 0.75}}>
                    {filtered.length === 0 && (
                        <Typography sx={{p: 2, fontSize: 13, color: C.inkFaint}}>Əməkdaş tapılmadı.</Typography>
                    )}
                    {filtered.map(u => {
                        const active = u.id === selectedId;
                        return (
                            <Box key={u.id} component="button" type="button" onClick={() => setSelectedId(u.id)} sx={{
                                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
                                display: 'flex', alignItems: 'center', gap: 1.1, px: 1.25, py: 0.9, borderRadius: '8px',
                                backgroundColor: active ? C.goldTint : 'transparent',
                                boxShadow: active ? `inset 3px 0 0 ${C.gold}` : 'none',
                                '&:hover': {backgroundColor: active ? C.goldTint : C.surfaceRaised},
                                '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                            }}>
                                <Avatar name={u.name || u.username} tone={active ? 'user' : 'muted'} size={30}/>
                                <Box sx={{minWidth: 0}}>
                                    <Typography noWrap sx={{fontSize: 13, fontWeight: 600, color: C.ink}}>{u.name || u.username}</Typography>
                                    <Typography noWrap sx={{fontSize: 11.5, color: C.inkFaint}}>{u.department_title || u.role_title || u.username}</Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {person ? (
                <Box sx={{border: `1px solid ${C.line}`, borderRadius: '12px', backgroundColor: C.surface, minWidth: 0, overflow: 'hidden'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, p: {xs: 2, sm: 2.5}, borderBottom: `1px solid ${C.line}`}}>
                        <Avatar name={person.name || person.username} tone="user" size={46}/>
                        <Box sx={{minWidth: 0}}>
                            <Typography sx={{fontSize: 18, fontWeight: 700, color: C.ink}}>{person.name || person.username}</Typography>
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                {[person.role_title, person.department_title].filter(Boolean).join(' · ') || person.username}
                            </Typography>
                        </Box>
                    </Box>
                    {person.implicit_access && (
                        <Box sx={{display: 'flex', gap: 1, alignItems: 'center', px: 2.5, py: 1.25, backgroundColor: C.successTint, borderBottom: `1px solid ${C.line}`}}>
                            <LockOutlinedIcon sx={{fontSize: 16, color: C.success}}/>
                            <Typography sx={{fontSize: 12.5, color: C.success, fontWeight: 600}}>
                                Bu əməkdaş inzibatçıdır - bütün modullara avtomatik girişi var.
                            </Typography>
                        </Box>
                    )}
                    {data.modules.map(m => (
                        <Box key={m.id}>
                            {row(m, false, null)}
                            {m.sub_modules?.map(s => row(s, true, m))}
                        </Box>
                    ))}
                </Box>
            ) : (
                <Typography sx={{color: C.inkMuted, fontSize: 13.5, p: 2}}>Soldan əməkdaş seçin.</Typography>
            )}
        </Box>
    );
}

/* ---------------------------------------------------------------------- */
/* Məlumatı yükləyən və dəyişiklikləri göndərən iş sahəsi                 */
/* ---------------------------------------------------------------------- */
function AccessWorkspace({organizationId, view}) {
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(() => new Set());
    const [modeBusy, setModeBusy] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = organizationId ? `?organization=${organizationId}` : '';
            const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS + params);
            const d = res.data || {};
            d.can_toggle_public = !!d.modules?.[0]?.can_toggle_public;
            setData(d);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);

    useEffect(() => { load(); }, [load]);

    /* Bir API çağırışı + lokal vəziyyətin yenilənməsi */
    async function post(target, id, userId, grant) {
        const payload = {target, id, user_id: userId, grant};
        if (organizationId) payload.organization = organizationId;
        await service_api.post(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS, payload);
        setData(prev => {
            if (!prev) return prev;
            const next = structuredClone(prev);
            const apply = (obj) => {
                obj.users = obj.users.map(u => {
                    if (u.id !== userId) return u;
                    if (target === 'module_admin') return {...u, is_module_admin: grant, has_access: grant ? true : u.has_access};
                    if (target === 'sub_module_admin') return {...u, is_sub_module_admin: grant, has_access: grant ? true : u.has_access};
                    return {...u, has_access: grant};
                });
            };
            for (const m of next.modules) {
                if ((target === 'module' || target === 'module_admin') && m.id === id) {
                    apply(m);
                    // Modul admini bütün alt modullarda avtomatik admindir
                    if (target === 'module_admin') {
                        for (const s of m.sub_modules || []) {
                            s.users = s.users.map(u => u.id === userId ? {...u, is_module_admin: grant} : u);
                        }
                    }
                }
                if (target === 'sub_module' || target === 'sub_module_admin') {
                    const sub = m.sub_modules.find(s => s.id === id);
                    if (sub) apply(sub);
                }
            }
            return next;
        });
    }

    /* Səviyyəni (none / user / admin) lazımi API addımlarına çevirir */
    async function setLevel(cur, u, nextLevel, {silent = false} = {}) {
        const {obj, isSub, parent} = cur;
        const pub = isPublicObj(obj, isSub, parent);
        const st = userLevel(u, isSub, pub);
        if (st.locked || st.level === nextLevel) return true;

        const accessT = isSub ? 'sub_module' : 'module';
        const adminT = isSub ? 'sub_module_admin' : 'module_admin';
        const steps = [];
        // Alt modula giriş üçün əsas modula da giriş lazımdır
        const ensureParent = () => {
            if (!isSub || parent.is_public) return;
            const pu = parent.users.find(x => x.id === u.id);
            if (pu && !pu.has_access && !pu.implicit_access && !pu.is_module_admin) steps.push(['module', parent.id, true]);
        };

        if (nextLevel === 'admin') {
            ensureParent();
            steps.push([adminT, obj.id, true]);
        } else if (nextLevel === 'user') {
            if (st.level === 'admin') steps.push([adminT, obj.id, false]);
            if (!pub) ensureParent();
            steps.push([accessT, obj.id, true]);
        } else {
            if (st.level === 'admin') steps.push([adminT, obj.id, false]);
            steps.push([accessT, obj.id, false]);
        }

        const key = `${isSub ? 's' : 'm'}:${obj.id}:${u.id}`;
        setBusy(prev => new Set(prev).add(key));
        try {
            for (const [t, id, g] of steps) await post(t, id, u.id, g);
            return true;
        } catch (err) {
            if (!silent) enqueueSnackbar(handleError(err), {variant: 'error'});
            return false;
        } finally {
            setBusy(prev => { const n = new Set(prev); n.delete(key); return n; });
        }
    }

    async function setPublic(module, value) {
        setModeBusy(`m:${module.id}`);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {target: 'module_public', id: module.id, grant: value});
            setData(prev => {
                const next = structuredClone(prev);
                const m = next.modules.find(x => x.id === module.id);
                if (m) m.is_public = value;
                return next;
            });
            enqueueSnackbar(value ? `«${module.title}» bütün əməkdaşlara açıldı.` : `«${module.title}» yalnız seçilmiş əməkdaşlara açıqdır.`, {variant: 'success'});
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setModeBusy(null);
        }
    }

    async function setRestricted(sub, value) {
        setModeBusy(`s:${sub.id}`);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {target: 'sub_module_restricted', id: sub.id, grant: value});
            setData(prev => {
                const next = structuredClone(prev);
                for (const m of next.modules) {
                    const s = m.sub_modules?.find(x => x.id === sub.id);
                    if (s) s.is_restricted = value;
                }
                return next;
            });
            enqueueSnackbar(value ? `«${sub.title}» yalnız seçilmiş əməkdaşlara açıqdır.` : `«${sub.title}» bütün əməkdaşlara açıldı.`, {variant: 'success'});
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setModeBusy(null);
        }
    }

    const notify = (failed, total, level) => {
        if (failed) enqueueSnackbar(`${failed} əməkdaş üçün dəyişiklik alınmadı.`, {variant: 'error'});
        else enqueueSnackbar(level === 'none' ? `${total} əməkdaşın girişi götürüldü.` : `${total} əməkdaşa giriş verildi.`, {variant: 'success'});
    };

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>;
    }
    if (!data || !data.modules?.length) {
        return (
            <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 2}}>
                Bu qurum üçün açıq heç bir modul yoxdur.
            </Typography>
        );
    }

    const api = {busy, modeBusy, setLevel, setPublic, setRestricted, notify};
    return view === 'employee'
        ? <EmployeeView data={data} api={api}/>
        : <ModuleView data={data} api={api}/>;
}

/* ---------------------------------------------------------------------- */
/* Əsas komponent                                                         */
/* ---------------------------------------------------------------------- */
export default function ModulePermissionsPage({isSuperUser}) {
    const [view, setView] = useState('module');
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [orgOptions, setOrgOptions] = useState([]);
    const [orgsLoaded, setOrgsLoaded] = useState(false);
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (!isSuperUser) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS);
                const orgs = res.data?.organizations || [];
                setOrgOptions(orgs);
                if (orgs.length >= 1) setSelectedOrgId(prev => prev || orgs[0].id);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            } finally {
                setOrgsLoaded(true);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperUser]);

    const multiOrg = isSuperUser && orgOptions.length > 1;
    const views = [
        {key: 'module', label: 'Modul üzrə', icon: <ExtensionOutlinedIcon sx={{fontSize: 17}}/>},
        {key: 'employee', label: 'Əməkdaş üzrə', icon: <PersonOutlineIcon sx={{fontSize: 18}}/>},
        ...(multiOrg ? [{key: 'orgs', label: 'Qurumlar', icon: <DomainOutlinedIcon sx={{fontSize: 17}}/>}] : []),
    ];
    const waitingOrg = isSuperUser && !selectedOrgId && !orgsLoaded;

    return (
        <Box sx={cardSx}>
            {/* Səviyyələrin qısa izahı */}
            <Box sx={{
                display: 'flex', gap: {xs: 1.25, md: 3}, flexWrap: 'wrap', alignItems: 'center',
                p: 1.5, mb: 2.5, borderRadius: '10px', backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`,
            }}>
                <Typography sx={{fontSize: 12, fontWeight: 700, color: C.ink}}>Səviyyələr:</Typography>
                {LEVEL_HELP.map(l => (
                    <Box key={l.key} sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                        <Box sx={{width: 9, height: 9, borderRadius: '50%', backgroundColor: l.color}}/>
                        <Typography sx={{fontSize: 12, color: C.inkMuted}}>
                            <b style={{color: C.ink}}>{l.title}</b> - {l.text}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2.5}}>
                <Box sx={{display: 'inline-flex', p: '4px', borderRadius: '12px', backgroundColor: C.surfaceDeep}}>
                    {views.map(v => {
                        const active = view === v.key;
                        return (
                            <Box key={v.key} component="button" type="button" onClick={() => setView(v.key)} aria-pressed={active} sx={{
                                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                px: 1.75, py: 0.8, borderRadius: '9px', fontSize: 13.5, fontWeight: active ? 700 : 550,
                                color: active ? C.ink : C.inkMuted, backgroundColor: active ? C.surface : 'transparent',
                                boxShadow: active ? '0 1px 4px rgba(10,27,54,0.12)' : 'none',
                                '&:hover': active ? {} : {color: C.ink},
                                '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                            }}>
                                {v.icon}{v.label}
                            </Box>
                        );
                    })}
                </Box>
                {multiOrg && view !== 'orgs' && (
                    <FormControl size="small" sx={{minWidth: 260, ml: {sm: 'auto'}}}>
                        <InputLabel>Qurum</InputLabel>
                        <Select label="Qurum" value={selectedOrgId || ''} onChange={(e) => setSelectedOrgId(e.target.value)}>
                            {orgOptions.map(org => <MenuItem key={org.id} value={org.id}>{org.title}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {view === 'orgs' ? (
                <OrgAccessMatrix/>
            ) : waitingOrg ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>
            ) : (
                <AccessWorkspace key={`${selectedOrgId || 'own'}`} organizationId={isSuperUser ? (selectedOrgId || null) : null} view={view}/>
            )}
        </Box>
    );
}
